import { NextResponse } from "next/server";

// The developer's configured Pi payment product (Lifeline / Revive dead asset).
// Server-side source of truth — the client may NOT override the price.
const LIFELINE_PRODUCT = {
  productId: "lifeline_revive",
  amount: 0.5,
  memo: "Lifeline: Revive dead asset",
} as const;

/**
 * Validate a Lifeline payment request against the server-side product definition.
 * Returns an error message string when invalid, or null when valid.
 * Arbitrary client-provided amounts/memos/productIds are rejected.
 */
function validateLifelinePayment(body: Record<string, unknown>): string | null {
  const metadata = (body.metadata && typeof body.metadata === "object" ? body.metadata : {}) as Record<string, unknown>;
  const clientProductId = (body.productId as string) || (metadata.productId as string) || (metadata.product as string);
  const clientAmount = typeof body.amount === "number" ? body.amount : Number(body.amount);
  const clientMemo = body.memo as string;

  if (clientProductId && clientProductId !== LIFELINE_PRODUCT.productId) {
    return `Invalid product: expected '${LIFELINE_PRODUCT.productId}', got '${clientProductId}'`;
  }
  if (typeof clientAmount === "number" && !Number.isNaN(clientAmount)) {
    if (Math.abs(clientAmount - LIFELINE_PRODUCT.amount) > 1e-9) {
      return `Invalid amount: expected ${LIFELINE_PRODUCT.amount} Pi, got ${clientAmount}`;
    }
  }
  if (clientMemo && clientMemo !== LIFELINE_PRODUCT.memo) {
    return `Invalid memo: expected '${LIFELINE_PRODUCT.memo}'`;
  }
  return null;
}

// Server-side logging helper (visible in Vercel function logs)
function logServer(prefix: string, data: Record<string, unknown>) {
  console.log(`[api/auth/pi] ${prefix}`, JSON.stringify({ time: new Date().toISOString(), ...data }));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    logServer("request", { action, hasBody: !!body });

    // Preferred: PI_NETWORK_API_KEY; backwards-compatible fallback: PI_API_KEY.
    // Remains server-side only — never exposed to the browser.
    const piApiKey =
      process.env.PI_NETWORK_API_KEY ||
      process.env.PI_API_KEY;
    logServer("config", {
      piNetworkApiKeyPresent: !!process.env.PI_NETWORK_API_KEY,
      piApiKeyPresent: !!process.env.PI_API_KEY,
      piApiKeyLength: piApiKey ? piApiKey.length : 0,
    });

    switch (action) {
      // -------------------------------------------------------------
      // 1. تسجيل الدخول والتحقق من التوكن (Auth)
      // -------------------------------------------------------------
      case "auth": {
        const { accessToken } = body;

        if (!accessToken) {
          return NextResponse.json(
            { error: "Access token is required" },
            { status: 400 }
          );
        }

        const piResponse = await fetch("https://api.minepi.com/v2/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!piResponse.ok) {
          const errorText = await piResponse.text();
          return NextResponse.json(
            { error: "Failed to validate token with Pi Network", details: errorText },
            { status: piResponse.status }
          );
        }

        const userData = await piResponse.json();

        return NextResponse.json({
          success: true,
          user: {
            uid: userData.uid,
            username: userData.username,
          },
        });
      }

      // -------------------------------------------------------------
      // 2. موافقة السيرفر على الشراء (Approve)
      // -------------------------------------------------------------
      case "approve": {
        const { paymentId } = body;

        if (!paymentId) {
          return NextResponse.json(
            { error: "Payment ID is required" },
            { status: 400 }
          );
        }

        // Validate the Lifeline product when product details are supplied.
        // Arbitrary client-provided amounts/memos/productIds are rejected.
        const approveValidationError = validateLifelinePayment(body);
        if (approveValidationError) {
          return NextResponse.json(
            { error: approveValidationError },
            { status: 400 }
          );
        }

        if (!piApiKey) {
          return NextResponse.json(
            {
              error: "PI_API_KEY missing in server environment",
              details:
                "Add PI_API_KEY to .env.local (or your Vercel/Server Environment Variables). Get it from Pi Developer Dashboard → Your App → API Keys.",
            },
            { status: 500 }
          );
        }

        const piResponse = await fetch(
          `https://api.minepi.com/v2/payments/${paymentId}/approve`,
          {
            method: "POST",
            headers: {
              Authorization: `Key ${piApiKey}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!piResponse.ok) {
          const errorText = await piResponse.text();
          logServer("approve_error", {
            paymentId,
            status: piResponse.status,
            piApiResponse: errorText.slice(0, 500),
          });
          return NextResponse.json(
            { error: "Failed to approve payment", details: errorText },
            { status: piResponse.status }
          );
        }

        const data = await piResponse.json();
        logServer("approve_success", { paymentId, status: piResponse.status });
        return NextResponse.json({ success: true, data });
      }

      // -------------------------------------------------------------
      // 3. إكمال المعاملة وتسليم الأصول (Complete)
      // -------------------------------------------------------------
      case "complete": {
        const { paymentId, txid } = body;

        if (!paymentId || !txid) {
          return NextResponse.json(
            { error: "Payment ID and TxID are required" },
            { status: 400 }
          );
        }

        // Validate the Lifeline product when product details are supplied.
        // Arbitrary client-provided amounts/memos/productIds are rejected.
        const completeValidationError = validateLifelinePayment(body);
        if (completeValidationError) {
          return NextResponse.json(
            { error: completeValidationError },
            { status: 400 }
          );
        }

        if (!piApiKey) {
          return NextResponse.json(
            {
              error: "PI_API_KEY missing in server environment",
              details:
                "Add PI_API_KEY to .env.local (or your Vercel/Server Environment Variables). Get it from Pi Developer Dashboard → Your App → API Keys.",
            },
            { status: 500 }
          );
        }

        const piResponse = await fetch(
          `https://api.minepi.com/v2/payments/${paymentId}/complete`,
          {
            method: "POST",
            headers: {
              Authorization: `Key ${piApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ txid }),
          }
        );

        if (!piResponse.ok) {
          const errorText = await piResponse.text();
          return NextResponse.json(
            { error: "Failed to complete payment", details: errorText },
            { status: piResponse.status }
          );
        }

        const data = await piResponse.json();
        return NextResponse.json({ success: true, data });
      }

      // -------------------------------------------------------------
      // في حالة إرسال action غير معروف
      // -------------------------------------------------------------
      default:
        return NextResponse.json(
          { error: "Invalid action. Use 'auth', 'approve', or 'complete'" },
          { status: 400 }
        );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}