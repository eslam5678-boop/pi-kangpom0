"use client"

import { useState, useMemo, useEffect } from "react"
import { useFarm } from "@/contexts/farm-context"
import { useTimeTheme } from "@/hooks/use-time-theme"
import { usePanZoom } from "@/hooks/use-pan-zoom"
import { RoyalKitchenOverlay } from "./royal-kitchen-overlay"
import { ASSETS } from "@/lib/farm-types"

type TileStatus = "empty" | "planted" | "ready"

interface MapTile {
  id: string
  x: number
  y: number
  status: TileStatus
  assetId: string // which of the 14 assets is planted here
  plantedAt: number | null
}

const GROWTH_TIME_MS = 15000 // 15 seconds
const HARVEST_REWARD = 10
const STORAGE_KEY = "pharaohs_pi_farm_map_v1"

function getAssetStageIcon(assetId: string, stage: "seed" | "growing" | "ready"): string {
  const asset = ASSETS.find((a) => a.id === assetId)
  if (!asset) return "🌱"
  
  if (stage === "seed") return "🌱"
  if (stage === "growing") return asset.emoji
  return asset.emoji // ready state shows the asset emoji with checkmark overlay
}

export function IsometricGameGrid() {
  const { state, getWorkerStamina, addCoins } = useFarm()
  const isDaytime = useTimeTheme()
  const [showKitchen, setShowKitchen] = useState(false)
  const [dayNightCycle, setDayNightCycle] = useState<"day" | "night">(isDaytime ? "day" : "night")

  // Pan / zoom controller for the game field (touch pinch + drag, mouse wheel + drag).
  const {
    viewportRef,
    layerRef,
    scale,
    canZoomIn,
    canZoomOut,
    isZoomed,
    zoomIn,
    zoomOut,
    resetView,
    suppressClick,
  } = usePanZoom({ minScale: 0.7, maxScale: 3.5, initialScale: 1 })

  // Initialize tiles from localStorage or create new
  const [tiles, setTiles] = useState<MapTile[]>(() => {
    if (typeof window === "undefined") {
      return createEmptyGrid()
    }
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (e) {
      // Silently fail - create new grid
    }
    
    return createEmptyGrid()
  })

  function createEmptyGrid(): MapTile[] {
    const grid: MapTile[] = []
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        grid.push({
          id: `${x}-${y}`,
          x,
          y,
          status: "empty",
          assetId: "",
          plantedAt: null,
        })
      }
    }
    return grid
  }

  // Persist tiles to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tiles))
    }
  }, [tiles])

  // Day/night cycle every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setDayNightCycle((prev) => (prev === "day" ? "night" : "day"))
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const stamina = getWorkerStamina()
  const level = Math.floor(state.coins / 100) + 1

  // Game loop: check for ready crops every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setTiles((prev) =>
        prev.map((tile) => {
          if (
            tile.status === "planted" &&
            tile.plantedAt !== null &&
            now - tile.plantedAt >= GROWTH_TIME_MS
          ) {
            return { ...tile, status: "ready" }
          }
          return tile
        })
      )
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleTileClick = (tileId: string) => {
    setTiles((prev) =>
      prev.map((tile) => {
        if (tile.id !== tileId) return tile

        if (tile.status === "empty") {
          // empty → planted: pick random asset
          const randomAsset = ASSETS[Math.floor(Math.random() * ASSETS.length)]
          return {
            ...tile,
            status: "planted",
            assetId: randomAsset.id,
            plantedAt: Date.now(),
          }
        } else if (tile.status === "ready") {
          // ready → harvest
          addCoins(HARVEST_REWARD)
          return {
            ...tile,
            status: "empty",
            assetId: "",
            plantedAt: null,
          }
        }

        return tile
      })
    )
  }

  const getGrowthPercentage = (tile: MapTile) => {
    if (tile.status !== "planted" || !tile.plantedAt) return 0
    const elapsed = Date.now() - tile.plantedAt
    return Math.min(100, (elapsed / GROWTH_TIME_MS) * 100)
  }

  const getIsometricStyle = (x: number, y: number) => {
    const tileWidth = 80
    const tileHeight = 40
    const offsetX = (x - y) * (tileWidth / 2)
    const offsetY = (x + y) * (tileHeight / 2)
    const BASE_X = 180 // centre the isometric map within the pan/zoom layer
    const BASE_Y = 50
    return {
      transform: `translate(${BASE_X + offsetX}px, ${BASE_Y + offsetY}px)`,
    }
  }

  // The pan/zoom layer. Sized a bit larger than the visible map so every tile has breathing
  // room while panning. It is translated/scaled by the usePanZoom hook.
  const gridStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: 440,
    height: 300,
  }

  const readyCount = tiles.filter((t) => t.status === "ready").length
  const plantedCount = tiles.filter((t) => t.status === "planted").length

  return (
    <div className="flex flex-col h-full gap-3 relative">
      {/* Day/Night Overlay */}
      <div
        className={`day-night-overlay ${dayNightCycle}`}
        aria-hidden
      />

      {/* Header with Kitchen Button */}
      <div className="shrink-0 bg-card border-2 border-primary rounded-xl p-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-primary text-glow-gold">مزرعة الفرعون</h2>
          <p className="text-[10px] text-muted-foreground">
            {dayNightCycle === "day" ? "☀️ نهار" : "🌙 ليل"} • الوقت: {new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <button
          onClick={() => setShowKitchen(true)}
          className="pharaonic-btn rounded-lg px-4 py-2 text-sm text-primary-foreground"
        >
          👨‍🍳 المطبخ
        </button>
      </div>

      {/* Status Bar */}
      <div className="shrink-0 bg-gradient-to-r from-card to-background border-2 border-primary rounded-xl p-3">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-muted-foreground uppercase font-bold">الرصيد</span>
            <span className="text-xl font-bold text-primary flex items-center justify-center gap-1">
              <span>🪙</span>
              <span>{state.coins}</span>
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-muted-foreground uppercase font-bold">الطاقة</span>
            <div className="w-32 h-3 bg-background rounded-full overflow-hidden border border-primary/40">
              <div
                className="h-full bg-gradient-to-r from-secondary to-primary transition-all"
                style={{ width: `${stamina}%` }}
              />
            </div>
            <span className="text-xs font-bold text-secondary">
              {Math.round(stamina)}/100
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-muted-foreground uppercase font-bold">المستوى</span>
            <span className="text-2xl font-bold text-accent">{level}</span>
            <span className="text-[10px] text-muted-foreground">
              ⭐ {state.coins % 100}/100
            </span>
          </div>
        </div>
      </div>

      {/* Crop Status */}
      {(readyCount > 0 || plantedCount > 0) && (
        <div className="shrink-0 bg-background/60 border-2 border-primary/50 rounded-lg p-3 flex justify-around text-center backdrop-blur-sm">
          {plantedCount > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground font-bold">ينمو</p>
              <p className="text-lg font-bold text-secondary">{plantedCount}</p>
            </div>
          )}
          {readyCount > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground font-bold">جاهز للحصاد</p>
              <p className="text-lg font-bold text-primary animate-pulse-gold">{readyCount}</p>
            </div>
          )}
        </div>
      )}

      {/* Game Field — responsive pan/zoom viewport */}
      <div
        ref={viewportRef}
        onClickCapture={(e) => {
          // Drop a click right after a pan/pinch/wheel so a drag doesn't tap a tile.
          if (suppressClick.current) {
            e.preventDefault()
            e.stopPropagation()
            suppressClick.current = false
          }
        }}
        className="game-field-viewport oasis-bg bg-gradient-to-b from-card to-background border-2 border-primary rounded-2xl flex-1 min-h-[240px]"
      >
        <div ref={layerRef} className="pan-zoom-layer" style={gridStyle}>
          {tiles.map((tile) => {
            const isometricStyle = getIsometricStyle(tile.x, tile.y)
            const growthPct = getGrowthPercentage(tile)
            const asset = ASSETS.find((a) => a.id === tile.assetId)
            let stageIcon = "🌱"

            if (tile.status === "planted" && asset) {
              stageIcon = asset.emoji
            } else if (tile.status === "ready" && asset) {
              stageIcon = asset.emoji
            }

            return (
              <div
                key={tile.id}
                style={isometricStyle}
                className={`absolute w-20 h-10 iso-pharaonic-tile flex flex-col items-center justify-center font-bold text-sm cursor-pointer transition-all ${
                  tile.status === "planted" ? "planted animate-pulse" : ""
                } ${tile.status === "ready" ? "ready animate-pulse-gold" : ""} ${
                  dayNightCycle === "night" ? "night" : ""
                }`}
              >
                <button
                  onClick={() => handleTileClick(tile.id)}
                  className="w-full h-full flex flex-col items-center justify-center relative active:scale-95 transition-transform"
                >
                  <span className="text-lg relative z-10">{stageIcon}</span>
                  
                  {tile.status === "planted" && (
                    <div className="absolute bottom-1 left-1 right-1 h-1 bg-background/40 rounded-full overflow-hidden z-20">
                      <div
                        className="h-full bg-gradient-to-r from-secondary to-primary transition-all"
                        style={{ width: `${growthPct}%` }}
                      />
                    </div>
                  )}

                  {tile.status === "ready" && (
                    <span className="absolute -top-2 -right-2 text-xs bg-primary text-primary-foreground font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                      ✓
                    </span>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* Zoom controls (do not trigger pan/zoom gestures) */}
        <div dir="ltr" className="absolute top-2 right-2 z-30 flex flex-col gap-2">
          <button
            type="button"
            data-pan-zoom-control
            aria-label="Zoom in"
            onClick={zoomIn}
            disabled={!canZoomIn}
            className="w-10 h-10 rounded-xl bg-background/80 border border-primary/50 text-primary font-bold text-xl flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40"
          >
            +
          </button>
          <button
            type="button"
            data-pan-zoom-control
            aria-label="Zoom out"
            onClick={zoomOut}
            disabled={!canZoomOut}
            className="w-10 h-10 rounded-xl bg-background/80 border border-primary/50 text-primary font-bold text-xl flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40"
          >
            −
          </button>
          {isZoomed && (
            <button
              type="button"
              data-pan-zoom-control
              aria-label="Reset view"
              onClick={resetView}
              className="w-10 h-10 rounded-xl bg-background/80 border border-primary/50 text-primary font-bold text-lg flex items-center justify-center active:scale-90 transition-transform"
            >
              ⟳
            </button>
          )}
        </div>

        {/* Scale indicator */}
        <div className="absolute bottom-2 left-2 z-30 bg-background/70 backdrop-blur rounded-full px-3 py-1 text-[11px] font-bold text-primary border border-primary/30">
          {Math.round(scale * 100)}%
        </div>

        {/* Gesture hint */}
        <div className="absolute bottom-2 right-2 z-30 pointer-events-none bg-background/60 rounded-full px-2 py-1 text-[9px] text-muted-foreground">
          👆 اسحب للتحريك • 🤏 قرصة للتكبير
        </div>
      </div>

      {/* Instructions */}
      <div className="shrink-0 bg-background/70 border-2 border-primary/40 rounded-lg p-3 space-y-2 backdrop-blur-sm">
        <p className="text-xs text-muted-foreground text-center font-bold">📖 كيفية اللعب</p>
        <div className="grid grid-cols-3 gap-2 text-[9px] text-muted-foreground text-center">
          <div className="p-2 bg-primary/10 rounded">
            <p className="font-bold">🌱 فارغ</p>
            <p>اضغط للزراعة</p>
          </div>
          <div className="p-2 bg-secondary/10 rounded">
            <p className="font-bold">🌾 ينمو</p>
            <p>{GROWTH_TIME_MS / 1000}ث</p>
          </div>
          <div className="p-2 bg-accent/10 rounded">
            <p className="font-bold">✓ جاهز</p>
            <p>+{HARVEST_REWARD} عملة</p>
          </div>
        </div>
      </div>

      {/* Kitchen Overlay Modal */}
      {showKitchen && (
        <RoyalKitchenOverlay onClose={() => setShowKitchen(false)} />
      )}
    </div>
  )
}
