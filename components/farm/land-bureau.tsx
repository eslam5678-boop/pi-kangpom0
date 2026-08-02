"use client"

import { useFarm } from "@/contexts/farm-context"
import { EXPANDED_LAND_TIERS } from "@/lib/farm-types"
import { usePurchase } from "@/lib/pi-payment"
import { getVisualAnimationClass, getVisualAnimationStyle } from "@/lib/visual-animation"
import { useState } from "react"

// دالة تنسيق الوقت في حال عدم وجودها بداخل farm-types
function formatMs(ms: number): string {
  if (!ms || ms <= 0) return "0 ثانية"
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days} يوم`
  if (hours > 0) return `${hours} ساعة`
  if (minutes > 0) return `${minutes} دقيقة`
  return `${seconds} ثانية`
}

export function LandBureau() {
  const { state, leaseLand, isLandActive } = useFarm()
  const { makePurchase } = usePurchase()
  const [busy, setBusy] = useState<string | null>(null)
  const now = Date.now()

  const handleLease = async (tierId: string, costPi: number) => {
    if (costPi === 0) {
      leaseLand(tierId)
      return
    }
    setBusy(tierId)
    try {
      // Pi payment for paid land tiers (uses lifeline/land product as placeholder)
      await makePurchase("farm_revive")
      leaseLand(tierId)
    } catch (e) {
      // payment cancelled or unavailable — do not lease
      console.log("[v0] land lease payment failed", e)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      <header className="text-center">
        <h2 className="text-xl font-bold text-primary text-glow-gold">ديوان الأراضي</h2>
        <p className="text-xs text-muted-foreground">استأجر الأراضي لتوسعة مزرعتك الملكية</p>
      </header>

      <div className="space-y-3">
        {EXPANDED_LAND_TIERS.map((tier) => {
          const lease = state.leases.find((l) => l.id === tier.id)
          const active = isLandActive(tier.id)
          const count = state.assets.filter((a) => a.landId === tier.id && !a.dead).length
          const expired = lease?.leased && !active
          const costPi = (tier as any).costPi ?? (tier as any).cost ?? (tier as any).price ?? 0
          const requirementLease = tier.requiredTierId ? state.leases.find((l) => l.id === tier.requiredTierId) : undefined
          const requirementMet = !tier.requiredTierId || !!(requirementLease?.leased || isLandActive(tier.requiredTierId))
          const canInteract = requirementMet && !busy

          return (
            <div
              key={tier.id}
              className={`rounded-xl border-2 p-4 ${
                active ? "border-secondary/50 glow-mint bg-card" : "border-border bg-card"
              } ${getVisualAnimationClass({ preset: active ? "royal" : "card", intensity: active ? "strong" : "subtle" })}`}
              style={getVisualAnimationStyle({ preset: active ? "royal" : "card", intensity: active ? "strong" : "subtle" })}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    {tier.id === "royal" ? "👑" : tier.id === "pasha" ? "🏛️" : tier.id === "estate" ? "🌾" : "🏘️"}
                    {tier.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">{tier.blurb || (tier as any).description || ""}</p>
                  {!requirementMet && (
                    <p className="text-[11px] text-primary mt-1 font-semibold">
                      يُفتح بعد: {tier.requiredTierId ? tier.requiredTierId : "البدء"}
                    </p>
                  )}
                  {active && (
                    <p className="text-[11px] text-secondary mt-1 font-semibold">
                      {count}/{tier.cap} أصل
                      {lease?.expiresAt
                        ? ` • تنتهي خلال ${formatMs(lease.expiresAt - now)}`
                        : " • دائم"}
                    </p>
                  )}
                  {expired && (
                    <p className="text-[11px] text-destructive mt-1 font-semibold">
                      انتهى الإيجار — الإنتاج متوقف! جدّد الآن.
                    </p>
                  )}
                </div>
                <div className="text-left shrink-0">
                  <div className="text-primary font-bold">
                    {costPi === 0 ? "مجاني" : `${costPi} π`}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{(tier as any).period}</div>
                </div>
              </div>

              {active && !expired ? (
                <div className="mt-3 text-center text-xs font-bold text-secondary">✓ مُفعّلة</div>
              ) : (
                <button
                  disabled={busy === tier.id || !requirementMet}
                  onClick={() => handleLease(tier.id, costPi)}
                  className="mt-3 w-full bg-primary text-primary-foreground font-bold rounded-lg py-2.5 text-sm disabled:opacity-50 active:scale-95 transition-transform"
                >
                  {busy === tier.id
                    ? "جارٍ الدفع عبر باي..."
                    : !requirementMet
                      ? "مقفل — يلزم مستوى سابق"
                      : expired
                        ? "تجديد الإيجار"
                        : costPi === 0
                          ? "تفعيل مجاني"
                          : `استئجار بـ ${costPi} باي`}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
