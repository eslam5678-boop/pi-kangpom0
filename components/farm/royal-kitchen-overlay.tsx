"use client"

import { useFarm } from "@/contexts/farm-context"

export function RoyalKitchenOverlay({ onClose }: { onClose: () => void }) {
  const { state, restWorker, getWorkerStamina } = useFarm()
  
  const stamina = getWorkerStamina()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card border-2 border-primary rounded-2xl p-6 max-w-sm w-full shadow-2xl max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-primary text-glow-gold">👨‍🍳 المطبخ الملكي</h2>
          <button
            onClick={onClose}
            className="text-xl font-bold text-muted-foreground hover:text-primary transition"
          >
            ✕
          </button>
        </div>

        {/* Worker Stamina Card */}
        <div className="bg-gradient-to-r from-secondary/20 to-primary/20 border border-primary/40 rounded-xl p-4 mb-6">
          <p className="text-xs text-muted-foreground uppercase font-bold mb-2">حالة العامل</p>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">👷</span>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-bold text-foreground">الطاقة</span>
                <span className="text-sm font-bold text-primary">{Math.round(stamina)}%</span>
              </div>
              <div className="w-full h-3 bg-background rounded-full overflow-hidden border border-primary/40">
                <div
                  className="h-full bg-gradient-to-r from-secondary to-primary transition-all"
                  style={{ width: `${stamina}%` }}
                />
              </div>
            </div>
          </div>

          {stamina < 20 && (
            <p className="text-[10px] text-destructive font-bold mt-2">
              ⚠️ الطاقة منخفضة جداً — لا يمكن بدء المصانع
            </p>
          )}

          {stamina >= 80 && (
            <p className="text-[10px] text-secondary font-bold mt-2">
              ✓ الطاقة عالية — يمكن العمل بكفاءة
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-background/60 border border-primary/30 rounded-lg p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">الاستهلاك</p>
            <p className="text-lg font-bold text-primary">-8% لكل عملية</p>
          </div>
          <div className="bg-background/60 border border-primary/30 rounded-lg p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">التجدد</p>
            <p className="text-lg font-bold text-secondary">+5% لكل ساعة</p>
          </div>
        </div>

        {/* Rest Button */}
        <button
          onClick={() => {
            restWorker()
            onClose()
          }}
          className="pharaonic-btn w-full rounded-lg px-4 py-3 text-base text-primary-foreground mb-4"
        >
          😴 استرخ (تعافي فوري)
        </button>

        {/* Info Sections */}
        <div className="space-y-3 mb-4">
          <div className="bg-background/40 border border-primary/30 rounded-lg p-3">
            <p className="text-xs font-bold text-primary mb-1">🏭 كيفية عمل المصانع</p>
            <p className="text-[10px] text-muted-foreground">
              كل عملية تصنيع تستهلك 8% من الطاقة. إذا انخفضت الطاقة عن 20%، لا يمكن بدء عمليات جديدة.
            </p>
          </div>

          <div className="bg-background/40 border border-primary/30 rounded-lg p-3">
            <p className="text-xs font-bold text-secondary mb-1">🌾 إنتاج الأصول</p>
            <p className="text-[10px] text-muted-foreground">
              الأصول تنتج المواد الخام فقط عندما تكون الطاقة أكثر من 20% والعامل بصحة جيدة.
            </p>
          </div>

          <div className="bg-background/40 border border-primary/30 rounded-lg p-3">
            <p className="text-xs font-bold text-accent mb-1">💡 نصيحة</p>
            <p className="text-[10px] text-muted-foreground">
              خطط جدول الإنتاج بحكمة — استرح عندما تنخفض الطاقة لتجنب توقف الإنتاج.
            </p>
          </div>
        </div>

        {/* Current State */}
        <div className="bg-background/60 border border-primary/30 rounded-lg p-3 text-center text-[10px]">
          <p className="text-muted-foreground">
            حالة العامل: <span className="font-bold text-primary">
              {stamina < 20 ? "متعب جداً" : stamina < 50 ? "متعب" : stamina < 80 ? "عادي" : "نشيط جداً"}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
