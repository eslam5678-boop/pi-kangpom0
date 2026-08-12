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
  signOut?: () => void | Promise<void>;
  authenticated?: boolean;
  consentedScopes?: string[];
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
  const sdklite = sdk as {
    makePurchase: (slug: string) => Promise<{
      ok: boolean;
      paymentId: string;
      txid: string;
      productId?: string;
    }>;
  };
  if (!sdklite || typeof sdklite.makePurchase !== "function") {
    const err = new Error("SDKLite makePurchase is unavailable");
    (err as { code?: string }).code = "pi_sdk_unavailable";
    throw err;
  }
  // مهم: استدعاء كطريقة على الكائن نفسه (method call) للحفاظ على `this`
  // جوه SDKLite — لو استدعيناها "منفصلة" بتبقى this=undefined فيكسر login().
  const result = await sdklite.makePurchase(productSlug);
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

/** يرمي خطأ بحمل رسالة عربية واضحة للمستخدم + كود برمجي للمعالجة. */
function throwPiError(code: string, message: string): never {
  const err = new Error(message);
  (err as { code?: string }).code = code;
  throw err;
}

/**
 * هل يمكن استخدام مسار Pi.createPayment القديم بأمان؟
 * شرط صارم: تسجيل دخول + صلاحية "payments" موجودة في consentedScopes.
 * لو مش كده، ممنوع نهائيًا استدعاء createPayment.
 */
function canUseLegacy(pi: PiSDK | undefined): boolean {
  return (
    !!pi &&
    typeof pi.createPayment === "function" &&
    pi.authenticated === true &&
    Array.isArray(pi.consentedScopes) &&
    pi.consentedScopes.includes("payments")
  );
}

/** مهلة لأي عملية خارجية (مثل SDKLite) كي لا تعلق ضغطة الشراء. */
function promiseWithTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

/** رابط فتح اللعبة مباشرة داخل Pi Browser (deep link). */
function getPiDeepLink(): string {
  if (typeof window === "undefined") return "";
  return `pi://${window.location.host}${window.location.pathname || "/"}`;
}

/**
 * Unified payment entry point — call this as the FIRST statement inside your
 * click handler with NO await before it.
 *
 * Pi.init + Pi.authenticate happen at app entry (see auth-context) in EVERY
 * environment — the official SDK is never skipped because the app is in an
 * iframe. Here we only pick the right payment layer in the SAME tick:
 *
 *   1. Pi SDK v2 `Pi.createPayment` — أولوية قصوى متى ما كانت الجلسة مصادقة
 *      وتحتوي consent على صلاحية "payments" (أول سطر صريح).
 *   2. SDKLite `makePurchase` — مسار منتجات App Studio (فقط لو الـ v2 غير جاهز).
 *   3. تنبيه محترم برابط pi:// بدل أي خطأ تقني/انهيار.
 *
 * Rejects with a normalized Error carrying a stable `code`:
 *   `purchase_cancelled` | `product_not_found` | `payments_scope_missing`
 *   | `pi_environment_missing` | `pi_payment_unavailable`
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
  const deepLink = getPiDeepLink();

  // ------------------------------------------------------------
  // 0) لا يوجد أي كائن دفع في هذه البيئة إطلاقًا
  // ------------------------------------------------------------
  if (!pi && !sdk) {
    throwPiError(
      "pi_payment_unavailable",
      `لا توجد محفظة باي (window.Pi) في هذه البيئة. افتح اللعبة مباشرة داخل تطبيق Pi Browser عبر:\n${deepLink}`
    );
  }

  // ------------------------------------------------------------
  // 1) Pi SDK v2 — Pi.createPayment (أولوية قصوى؛ أول سطر في نفس tick الضغطة)
  //    شرط صارم: جلسة مصادقة + صلاحية "payments" موجودة فعلًا.
  // ------------------------------------------------------------
  if (canUseLegacy(pi)) {
    return createLegacyPayment(pi as PiSDK, paymentData);
  }

  // ------------------------------------------------------------
  // 2) App Studio — SDKLite makePurchase (ثانوي وبحد أقصى 15 ثانية)
  // ------------------------------------------------------------
  if (sdk && data.productSlug) {
    try {
      return await promiseWithTimeout(
        purchaseWithSdklite(sdk, data.productSlug),
        15000,
        "SDKLite.makePurchase"
      );
    } catch (e) {
      if (/Pi is not defined|is not defined/i.test(String(e))) {
        // SDKLite داخليًا بيحتاج window.Pi — لو مش متاح نوجّه المستخدم بلطف.
        throwPiError(
          "pi_environment_missing",
          `لا توجد محفظة باي في بيئة App Studio الحالية — افتح اللعبة مباشرة داخل تطبيق Pi Browser عبر:\n${deepLink}`
        );
      }
      const code = (e as { code?: string })?.code;
      const isMissingProduct =
        (e as { name?: string })?.name === "SDKLiteError" && code === "product_not_found";
      if (!isMissingProduct || !canUseLegacy(pi)) {
        throw normalizePiError(e);
      }
      console.warn("[PiPay] SDKLite product not found; falling back to legacy Pi.createPayment");
    }
  }

  // ------------------------------------------------------------
  // 3) لو الجلسة بقت جاهزة أثناء محاولاتنا — نكمل بالـ v2
  // ------------------------------------------------------------
  if (canUseLegacy(pi)) {
    return createLegacyPayment(pi as PiSDK, paymentData);
  }

  // ------------------------------------------------------------
  // 4) تنبيه محترم (ممنوع استدعاء createPayment بدون صلاحية payments)
  // ------------------------------------------------------------
  if (pi && typeof pi.createPayment === "function") {
    throwPiError(
      "payments_scope_missing",
      pi.authenticated === true
        ? `لم يتم منح صلاحية الدفع (payments) بعد. افتح اللعبة مباشرة داخل تطبيق Pi Browser عبر:\n${deepLink}\nووافق على صلاحيات الدفع ثم أعد المحاولة.`
        : `لم يتم تسجيل الدخول إلى باي (اللعبة شغالة كضيف). افتح اللعبة مباشرة داخل تطبيق Pi Browser عبر:\n${deepLink}\nوسجّل الدخول ثم أعد المحاولة.`
    );
  }

  const isPiBrowser =
    typeof navigator !== "undefined" &&
    /pi\s*browser|pibrowser/i.test(navigator.userAgent || "");
  console.error("[PiPay] No usable payment method in this environment.", {
    sdkAvailable: !!sdk,
    piAvailable: !!pi,
    createPaymentAvailable: typeof pi?.createPayment,
    isPiBrowser,
  });
  throwPiError(
    "pi_payment_unavailable",
    `لا توجد طريقة دفع متاحة في هذه البيئة. افتح اللعبة داخل تطبيق Pi Browser عبر:\n${deepLink}`
  );
}

/** Minimal reference type for the payment object (kept for clarity). */
export type { PiPayment };
