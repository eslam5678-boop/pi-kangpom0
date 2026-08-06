"use client"

import { useState, useEffect } from "react"
import { FarmProvider, useFarm } from "@/contexts/farm-context"
import { usePiAuth } from "@/contexts/auth-context"
import { OnboardingModal } from "./onboarding-modal"
import { IsometricGameGrid } from "./isometric-game-grid"
import FarmGrid from "./farm_grid"
import { AssetDetail } from "./asset-detail"
import { LandBureau } from "./land-bureau"
import { Factories } from "./factories"
import { Marketplace } from "./marketplace"
import { LifelineModal } from "./lifeline-modal"
import { RoyalKitchen } from "./royal-kitchen"
import { DailyTasks } from "./daily-tasks"
import { PaymentButton } from "./payment-button"
import { useTimeTheme } from "@/hooks/use-time-theme"
import { LANGUAGES, type Language } from "@/lib/farm-i18n"
import { OwnedAsset } from "@/lib/farm-types"

type Tab = "game" | "tasks" | "assets" | "land" | "factory" | "kitchen" | "market"

const NAV: { id: Tab; label: string; icon: string }[] = [
  { id: "game", label: "اللعبة", icon: "🎮" },
  { id: "tasks", label: "المهام", icon: "✓" },
  { id: "assets", label: "الأصول", icon: "🌾" },
  { id: "land", label: "الأراضي", icon: "🏛️" },
  { id: "factory", label: "المصانع", icon: "🏭" },
  { id: "kitchen", label: "المطبخ", icon: "👨‍🍳" },
  { id: "market", label: "السوق", icon: "🛒" },
]

