"use client"

import React, { useState, useEffect } from "react"
import { useFarm } from "@/contexts/farm-context"
import { getVisualAnimationClass, getVisualAnimationStyle } from "@/lib/visual-animation"

export function Factories() {
  const farm = useFarm() as any
  const state = farm?.state || {}

  // نظام محلي لضمان ظهور شريط الإنتاج فوراً فوق المبنى عند الضغط
  const [localProductions, setLocalProductions] = useState<Record<string, { progress: number; isReady: boolean; productName: string }>>({})

  // محاكاة تقدم شريط الإنتاج تلقائياً
  useEffect(() => {
    const timer = setInterval(() => {
      setLocalProductions(prev => {
        const updated = { ...prev }
        let hasChanged = false
        for (const key of Object.keys(updated)) {
          if (!updated[key].isReady) {
            const nextProgress = Math.min(100, updated[key].progress + 15)
            updated[key] = {
              ...updated[key],
              progress: nextProgress,
              isReady: nextProgress >= 100
            }
            hasChanged = true
          }
        }
        return hasChanged ? updated : prev
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const factoryList = [
    { 
      id: "feed", 
      name: "مصنع العلف وغلال", 
      icon: "🌾", 
      desc: "إنتاج علف مركز ومقويات للأصول",
      products: [
        { id: "feed_batch", name: "علف مركز ملكي", time: "7 ثوانٍ", icon: "🌽" }
      ]
    },
    { 
      id: "oil", 
      name: "معصرة الزيوت", 
      icon: "🫒", 
      desc: "استخلاص زيوت السمسم والكتان الملكي",
      products: [
        { id: "oil_batch", name: "زيت بردي نقي", time: "7 ثوانٍ", icon: "🏺" }
      ]
    },
    { 
      id: "pottery", 
      name: "ورشة الفخار الفرعوني", 
      icon: "🏺", 
      desc: "صناعة الجرار والأواني الفخارية",
      products: [
        { id: "pottery_batch", name: "جرار فخارية مزخرفة", time: "7 ثوانٍ", icon: "🏺" }
      ]
    },
    { 
      id: "gold_mill", 
      name: "طاحونة الذهب الملكية", 
      icon: "⚒️", 
      desc: "تصفية الذهب وتشكيله إلى سبائك ملكية",
      products: [
        { id: "gold_batch", name: "سبائك ذهبية", time: "18 ثانية", icon: "🥇" }
      ]
    },
    { 
      id: "perfume_foundry", 
      name: "ورش العطور الملكية", 
      icon: "🌿", 
      desc: "إنتاج العطور والتوابل المخصصة للمعابد",
      products: [
        { id: "perfume_batch", name: "عطور ملكي", time: "22 ثانية", icon: "🪔" }
      ]
    },
  ]

  const handleStart = (factoryId: string, productName: string) => {
    setLocalProductions(prev => ({
      ...prev,
      [factoryId]: { progress: 0, isReady: false, productName }
    }))
    if (typeof farm.startProduction === "function") {
      try { farm.startProduction(factoryId, productName) } catch (e) {}
    }
  }

  const handleCollect = (factoryId: string) => {
    setLocalProductions(prev => {
      const updated = { ...prev }
      delete updated[factoryId]
      return updated
    })
    if (typeof farm.collectProduction === "function") {
      try { farm.collectProduction(factoryId) } catch (e) {}
    }
  }

  return (
    <div className="space-y-4 w-full pb-10">
      {/* Header */}
      <div className="bg-card border border-primary/30 rounded-2xl p-4 text-center shadow-sm">
        <h2 className="text-lg font-bold text-primary flex items-center justify-center gap-2">
          <span>🏭</span> منطقة المصانع والورش الملكية
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          شريط الإنتاج يظهر مباشرة فوق كل مبنى عند بدء التصنيع
        </p>
      </div>

      {/* Factory Cards Grid - Each building has its progress bar above it */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {factoryList.map((factory) => {
          const activeProd = localProductions[factory.id] || (state?.factoryProductions || []).find((p: any) => p.factoryId === factory.id || p.id === factory.id)

          return (
            <div 
              key={factory.id} 
              className={`bg-card border border-primary/30 rounded-2xl p-4 flex flex-col justify-between space-y-4 relative shadow-md ${getVisualAnimationClass({ preset: "factory", intensity: "subtle" })}`}
              style={getVisualAnimationStyle({ preset: "factory", intensity: "subtle" })}
            >
              
              {/* Progress Bar Directly Above Each Building Card */}
              {activeProd ? (
                <div className="bg-background/95 border border-primary/40 rounded-xl p-3 space-y-2 shadow-inner">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-primary">
                      ⚡ جاري إنتاج ({activeProd.productName || "منتج"})
                    </span>
                    <span className="font-bold text-foreground">{activeProd.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300 rounded-full"
                      style={{ width: `${activeProd.progress || 0}%` }}
                    />
                  </div>
                  {activeProd.isReady || (activeProd.progress >= 100) ? (
                    <button
                      onClick={() => handleCollect(factory.id)}
                      className="w-full bg-secondary text-secondary-foreground text-xs font-bold py-2 rounded-lg mt-1 active:scale-95 transition-transform shadow"
                    >
                      استلام الإنتاج 🧺
                    </button>
                  ) : (
                    <p className="text-[10px] text-center text-muted-foreground">جاري التجهيز في الورشة...</p>
                  )}
                </div>
              ) : (
                <div className="text-[10px] text-muted-foreground text-center bg-background/40 py-1.5 rounded-lg border border-dashed border-primary/30">
                  المبنى جاهز للإنتاج 🟢
                </div>
              )}

              {/* Factory Info & Icon */}
              <div className="flex items-center gap-3">
                <span className="text-4xl">{factory.icon}</span>
                <div>
                  <h3 className="font-bold text-primary text-sm">{factory.name}</h3>
                  <p className="text-[11px] text-muted-foreground">{factory.desc}</p>
                </div>
              </div>

              {/* Products List & Start Production Button */}
              <div className="border-t border-primary/20 pt-3 space-y-2">
                {factory.products.map((prod) => (
                  <div key={prod.id} className="bg-background/50 border border-primary/20 rounded-xl p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{prod.icon}</span>
                      <div>
                        <p className="text-xs font-bold text-foreground">{prod.name}</p>
                        <p className="text-[10px] text-muted-foreground">{prod.time}</p>
                      </div>
                    </div>
                    {!activeProd && (
                      <button
                        onClick={() => handleStart(factory.id, prod.name)}
                        className="bg-primary text-primary-foreground font-bold text-xs py-1.5 px-3 rounded-lg active:scale-95 transition-transform shadow hover:opacity-90"
                      >
                        إنتاج ⚙️
                      </button>
                    )}
                  </div>
                ))}
              </div>

            </div>
          )
        })}
      </div>
    </div>
  )
}