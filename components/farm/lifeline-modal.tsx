"use client"

import { useState } from "react"
import { useFarm } from "@/contexts/farm-context"
import { assetDef, type OwnedAsset } from "@/lib/farm-types"
import { usePurchase, useAds } from "@/lib/pi-payment"
import { payWithPi } from "@/lib/pi-direct-payment"

// تعريف الثوابت محلياً لتجنب مشاكل التصدير من ملف الأنواع
const REVIVE_ADS_REQUIRED = 3
const REVIVE_PI_COST = 0.5
const LIFELINE_PRODUCT_ID = "lifeline_revive"
const LIFELINE_MEMO = "Lifeline: Revive dead asset"

export function LifelineModal({
  asset,
  onClose,
}: {
  asset: OwnedAsset
  onClose: () => void
}) {
  const { state, reviveAsset, watchAd } = useFarm()
  const { makePurchase } = usePurchase()
  const { showRewarded } = useAds()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const def = assetDef(asset.defId)
  const ads = state.adsWatchedToday

  const handleAd = async () => {
    setBusy(true)
    setError("")
    try {
      const ok = await showRewarded(LIFELINE_PRODUCT_ID)
      // Even if ad network unsupported, count the attempt as a fallback
      watchAd()
      if (ads + 1 >= REVIVE_ADS_REQUIRED) {
        reviveAsset(asset.uid)
        onClose()
      }
      void ok
    } catch (e) {
      console.log("[v0] ad failed", e)
      watchAd()
      if (ads + 1 >= REVIVE_ADS_REQUIRED) {
        reviveAsset(asset.uid)
        onClose()
      }
    } finally {
      setBusy(false)
    }
  }

const handlePay = async () => {
    setBusy(true)
    setError("")
    try {
      // لا await قبل استدعاء الدفع — payWithPi يفتح واجهة الدفع في نفس لحظة الضغطة
      await payWithPi({
        productSlug: LIFELINE_PRODUCT_ID,
        amount: REVIVE_PI_COST,
        memo: LIFELINE_MEMO,
        metadata: {
          assetUid: asset.uid,
          action: "revive",
          productId: LIFELINE_PRODUCT_ID,
          product: LIFELINE_PRODUCT_ID,
          amount: REVIVE_PI_COST,
        },
      })
      reviveAsset(asset.uid)
      onClose()
    } catch (e) {
      console.log("[v0] revive payment failed", e)
      setError("تعذّر إتمام الدفع عبر باي. حاول مجدداً.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/90 backdrop-blur p-4">
      <div className="w-full max-w-sm bg-card rounded-2xl border-2 border-primary/40 glow-gold p-5 space-y-4 text-center">
        <div className="text-5xl grayscale">{def.emoji}</div>
        <h3 className="text-lg font-bold text-primary text-glow-gold">شريان حياة عم شاهين</h3>
        <p className="text-xs text-muted-foreground">
          لقد نفق {def.name}. أعِده للحياة عبر مشاهدة الإعلانات أو الدفع بعملة باي.
        </p>

        <div className="bg-background rounded-xl p-3 space-y-3">
          <div className="text-sm font-bold text-foreground">
            الإعلانات المُشاهدة: {ads}/{REVIVE_ADS_REQUIRED}
          </div>
          <div className="flex justify-center gap-1.5">
            {Array.from({ length: REVIVE_ADS_REQUIRED }).map((_, i) => (
              <span
                key={i}
                className={`w-3 h-3 rounded-full ${i < ads ? "bg-secondary" : "bg-muted"}`}
              />
            ))}
          </div>
          <button
            disabled={busy}
            onClick={handleAd}
            className="w-full bg-secondary text-secondary-foreground font-bold rounded-lg py-2.5 text-sm disabled:opacity-50 active:scale-95"
          >
            📺 مشاهدة إعلان ({REVIVE_ADS_REQUIRED - ads} متبقٍ)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">أو</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button
          disabled={busy}
          onClick={handlePay}
          className="w-full bg-primary text-primary-foreground font-bold rounded-lg py-3 text-sm disabled:opacity-50 active:scale-95 animate-pulse-gold"
        >
          {busy ? "جارٍ المعالجة..." : `الدفع الفوري ${REVIVE_PI_COST} باي`}
        </button>

        {error && <p className="text-xs text-destructive">{String(error)}</p>}

        <button onClick={onClose} className="text-xs text-muted-foreground underline">
          لاحقاً
        </button>
      </div>
    </div>
  )
}
