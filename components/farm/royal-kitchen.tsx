"use client"

import { useFarm } from "@/contexts/farm-context"

// تعريف الثوابت محلياً لمنع أخطاء الاستيراد مع الحفاظ الكامل على الكود
const WORKER_MIN_STAMINA_FOR_PRODUCTION = 20
const WORKER_STAMINA_DRAIN_PER_FACTORY_JOB = 10
const WORKER_STAMINA_REGEN_PER_HOUR = 25

export function RoyalKitchen() {
  const { restWorker, getWorkerStamina, state } = useFarm()
  const stamina = getWorkerStamina()
  const staminaPercent = Math.round(stamina)
  const isExhausted = stamina < WORKER_MIN_STAMINA_FOR_PRODUCTION
  const hoursToRecover = isExhausted ? Math.ceil((WORKER_MIN_STAMINA_FOR_PRODUCTION - stamina) / WORKER_STAMINA_REGEN_PER_HOUR) : 0

  let staminaColor = "text-secondary"
  let bgColor = "bg-secondary/20"
  if (stamina > 80) {
    staminaColor = "text-secondary"
    bgColor = "bg-secondary/20"
  } else if (stamina > 50) {
    staminaColor = "text-primary"
    bgColor = "bg-primary/20"
  } else if (stamina > 20) {
    staminaColor = "text-accent"
    bgColor = "bg-accent/20"
  } else {
    staminaColor = "text-destructive"
    bgColor = "bg-destructive/20"
  }

  return (
    <div className="space-y-4">
      <header className="text-center">
        <h2 className="text-xl font-bold text-primary text-glow-gold">المطبخ الملكي</h2>
        <p className="text-xs text-muted-foreground">إدارة طاقة العمال وراحتهم</p>
      </header>

      {/* Stamina Bar */}
      <div className={`rounded-xl border border-border ${bgColor} p-4 space-y-3`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">طاقة العامل 👨‍🍳</span>
          <span className={`text-lg font-bold ${staminaColor}`}>{staminaPercent}%</span>
        </div>
        <div className="w-full h-3 bg-background/60 rounded-full overflow-hidden border border-border">
          <div
            className={`h-full ${staminaColor.replace("text-", "bg-")} transition-all duration-300`}
            style={{ width: `${staminaPercent}%` }}
          />
        </div>
        {isExhausted && (
          <p className="text-xs text-destructive font-semibold">
            ⚠️ العامل متعب! الإنتاج متوقف. يحتاج إلى {hoursToRecover}+ ساعة راحة، أو اضغط "راحة فورية".
          </p>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-[10px] text-muted-foreground mb-1">استهلاك لكل عملية تصنيع</p>
          <p className="text-lg font-bold text-primary">{WORKER_STAMINA_DRAIN_PER_FACTORY_JOB}%</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-[10px] text-muted-foreground mb-1">الاسترجاع في الساعة</p>
          <p className="text-lg font-bold text-secondary">+{WORKER_STAMINA_REGEN_PER_HOUR}%</p>
        </div>
      </div>

      {/* Rest Button */}
      <button
        onClick={restWorker}
        disabled={stamina >= 100}
        className={`w-full font-bold rounded-xl py-3 text-sm transition-transform active:scale-95 ${
          stamina >= 100
            ? "bg-muted text-muted-foreground opacity-50"
            : "bg-secondary text-secondary-foreground"
        }`}
      >
        {stamina >= 100 ? "✓ العامل مستريح" : "😴 راحة فورية للعامل (100%)"}
      </button>

      {/* Status Message */}
      <div className="rounded-lg border border-border/50 bg-background/60 p-3 text-center">
        {isExhausted ? (
          <p className="text-xs text-destructive font-semibold">
            🚫 الإنتاج متوقف! الحد الأدنى للطاقة هو {WORKER_MIN_STAMINA_FOR_PRODUCTION}%
          </p>
        ) : (
          <p className="text-xs text-secondary font-semibold">
            ✓ الإنتاج نشط. تابع مراقبة الطاقة لتجنب التعب.
          </p>
        )}
      </div>

      {/* Tips */}
      <div className="rounded-lg border border-border/50 bg-card/50 p-3 space-y-2">
        <p className="text-xs font-bold text-foreground">💡 نصائح:</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• كل عملية تصنيع تستهلك {WORKER_STAMINA_DRAIN_PER_FACTORY_JOB}% من الطاقة</li>
          <li>• الطاقة تنخفض أثناء التصنيع وترتفع أثناء الراحة</li>
          <li>• إذا انخفضت الطاقة عن {WORKER_MIN_STAMINA_FOR_PRODUCTION}%، الحيوانات لن تنتج</li>
          <li>• استخدم "راحة فورية" لاستعادة كل الطاقة على الفور</li>
        </ul>
      </div>
    </div>
  )
}
