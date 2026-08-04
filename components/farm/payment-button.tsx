"use client"

import { useState } from "react"
import { usePiAuth } from  "@/contexts/auth-context";
import { PRODUCT_CONFIG } from "@/lib/product-config"
import { payWithPi, getPiUid } from "@/lib/pi-direct-payment"

interface PaymentButtonProps {
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function PaymentButton({ onSuccess, onError }: PaymentButtonProps) {
  const { sdk, products, restoredPurchases } = usePiAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Find the product from the products array
  const product = products?.find(
    (p) => p.id === PRODUCT_CONFIG.PRODUCT_6a2532b7325f2077f088f4d7
  )

  // Check if product has been purchased
  const quantity =
    restoredPurchases?.find(
      (p) => p.productId === product?.id
    )?.quantity ?? 0

  if (!product) {
    return (
      <button disabled className="bg-muted text-muted-foreground px-4 py-2 rounded-lg opacity-50 cursor-not-allowed text-sm font-bold">
        منتج غير متوفر
      </button>
    )
  }

  const handlePayment = async () => {
    try {
      if (!sdk) {
        const errorMsg = "SDK غير متاح"
        setError(errorMsg)
        onError?.(errorMsg)
        return
      }

      setLoading(true)
      setError(null)
      setSuccess(false)

      try {
        console.log("[v0] Starting direct Pi payment for product:", product.id, "amount:", product.price_in_pi)
        const uid = await getPiUid()
        const result = await payWithPi({
          amount: product.price_in_pi || 1.0,
          memo: `شراء اللعبة - ${product.name}`,
          metadata: { productId: product.id, productName: product.name },
          uid,
        })

        if (result) {
          console.log("[v0] Payment successful (direct Pi):", result)
          setSuccess(true)
          onSuccess?.()
          // Reset success message after 3 seconds
          setTimeout(() => setSuccess(false), 3000)
        }
      } catch (err: any) {
        console.error("[v0] Payment error:", err)
        let errorMessage = "حدث خطأ أثناء الدفع"

        if (err?.code === "product_not_found") {
          errorMessage = "المنتج غير موجود"
        } else if (err?.code === "purchase_cancelled") {
          errorMessage = "تم إلغاء الدفع"
        } else if (err?.code === "purchase_error") {
          errorMessage = "خطأ في معالجة الدفع"
        }

        setError(errorMessage)
        onError?.(errorMessage)
      } finally {
        setLoading(false)
      }
    } catch (outerError) {
      console.error("[v0] Unexpected error in handlePayment:", outerError)
      const errorMsg = "حدث خطأ غير متوقع"
      setError(errorMsg)
      onError?.(errorMsg)
      setLoading(false)
    }
  }

  // Show already purchased message
  if (quantity > 0) {
    return (
      <div className="bg-primary/20 text-primary px-4 py-2 rounded-lg text-sm font-bold border border-primary/40 text-center">
        ✓ تم شراء اللعبة بنجاح
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handlePayment}
        disabled={loading}
        className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${
          loading
            ? "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
            : success
              ? "bg-green-600 text-white"
              : "bg-primary text-primary-foreground hover:opacity-90"
        }`}
      >
        {loading ? "جاري المعالجة..." : success ? "✓ تم الدفع بنجاح" : `💳 اشتري اللعبة - ${product.price_in_pi || 1.0} Pi`}
      </button>
      {error && (
        <div className="bg-destructive/15 border border-destructive/40 rounded-lg p-2 text-destructive text-xs font-bold text-center">
          {String(error)}
        </div>
      )}
    </div>
  )
}
