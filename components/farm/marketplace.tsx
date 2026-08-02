"use client"

import { useState } from "react"
import { useFarm } from "@/contexts/farm-context"
import { ASSETS, assetDef } from "@/lib/farm-types"
import { usePurchase } from "@/lib/pi-payment"
import { getVisualAnimationClass, getVisualAnimationStyle } from "@/lib/visual-animation"
import { ShaheenCaptcha } from "./shaheen-captcha"

// تعريف ثابت رسوم السوق محلياً لتجنب مشاكل الاستيراد
const MARKET_FEE = 0.05

export function Marketplace() {
  const { state, buyAsset, unlistListing, unlockService } = useFarm()
  const { makePurchase } = usePurchase()
  const [tab, setTab] = useState<"buy" | "shop">("buy")
  const [unlockingService, setUnlockingService] = useState<string | null>(null)
  const [pending, setPending] = useState<null | { defId: string; price: number; listingId?: string }>(null)
  const [toast, setToast] = useState("")

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(""), 2200)
  }

  const premiumServices = [
    { id: "market_p2p", title: "بوابة التبادل P2P", description: "فتح مستوى السوق المتقدم", pricePi: 2.5, requiredTier: "municipal", icon: "🪙" },
    { id: "royal_exchange", title: "صندوق التبادل الملكي", description: "فتح خدمات تداول ذهبي/باي", pricePi: 4.5, requiredTier: "farmer", icon: "🏺" },
    { id: "factory_hub", title: "مركز المصانع الملكي", description: "فتح خدمات إنتاج متقدمة", pricePi: 6.5, requiredTier: "pasha", icon: "🏭" },
    { id: "crown_ledger", title: "دفتر الملكية", description: "فتح سجل أراضٍ ومعالم متقدم", pricePi: 8.5, requiredTier: "royal", icon: "👑" },
  ]

  const confirmBuy = () => {
    if (!pending) return
    const total = Math.ceil(pending.price * (1 + MARKET_FEE))
    const ok = buyAsset(pending.defId, total, pending.listingId)
    showToast(ok ? "تم الشراء عبر الضمان بنجاح!" : "رصيد غير كافٍ أو لا توجد أرض متاحة")
    setPending(null)
  }

  const handleUnlockService = async (service: (typeof premiumServices)[number]) => {
    if (state.unlockedServices?.includes(service.id)) return
    setUnlockingService(service.id)
    try {
      await makePurchase("farm_revive")
      unlockService(service.id)
      showToast(`تم فتح ${service.title} بنجاح`)
    } catch (error) {
      console.log("[v0] premium service unlock failed", error)
      showToast("تعذر فتح الخدمة حالياً")
    } finally {
      setUnlockingService(null)
    }
  }

  return (
    <div className="space-y-4">
      <header className="text-center">
        <h2 className="text-xl font-bold text-primary text-glow-gold">سوق المقايضة الآمن</h2>
        <p className="text-xs text-muted-foreground">تداول عبر سجل الضمان — سمسرة 2% على كل صفقة</p>
      </header>

      <div className="grid gap-2 rounded-xl border border-primary/20 bg-card/70 p-3">
        <p className="text-[11px] font-bold text-primary">خدمات الملكية والتمويل</p>
        {premiumServices.map((service) => {
          const isUnlocked = state.unlockedServices?.includes(service.id)
          const tierUnlocked = state.leases.some((l) => l.id === service.requiredTier && l.leased)
          return (
            <div key={service.id} className="rounded-xl border border-border/70 bg-background/60 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-lg">{service.icon}</div>
                  <div className="font-bold text-sm text-foreground">{service.title}</div>
                  <div className="text-[11px] text-muted-foreground">{service.description}</div>
                </div>
                <div className="text-right text-[11px] text-primary font-bold">{service.pricePi} π</div>
              </div>
              <button
                onClick={() => handleUnlockService(service)}
                disabled={unlockingService === service.id || !tierUnlocked || isUnlocked}
                className="mt-2 w-full rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
              >
                {isUnlocked ? "مفتوح" : unlockingService === service.id ? "جارٍ التفعيل..." : tierUnlocked ? `فتح بـ ${service.pricePi} π` : "مقفل حتى مستوى سابق"}
              </button>
            </div>
          )
        })}
      </div>

      <div className="flex gap-2 bg-card rounded-xl p-1">
        <TabBtn active={tab === "buy"} onClick={() => setTab("buy")} label="عروض اللاعبين" />
        <TabBtn active={tab === "shop"} onClick={() => setTab("shop")} label="متجر الأصول" />
      </div>

      {tab === "buy" ? (
        <div className="space-y-2">
          {state.listings.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">لا توجد عروض حالياً</p>
          )}
          {state.listings.map((l) => {
            const total = Math.ceil(l.price * (1 + MARKET_FEE))
            return (
              <div key={l.id} className="flex items-center gap-3 bg-card rounded-xl border border-border p-3">
                <div className="text-3xl">{l.emoji}</div>
                <div className="flex-1">
                  <div className="font-bold text-foreground text-sm">{l.assetName}</div>
                  <div className="text-[11px] text-muted-foreground">البائع: {l.seller}</div>
                  <div className="text-[11px] text-secondary">
                    {l.price} + سمسرة = {total} عملة
                  </div>
                </div>
                {l.mine ? (
                  <button
                    onClick={() => unlistListing(l.id)}
                    className="text-xs font-bold text-destructive border border-destructive/40 rounded-lg px-3 py-2"
                  >
                    سحب
                  </button>
                ) : (
                  <button
                    onClick={() => setPending({ defId: l.defId, price: l.price, listingId: l.id })}
                    className="bg-primary text-primary-foreground text-xs font-bold rounded-lg px-3 py-2 active:scale-95"
                  >
                    شراء
                  </button>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {ASSETS.map((a) => {
            const itemPrice = (a as any).basePrice ?? (a as any).price ?? (a as any).cost ?? 0
            const total = Math.ceil(itemPrice * (1 + MARKET_FEE))
            return (
              <div key={a.id} className={`bg-card rounded-xl border border-border p-3 text-center ${getVisualAnimationClass({ preset: "market", intensity: "subtle" })}`} style={getVisualAnimationStyle({ preset: "market", intensity: "subtle" })}>
                <div className="text-4xl mb-1 animate-floaty">{a.emoji}</div>
                <div className="font-bold text-foreground text-sm">{a.name}</div>
                <div className="text-[11px] text-secondary mb-2">{total} عملة</div>
                <button
                  onClick={() => setPending({ defId: a.id, price: itemPrice })}
                  className="w-full bg-primary text-primary-foreground text-xs font-bold rounded-lg py-2 active:scale-95"
                >
                  شراء
                </button>
              </div>
            )
          })}
        </div>
      )}

      {pending && (
        <ShaheenCaptcha onVerified={confirmBuy} onCancel={() => setPending(null)} />
      )}

      {toast && (
        <div className="fixed bottom-24 inset-x-0 flex justify-center z-[70] px-4">
          <div className="bg-secondary text-secondary-foreground text-sm font-bold rounded-full px-4 py-2 glow-mint">
            {toast}
          </div>
        </div>
      )}
    </div>
  )
}

function TabBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-lg py-2 text-sm font-bold transition-colors ${
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground"
      }`}
    >
      {label}
    </button>
  )
}
