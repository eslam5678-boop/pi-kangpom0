"use client"

import React, { useState } from "react"
import { useFarm } from "@/contexts/farm-context"

export function AssetDetail({ asset, onClose, onRevive }: { asset: any; onClose: () => void; onRevive?: (a: any) => void }) {
  const farm = useFarm() as any
  const [localProgress, setLocalProgress] = useState(asset.progress || 0)
  const [isProducing, setIsProducing] = useState(asset.isProducing || false)

  // Check if the clicked item is a factory building
  const isFactory = asset.type === 'factory' || 
                    asset.id?.includes('feed') || 
                    asset.id?.includes('oil') || 
                    asset.id?.includes('pottery') ||
                    asset.name?.includes('مصنع') || 
                    asset.name?.includes('معصرة') || 
                    asset.name?.includes('ورشة')

  const handleStart = () => {
    setIsProducing(true)
    setLocalProgress(10)
    if (typeof farm.startProduction === "function") {
      try { farm.startProduction(asset.id || 'feed', 'batch') } catch (e) {}
    }
    // Simulate smooth progress inside modal
    const interval = setInterval(() => {
      setLocalProgress((prev: number) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 25
      })
    }, 1000)
  }

  const handleCollect = () => {
    setIsProducing(false)
    setLocalProgress(0)
    if (typeof farm.collectProduction === "function") {
      try { farm.collectProduction(asset.id) } catch (e) {}
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border-2 border-primary/40 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95">
        
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-3 left-3 text-muted-foreground hover:text-foreground text-lg font-bold bg-background/80 rounded-full w-8 h-8 flex items-center justify-center border border-primary/20"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-primary/20 pb-3">
          <span className="text-4xl">{asset.icon || (isFactory ? "🏭" : "🌾")}</span>
          <div>
            <h3 className="text-base font-bold text-primary">
              {asset.name || (isFactory ? "مصنع ملكي فرعوني" : "تفاصيل الأصل الزراعي")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isFactory ? "تحق من خطوط الإنتاج والورش الملكية هنا" : "إدارة ومتابعة حالة العنصر"}
            </p>
          </div>
        </div>

        {/* Factory Controls View */}
        {isFactory ? (
          <div className="space-y-4 py-2">
            <div className="bg-background border border-primary/30 rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-primary">
                  {isProducing || localProgress > 0 ? "⚡ جاري التصنيع الملكي..." : "🟢 المصنع جاهز للعمل"}
                </span>
                <span className="font-bold text-foreground">{localProgress}%</span>
              </div>

              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300 rounded-full"
                  style={{ width: `${localProgress}%` }}
                />
              </div>

              {localProgress >= 100 ? (
                <button
                  onClick={handleCollect}
                  className="w-full bg-secondary text-secondary-foreground font-bold text-xs py-2.5 rounded-xl shadow active:scale-95 transition-transform"
                >
                  استلام الإنتاج 🧺
                </button>
              ) : !isProducing && localProgress === 0 ? (
                <button
                  onClick={handleStart}
                  className="w-full bg-primary text-primary-foreground font-bold text-xs py-2.5 rounded-xl shadow active:scale-95 transition-transform"
                >
                  بدء دورة الإنتاج ⚙️
                </button>
              ) : (
                <p className="text-[11px] text-center text-muted-foreground">جاري التجهيز في الورشة...</p>
              )}
            </div>
          </div>
        ) : (
          /* Regular Asset Controls (Crops / Animals) */
          <div className="space-y-3 py-2">
            <div className="bg-background border border-primary/30 rounded-xl p-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">الحيوية:</span>
                <span className="font-bold text-primary">{asset.health ?? 100}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">الحالة:</span>
                <span className="font-bold text-foreground">{asset.dead ? "⚠️ نافق" : "✨ سليم ومزدهر"}</span>
              </div>
            </div>

            {asset.dead && onRevive ? (
              <button
                onClick={() => onRevive(asset)}
                className="w-full bg-destructive text-destructive-foreground font-bold text-xs py-2.5 rounded-xl active:scale-95 transition-transform"
              >
                إحياء الأصل عبر عم شاهين 🧙‍♂️
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    if (farm.feedAsset) farm.feedAsset(asset.uid)
                    onClose()
                  }}
                  className="bg-secondary text-secondary-foreground font-bold text-xs py-2.5 rounded-xl active:scale-95 transition-transform"
                >
                  🌾 إطعام الأصل
                </button>
                <button
                  onClick={() => {
                    if (farm.harvestAsset) farm.harvestAsset(asset.uid)
                    onClose()
                  }}
                  className="bg-primary text-primary-foreground font-bold text-xs py-2.5 rounded-xl active:scale-95 transition-transform"
                >
                  🧺 حصاد / جمع
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-primary/20 pt-3 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 bg-background border border-primary/30 text-foreground font-bold text-xs py-2 rounded-xl hover:bg-primary/10 transition-colors"
          >
            إغلاق النافذة
          </button>
        </div>

      </div>
    </div>
  )
}