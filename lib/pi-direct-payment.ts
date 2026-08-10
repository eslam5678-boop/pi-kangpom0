"use client";

/**
 * Unified Pi payment service.
 *
 * This module is the SINGLE payment entry point for every Pi environment and
 * automatically picks the best available method in the SAME user-gesture tick:
 *
 *   1. SDKLite `makePurchase(productSlug)` → Pi App Studio (SDKLite owns
 *      payments there; product price comes from the App Studio catalog).
 *   2. Legacy `Pi.createPayment`           → Pi Browser (classic apps) with the
 *      standard callbacks required by the Pi SDK v2.x:
 *        - onReadyForServerApproval  → POST /api/auth/pi { action: "approve", paymentId }
 *        - onReadyForServerCompletion → POST /api/auth/pi { action: "complete", paymentId, txid }
 *        - onCancel                  → user cancelled
 *        - onError                   → payment/backend error
 *
 * Authentication happens at app entry (auth-context) and the uid is cached
 * synchronously, so a click handler can invoke payWithPi() as its FIRST
 * statement with NO await before it — the Pi payment UI opens immediately
 * in the same tick as the click.
 */

// ---------------------------------------------------------------------------
// Synchronous payment context (populated once during authentication)
// ---------------------------------------------------------------------------

let cachedPiUid: string | undefined;
let piSdkInstance: unknown = null;

/** Cache the Pi user's uid right after authentication (synchronous read later). */
export function setCachedPiUid(uid: string | undefined): void {
  cachedPiUid = uid;
}

/** Read the cached uid synchronously — never await this inside a click handler. */
export function getCachedPiUid(): string | undefined {
  return cachedPiUid;
}

/** Register the authenticated SDKLite instance (Pi App Studio path). */
export function setPiSdk(sdk: unknown): void {
  piSdkInstance = sdk;
  if (sdk) console.log("[PiPay] SDKLite instance registered for payments");
}

/** Read the registered SDKLite instance synchronously. */
export function getPiSdk(): unknown {
  return piSdkInstance;
}

export interface PiPaymentData {
  amount: number;
  memo: string;
  metadata?: Record<string, unknown>;
  uid?: string;
  /** Pi App Studio product slug (SDKLite). When provided, SDKLite is preferred. */
  productSlug?: string;
}

export interface PiPaymentResult {
  paymentId: string;
  txid: string;
  productId?: string;
  method: "sdklite" | "direct";
}

export interface ApiRouteResult {
  success: boolean;
  data?: unknown;
  error?: string;
  details?: string;
}

type PaymentCallbacks = {
  onReadyForServerApproval: (paymentId: string) => void;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  onCancel: (paymentId: string) => void;
  onError: (error: Error, payment?: unknown) => void;
};

interface PiPayment {
  paymentId: string;
  txid?: string;
  status?: string;
}

interface PiSDK {
  createPayment: (
    paymentData: {
      amount: number;
      memo: string;
      metadata?: Record<string, unknown>;
      uid?: string;
    },
    callbacks: PaymentCallbacks
  ) => void;
  user?: {
    getMe?: () => Promise<{ uid?: string; username?: string }>;
  };
  init?: (config: { version: string; sandbox?: boolean }) => Promise<void>;
}

/**
 * Get the current Pi user's uid (used for the payment `metadata`/`uid`).
 */
export async function getPiUid(): Promise<string | undefined> {
  try {
    if (typeof window === "undefined") return undefined;
    const pi = (window as unknown as { Pi?: PiSDK }).Pi;
    if (pi?.user?.getMe) {
      const me = await pi.user.getMe();
      if (me?.uid) {
        setCachedPiUid(me.uid);
        return me.uid;
      }
    }
    return getCachedPiUid();
  } catch (e) {
    console.error("[PiPay] getPiUid failed:", e);
    return getCachedPiUid();
  }
}

function getWindowPi(): PiSDK | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { Pi?: PiSDK }).Pi;
}

/** Normalize an SDKLite / legacy error into a common shape with a stable `code`. */
function normalizePiError(e: unknown): Error {
  const err = e instanceof Error ? e : new Error(String(e));
  const code = (e as { code?: string })?.code;
  const name = (e as { name?: string })?.name;
  const sdkCode = name === "SDKLiteError" ? code : undefined;
  const finalCode =
    code === "purchase_cancelled" || sdkCode === "purchase_cancelled"
      ? "purchase_cancelled"
      : code === "product_not_found" || sdkCode === "product_not_found"
        ? "product_not_found"
        : code === "pi_sdk_unavailable"
          ? "pi_sdk_unavailable"
          : undefined;
  if (finalCode) (err as { code?: string }).code = finalCode;
  return err;
}

/**
 * Call the local Next.js API route `/api/auth/pi` for approve/complete.
 */
