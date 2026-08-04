"use client";

/**
 * Direct Pi Network payment service.
 *
 * This module bypasses SDKLite's `makePurchase()` and calls `window.Pi.createPayment`
 * directly with the standard callbacks required by the Pi Network SDK v2.x:
 *
 *   - onReadyForServerApproval  → POST /api/auth/pi { action: "approve", paymentId }
 *   - onReadyForServerCompletion → POST /api/auth/pi { action: "complete", paymentId, txid }
 *   - onCancel                   → user cancelled
 *   - onError                    → payment/backend error
 *
 * The Pi Wallet window opens inside the Pi Browser when `Pi.createPayment` is invoked.
 */

export interface PiPaymentData {
  amount: number;
  memo: string;
  metadata?: Record<string, unknown>;
  uid?: string;
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
      return me?.uid;
    }
    return undefined;
  } catch (e) {
    console.error("[PiPay] getPiUid failed:", e);
    return undefined;
  }
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
export function payWithPi(data: PiPaymentData): Promise<{ paymentId: string; txid: string }> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Pi SDK is only available in the browser"));
      return;
    }

    const pi = (window as unknown as { Pi?: PiSDK }).Pi;
    if (!pi || typeof pi.createPayment !== "function") {
      // Detailed diagnostics so the exact cause is visible in console.
      const isPiBrowser =
        typeof navigator !== "undefined" &&
        /pi\s*browser|pibrowser/i.test(navigator.userAgent || "");
      const sdkScriptLoaded = !!document.querySelector(
        'script[src*="sdk.minepi.com"], script[src*="pi-sdk.js"]'
      );
      const err = new Error(
        "Pi SDK not loaded or createPayment unavailable" +
          (isPiBrowser ? " (Pi Browser detected)" : " (not in Pi Browser)") +
          (sdkScriptLoaded
            ? " - SDK script element found in DOM"
            : " - SDK script element NOT found in DOM")
      );
      (err as { code?: string }).code = "pi_sdk_unavailable";
      console.error("[PiPay] SDK unavailable. Check CSP headers block the Pi SDK script.", {
        piAvailable: !!pi,
        createPaymentAvailable: typeof pi?.createPayment,
        isPiBrowser,
        sdkScriptLoaded,
      });
      reject(err);
      return;
    }

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
          resolve({ paymentId, txid });
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

    const paymentData = {
      amount: data.amount,
      memo: data.memo || "Pi Kingdom Farm purchase",
      metadata: data.metadata || {},
      ...(data.uid ? { uid: data.uid } : {}),
    };

console.log("[PiPay] Calling Pi.createPayment", paymentData);
    try {
      pi.createPayment(paymentData, callbacks);
    } catch (e) {
      // Some SDK versions throw synchronously on invalid input.
      console.error("[PiPay] Pi.createPayment threw synchronously:", e);
      reject(e instanceof Error ? e : new Error("Pi.createPayment threw synchronously"));
    }
  });
}

/** Minimal reference type for the payment object (kept for clarity). */
export type { PiPayment };