function Shell() {
  const { state, feedAll, collectAll, completeOnboarding, setLanguage, getAverageHealth, factoryReset } = useFarm()
const { products, sdk, user, isLoading, logout } = usePiAuth()
  const isDaytime = useTimeTheme()
  const [tab, setTab] = useState<Tab>("game")
  const [selected, setSelected] = useState<OwnedAsset | null>(null)
  const [reviving, setReviving] = useState<OwnedAsset | null>(null)
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(false)
  const [isDataReady, setIsDataReady] = useState(false)
  const [componentKey, setComponentKey] = useState(0)

  // Use provided user data, or fallback to Guest
  const displayUser = user || { username: "مرحبا", id: "guest" }

  // Log that Shell is rendering (no loading states blocking display)
  useEffect(() => {
    console.log("[v0] Shell component rendered - displaying immediately without waiting for auth")
  }, [])

  // Keyboard shortcut for factory reset: Ctrl+Shift+R
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.code === "KeyR") {
        e.preventDefault()
        factoryReset()
      }
    }
    window.addEventListener("keydown", handleKeyPress)
    
    // Expose reset function globally for debugging
    ;(window as any).pharaohsReset = () => {
      factoryReset()
    }
    
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [factoryReset])

  // Safe access to state - use defaults if not ready
  const deadCount = state?.assets?.filter((a: OwnedAsset) => a.dead).length ?? 0
  const averageHealth = state ? getAverageHealth() : 0
  const now = new Date()
  const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })

  return (
    <div key={componentKey} className="min-h-screen bg-background flex flex-col w-full">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b-2 border-primary/30 w-full">
        <div className="w-full max-w-4xl mx-auto px-4 py-3 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-2xl">{isDaytime ? "🐪" : "🐫"}</span>
              <div>
                <h1 className="text-base font-bold text-primary text-glow-gold leading-tight">
                  مزرعة باي الفرعونية
                </h1>
                <p className="text-[10px] text-muted-foreground">
                  {isDaytime ? "☀️ نهار" : "🌙 ليل"} • {timeStr}
                </p>
              </div>
            </div>
<div className="flex gap-2 flex-wrap items-center">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-lg hover:scale-110 transition-transform"
                title="Settings"
              >
                ⚙️
              </button>
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="text-lg hover:scale-110 transition-transform"
                title="Language"
              >
                🌍
              </button>
              <div className="bg-background rounded-full px-3 py-1.5 border border-primary/40 flex items-center gap-1.5">
                <span className="text-sm">🪙</span>
                <span className="text-sm font-bold text-primary">{state?.coins ?? 0}</span>
              </div>
              {/* Standalone logout button - highly visible in the header */}
              <button
                onClick={() => logout()}
                className="bg-destructive text-white font-bold text-xs px-3 py-2 rounded-lg hover:bg-destructive/80 active:scale-95 transition-all flex items-center gap-1 shadow-md"
                title="تسجيل الخروج"
              >
🚪 تسجيل الخروج
              </button>
            </div>
          </div>

          {/* Payment Button */}
          <div className="py-2 w-full">
            <PaymentButton
              onSuccess={() => {
                console.log("[v0] Payment successful")
              }}
              onError={(error) => {
                console.error("[v0] Payment error:", error)
              }}
            />
          </div>

          {/* Start Game Button */}
          <button
            onClick={() => {
              if (tab === "game") {
                setComponentKey(prev => prev + 1)
              } else {
                setTab("game")
              }
            }}
            className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground font-bold py-3 px-4 rounded-xl hover:shadow-lg active:scale-95 transition-all text-sm"
          >
            🎮 ابدأ اللعبة
          </button>

          {/* Health warning */}
          {averageHealth < 50 && (
            <div className={`text-[10px] text-center py-1 px-2 rounded-lg font-bold ${averageHealth < 20 ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"}`}>
              {averageHealth < 20 ? "🚨 حالة حرجة! اطعم أصولك الآن!" : "⚠️ حيوية منخفضة - اطعم الأصول"}
            </div>
          )}

          {/* Language menu */}
          {showLanguageMenu && (
            <div className="bg-background border border-primary/40 rounded-lg p-2 grid grid-cols-2 gap-2">
              {(Object.entries(LANGUAGES) as [Language, string][]).map(([lang, name]) => (
                <button
                  key={lang}
                  onClick={() => {
                    setLanguage(lang)
                    setShowLanguageMenu(false)
                  }}
                  className={`text-xs py-1 px-2 rounded transition-all ${
                    state.preferredLanguage === lang
                      ? "bg-primary text-primary-foreground font-bold"
                      : "bg-background border border-primary/30 hover:border-primary/60"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          )}

          {/* Settings menu */}
          {showSettings && (
            <div className="bg-background border border-primary/40 rounded-lg p-3 space-y-2">
              <h3 className="font-bold text-sm text-primary mb-2">الإعدادات</h3>
              
              {/* Factory Reset option */}
              {!resetConfirm ? (
                <button
                  onClick={() => setResetConfirm(true)}
                  className="w-full text-xs py-2 px-3 rounded bg-destructive/20 text-destructive hover:bg-destructive/30 border border-destructive/40 transition-all font-bold"
                >
                  🔄 إعادة ضبط شاملة (Factory Reset)
                </button>
              ) : (
                <div className="bg-destructive/10 border border-destructive/40 rounded p-2 space-y-2">
                  <p className="text-[10px] text-destructive font-bold text-center leading-tight">
                    ⚠️ هل أنت متأكد؟ سيتم حذف جميع البيانات!
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        factoryReset()
                        setShowSettings(false)
                        setResetConfirm(false)
                      }}
                      className="flex-1 text-xs py-1.5 px-2 rounded bg-destructive text-destructive-foreground font-bold active:scale-95 transition-transform"
                    >
                      ✓ حذف الكل
                    </button>
                    <button
                      onClick={() => setResetConfirm(false)}
                      className="flex-1 text-xs py-1.5 px-2 rounded bg-secondary text-secondary-foreground font-bold active:scale-95 transition-transform"
                    >
                      ✕ إلغاء
                    </button>
                  </div>
                </div>
              )}

<button
                onClick={() => setShowSettings(false)}
                className="w-full text-xs py-1.5 px-2 rounded bg-primary/20 text-primary hover:bg-primary/30 transition-all font-bold"
              >
                إغلاق
              </button>

              <button
                onClick={() => logout()}
                className="w-full text-xs py-2 px-3 rounded bg-destructive text-white hover:bg-destructive/80 border border-destructive transition-all font-bold flex items-center justify-center gap-1"
              >
                🚪 تسجيل الخروج
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-4 pb-28">
        {tab === "game" && <IsometricGameGrid />}
        {tab === "tasks" && <DailyTasks />}
        {tab === "assets" && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={feedAll}
                className="flex-1 min-w-[120px] bg-secondary text-secondary-foreground font-bold rounded-xl py-2.5 text-sm active:scale-95 transition-transform"
              >
                🌾 إطعام الكل
              </button>
              <button
                onClick={collectAll}
                className="flex-1 min-w-[120px] bg-primary text-primary-foreground font-bold rounded-xl py-2.5 text-sm active:scale-95 transition-transform"
              >
                🧺 تحصيل الكل
              </button>
            </div>

            {deadCount > 0 && (
              <div className="bg-destructive/15 border border-destructive/40 rounded-xl p-3 text-center">
                <p className="text-xs text-destructive font-bold">
                  ⚠️ لديك {deadCount} أصل نافق — اضغط عليه لإحيائه عبر عم شاهين
                </p>
              </div>
            )}

            <FarmGrid onSelectItem={(item: any) => setSelected(item)} onPlaceTileClick={() => {}} />
          </div>
        )}
        {tab === "land" && <LandBureau />}
        {tab === "factory" && <Factories />}
        {tab === "kitchen" && <RoyalKitchen />}
        {tab === "market" && <Marketplace />}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t-2 border-primary/30 w-full">
        <div className="w-full max-w-4xl mx-auto flex flex-wrap">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-3 transition-colors ${
                tab === item.id ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-bold">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {selected && (
        <AssetDetail
          asset={state?.assets?.find((a: OwnedAsset) => a.uid === selected.uid) || selected}
          onClose={() => setSelected(null)}
          onRevive={(a: OwnedAsset) => {
            setSelected(null)
            setReviving(a)
          }}
        />
      )}

      {reviving && (
        <LifelineModal
          asset={(state.assets.find((a: OwnedAsset) => a.uid === reviving.uid) || reviving) as OwnedAsset}
          onClose={() => setReviving(null)}
        />
      )}

      <OnboardingModal
        isOpen={!state.hasSeenOnboarding}
        onComplete={completeOnboarding}
      />
    </div>
  )
}

export function FarmApp() {
  try {
    console.log("[v0] FarmApp component starting to render")
    const result = (
      <FarmProvider>
        <Shell />
      </FarmProvider>
    )
    console.log("[v0] FarmApp component rendered successfully")
    return result
  } catch (error) {
    console.error("[v0] Fatal error in FarmApp:", error)
    const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : 'حدث خطأ غير متوقع'
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 px-4">
          <div className="text-6xl">❌</div>
          <h1 className="text-2xl font-bold text-destructive">خطأ في اللعبة</h1>
          <p className="text-muted-foreground">{errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            إعادة تحميل
          </button>
        </div>
      </div>
    )
  }
}