async function callApiRoute(payload: Record<string, unknown>): Promise<ApiRouteResult> {
  console.log("[PiPay] callApiRoute payload:", payload);
  const res = await fetch("/api/auth/pi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = (await res.json().catch(() => ({}))) as ApiRouteResult;
  console.log("[PiPay] callApiRoute response:", res.status, json);
  if (!res.ok || json.success === false) {
    const err = new Error(json.error || json.details || `API error ${res.status}`);
    (err as { status?: number }).status = res.status;
    throw err;
  }
  return json;
}

/**
 * Open the Pi Wallet payment flow and return a promise that resolves when the
 * payment reaches a completed state (or rejects on cancel/error).
 *
 * @param data - amount (Pi), memo, metadata, optional uid
 * @returns a resolved object on completion, or rejects with an error
 */
/** Legacy Pi Browser path: `Pi.createPayment(paymentData, callbacks)` — invoked synchronously. */
function createLegacyPayment(
  pi: PiSDK,
  paymentData: { amount: number; memo: string; metadata: Record<string, unknown>; uid?: string }
): Promise<PiPaymentResult> {
  return new Promise((resolve, reject) => {
    const callbacks: PaymentCallbacks = {
      onReadyForServerApproval: async (paymentId: string) => {
        try {
          console.log("[PiPay] onReadyForServerApproval", paymentId);
          await callApiRoute({ action: "approve", paymentId });
        } catch (e) {
          console.error("[PiPay] Approve failed (will continue to completion):", e);
        }
      },
      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        try {
          console.log("[PiPay] onReadyForServerCompletion", paymentId, txid);
          await callApiRoute({ action: "complete", paymentId, txid });
          resolve({ paymentId, txid, method: "direct" });
        } catch (e) {
          console.error("[PiPay] Complete call failed:", e);
          reject(e instanceof Error ? e : new Error("Finalize failed"));
        }
      },
      onCancel: (paymentId: string) => {
        console.log("[PiPay] onCancel", paymentId);
        const err = new Error("Payment cancelled by user");
        (err as { code?: string }).code = "purchase_cancelled";
        reject(err);
      },
      onError: (error: Error, payment?: unknown) => {
        console.error("[PiPay] onError", error, payment);
        const err = error instanceof Error ? error : new Error("Unexpected Pi payment error");
        if (err.message === "User cancelled") {
          (err as { code?: string }).code = "purchase_cancelled";
        }
        reject(err);
      },
    };
    try {
      console.log("[PiPay] Calling Pi.createPayment", paymentData);
      pi.createPayment(paymentData, callbacks);
    } catch (e) {
      // Some SDK versions throw synchronously on invalid input.
      console.error("[PiPay] Pi.createPayment threw synchronously:", e);
      reject(e instanceof Error ? e : new Error("Pi.createPayment threw synchronously"));
    }
  });
}

/** Pi App Studio path: SDKLite `makePurchase(productSlug)` — invoked synchronously. */
async function purchaseWithSdklite(
  sdk: unknown,
  productSlug: string
): Promise<PiPaymentResult> {
  const makePurchase = (sdk as {
    makePurchase: (slug: string) => Promise<{
      ok: boolean;
      paymentId: string;
      txid: string;
      productId?: string;
    }>;
  }).makePurchase;
  const result = await makePurchase(productSlug);
  if (!result || !result.ok) {
    throw new Error(`SDKLite purchase failed for product '${productSlug}'`);
  }
  return {
    paymentId: result.paymentId,
    txid: result.txid,
    productId: result.productId || productSlug,
    method: "sdklite",
  };
}

/**
 * Unified payment entry point — call this as the FIRST statement inside your
 * click handler with NO await before it.
 *
 * Authentication already happened at app entry, the uid is cached
 * synchronously, and this function invokes the appropriate Pi API in the SAME
 * user-gesture tick:
 *
 *   1. SDKLite `makePurchase`    → Pi App Studio (product catalog).
 *   2. Legacy `Pi.createPayment` → Pi Browser classic apps.
 *
 * Resolves on server-side completion; rejects with a normalized Error carrying
 * a stable `code`: `purchase_cancelled` | `product_not_found` | `pi_sdk_unavailable`.
 */
export async function payWithPi(data: PiPaymentData): Promise<PiPaymentResult> {
  if (typeof window === "undefined") {
    throw new Error("Pi SDK is only available in the browser");
  }

  // Resolve uid synchronously from the auth-time cache — NEVER awaited here.
  const uid = data.uid || getCachedPiUid();
  const paymentData = {
    amount: data.amount,
    memo: data.memo || "Pi Kingdom Farm purchase",
    metadata: data.metadata || {},
    ...(uid ? { uid } : {}),
  };

  const sdk = getPiSdk();
  const pi = getWindowPi();

  // 1) Pi App Studio path (SDKLite owns payments there).
  if (sdk && data.productSlug) {
    try {
      return await purchaseWithSdklite(sdk, data.productSlug);
    } catch (e) {
      const code = (e as { code?: string })?.code;
      const isMissingProduct =
        (e as { name?: string })?.name === "SDKLiteError" && code === "product_not_found";
      // Only fall back to the legacy path when this environment can also use it.
      if (!isMissingProduct || !pi || typeof pi.createPayment !== "function") {
        throw normalizePiError(e);
      }
      console.warn("[PiPay] SDKLite product not found; falling back to legacy Pi.createPayment");
    }
  }

  // 2) Pi Browser path (legacy v2 SDK).
  if (pi && typeof pi.createPayment === "function") {
    return createLegacyPayment(pi, paymentData);
  }

  // 3) Nothing available in this environment.
  const isPiBrowser =
    typeof navigator !== "undefined" &&
    /pi\s*browser|pibrowser/i.test(navigator.userAgent || "");
  const sdkScriptLoaded = !!document.querySelector(
    'script[src*="sdk.minepi.com"], script[src*="pi-sdk.js"]'
  );
  const err = new Error(
    "Pi payment unavailable." +
      (sdk ? "" : " SDKLite missing.") +
      (pi ? "" : " Pi SDK missing.") +
      (isPiBrowser ? " (Pi Browser detected)" : " (not in Pi Browser)") +
      (sdkScriptLoaded ? " - SDK script found in DOM" : " - SDK script NOT found in DOM")
  );
  (err as { code?: string }).code = "pi_payment_unavailable";
  console.error("[PiPay] No payment method available in this environment.", {
    sdkAvailable: !!sdk,
    piAvailable: !!pi,
    createPaymentAvailable: typeof pi?.createPayment,
    isPiBrowser,
    sdkScriptLoaded,
  });
  throw err;
}

/** Minimal reference type for the payment object (kept for clarity). */
export type { PiPayment };
