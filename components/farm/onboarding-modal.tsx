"use client"

import { useState } from "react"
import { useTranslation } from "@/hooks/use-translation"

interface OnboardingModalProps {
  isOpen: boolean
  onComplete: () => void
}

const STEPS = [
  "welcome",
  "assets",
  "vitality",
  "expansion",
] as const

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(0)
  const { t } = useTranslation()
  const currentStep = STEPS[step]

  if (!isOpen) return null

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      onComplete()
    }
  }

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const getStepContent = () => {
    switch (currentStep) {
      case "welcome":
        return {
          title: t("onboarding_welcome_title"),
          desc: t("onboarding_welcome_desc"),
          emoji: "🐪",
        }
      case "assets":
        return {
          title: t("onboarding_assets_title"),
          desc: t("onboarding_assets_desc"),
          emoji: "🐔",
        }
      case "vitality":
        return {
          title: t("onboarding_vitality_title"),
          desc: t("onboarding_vitality_desc"),
          emoji: "💚",
        }
      case "expansion":
        return {
          title: t("onboarding_expansion_title"),
          desc: t("onboarding_expansion_desc"),
          emoji: "🏛️",
        }
    }
  }

  const content = getStepContent()
  const isLastStep = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md mx-auto">
        {/* Parchment scroll background */}
        <div 
          className="relative bg-gradient-to-b from-amber-100 via-yellow-50 to-amber-50 rounded-3xl border-4 border-amber-800 shadow-2xl p-8 space-y-6"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 30%, rgba(139, 69, 19, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, rgba(160, 82, 45, 0.08) 0%, transparent 50%)
            `,
          }}
        >
          {/* Scroll decorative edges */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-3 bg-amber-900/30 rounded-full blur-lg" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-3 bg-amber-900/30 rounded-full blur-lg" />

          {/* Character */}
          <div className="text-center animate-floaty">
            <span className="text-8xl inline-block">{content?.emoji}</span>
          </div>

          {/* Content */}
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-bold text-amber-900">{content?.title}</h2>
            <p className="text-sm text-amber-800 leading-relaxed">{content?.desc}</p>
          </div>

          {/* Step-specific details box */}
          <div className="bg-amber-900/5 rounded-xl p-3 text-xs text-amber-900/80 space-y-1.5 border border-amber-900/10">
            {currentStep === "assets" && (
              <>
                <p>✓ الدجاجات تنتج البيض</p>
                <p>✓ اطعمها كل ساعة</p>
                <p>✓ اجمع المحاصيل للحصول على العملات</p>
              </>
            )}
            {currentStep === "vitality" && (
              <>
                <p>✓ الحيوية تتناقص عند عدم الإطعام</p>
                <p>✓ بعد 6 ساعات بدون طعام: مريض</p>
                <p>✓ بعد 12 ساعة من المرض: نافق</p>
              </>
            )}
            {currentStep === "expansion" && (
              <>
                <p>✓ ديوان الأراضي: أربع مستويات</p>
                <p>✓ المجاني: 10 أصول</p>
                <p>✓ المدفوع: سعات أكبر بمقابل عملات</p>
              </>
            )}
            {currentStep === "welcome" && (
              <p className="text-center font-medium">مرحباً بك في مزرعة عم شاهين الملكية!</p>
            )}
          </div>

          {/* Step indicators */}
          <div className="flex justify-center gap-2">
            {STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx === step ? "bg-amber-900 w-6" : "bg-amber-300 w-2"
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-center pt-2">
            {step > 0 && (
              <button
                onClick={handlePrev}
                className="pharaonic-btn px-6 py-2.5 text-sm rounded-xl font-bold border border-amber-800/40 text-amber-900 hover:bg-amber-900/10 transition-colors"
              >
                السابق
              </button>
            )}
            <button
              onClick={handleNext}
              className="pharaonic-btn px-6 py-2.5 text-sm rounded-xl font-bold flex-1 bg-amber-900 text-amber-50 hover:bg-amber-800 transition-colors shadow-md"
            >
              {isLastStep ? t("onboarding_start") : t("onboarding_next")}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
