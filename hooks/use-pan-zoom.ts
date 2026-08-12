"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/** Options for the pan/zoom controller. */
export interface UsePanZoomOptions {
  /** Smallest allowed scale factor. */
  minScale?: number
  /** Largest allowed scale factor. */
  maxScale?: number
  /** Scale factor used on first render / after a reset. */
  initialScale?: number
}

/** Movement (in px) before a single-pointer gesture is treated as a pan instead of a tap. */
const MOVE_THRESHOLD = 6
/** How long (ms) a pan/zoom gesture suppresses the next click so a drag doesn't tap a tile. */
const SUPPRESS_MS = 350

interface ViewState {
  scale: number
  x: number
  y: number
}

/**
 * Adds touch / mouse pan + pinch zoom to a "viewport" element, transforming an inner "layer"
 * element. Only the layer is transformed, so surrounding UI stays static.
 *
 * Usage:
 *   <div ref={viewportRef} className="...overflow-hidden touch-none...">
 *     <div ref={layerRef} style={{ width, height }}>…content…</div>
 *   </div>
 */
export function usePanZoom({
  minScale = 0.7,
  maxScale = 3.5,
  initialScale = 1,
}: UsePanZoomOptions = {}) {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const layerRef = useRef<HTMLDivElement | null>(null)

  const stateRef = useRef<ViewState>({ scale: initialScale, x: 0, y: 0 })
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const gestureRef = useRef<"none" | "pan" | "pinch">("none")
  const pinchStartRef = useRef<ViewState>({ scale: initialScale, x: 0, y: 0 })
  const pinchDistRef = useRef(0)
  const panStartRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 })
  const suppressClick = useRef(false)
  const suppressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [scale, setScale] = useState(initialScale)

  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

  const clearSuppressTimer = () => {
    if (suppressTimer.current) {
      clearTimeout(suppressTimer.current)
      suppressTimer.current = null
    }
  }

  /** Marks that the next click should be dropped (fired after a drag/pinch/wheel). */
  const markSuppress = () => {
    suppressClick.current = true
    clearSuppressTimer()
    suppressTimer.current = setTimeout(() => {
      suppressClick.current = false
    }, SUPPRESS_MS)
  }

  /** Applies a (clamped) transform directly to the layer and syncs the scale state. */
  const applyView = (s: number, x: number, y: number) => {
    const vp = viewportRef.current
    const ly = layerRef.current
    if (!vp || !ly) return

    const cw = vp.clientWidth
    const ch = vp.clientHeight
    const lw = ly.offsetWidth
    const lh = ly.offsetHeight

    const ns = clamp(s, minScale, maxScale)
    let nx = x
    let ny = y

    // Keep the layer on screen: centre it when it fits, otherwise clamp its edges.
    if (lw * ns <= cw) nx = (cw - lw * ns) / 2
    else nx = clamp(x, cw - lw * ns, 0)
    if (lh * ns <= ch) ny = (ch - lh * ns) / 2
    else ny = clamp(y, ch - lh * ns, 0)

    stateRef.current = { scale: ns, x: nx, y: ny }
    ly.style.transform = `translate(${nx}px, ${ny}px) scale(${ns})`
    ly.style.transformOrigin = "0 0"
    setScale(ns)
  }

  const resetView = useCallback(() => {
    const vp = viewportRef.current
    const ly = layerRef.current
    if (!vp || !ly) return
    const cw = vp.clientWidth
    const ch = vp.clientHeight
    applyView(initialScale, (cw - ly.offsetWidth * initialScale) / 2, (ch - ly.offsetHeight * initialScale) / 2)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialScale])

  /** Zooms by `factor` keeping the point (fx, fy) (viewport coords) anchored. */
  const zoomAt = useCallback(
    (fx: number, fy: number, factor: number) => {
      const { scale: s, x, y } = stateRef.current
      if (s <= 0) return
      const ns = clamp(s * factor, minScale, maxScale)
      const nx = fx - ((fx - x) * ns) / s
      const ny = fy - ((fy - y) * ns) / s
      applyView(ns, nx, ny)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [minScale, maxScale]
  )

  const zoomIn = useCallback(() => {
    const vp = viewportRef.current
    if (!vp) return
    zoomAt(vp.clientWidth / 2, vp.clientHeight / 2, 1.3)
  }, [zoomAt])

  const zoomOut = useCallback(() => {
    const vp = viewportRef.current
    if (!vp) return
    zoomAt(vp.clientWidth / 2, vp.clientHeight / 2, 1 / 1.3)
  }, [zoomAt])

  const getRel = (e: PointerEvent, rect: DOMRect) => ({
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  })

  const distBetween = (pts: { x: number; y: number }[]) =>
    pts.length < 2 ? 0 : Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)

  useEffect(() => {
    const vp = viewportRef.current
    if (!vp) return

    const onPointerDown = (e: PointerEvent) => {
      // Ignore gestures that start on the zoom controls (+, −, reset).
      if (e.target instanceof Element && e.target.closest("[data-pan-zoom-control]")) return

      vp.setPointerCapture?.(e.pointerId)
      const rect = vp.getBoundingClientRect()
      const p = getRel(e, rect)
      pointersRef.current.set(e.pointerId, p)

      if (pointersRef.current.size === 1) {
        gestureRef.current = "none"
        panStartRef.current = { x: p.x, y: p.y, startX: stateRef.current.x, startY: stateRef.current.y }
      } else if (pointersRef.current.size === 2) {
        gestureRef.current = "pinch"
        pinchStartRef.current = { ...stateRef.current }
        pinchDistRef.current = distBetween([...pointersRef.current.values()])
        markSuppress()
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      const current = pointersRef.current.get(e.pointerId)
      if (!current) return
      const rect = vp.getBoundingClientRect()
      const p = getRel(e, rect)

      // Promote a still tap into an active pan once it moves enough.
      if (gestureRef.current === "none" && pointersRef.current.size === 1) {
        const dx = p.x - panStartRef.current.x
        const dy = p.y - panStartRef.current.y
        if (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD) {
          gestureRef.current = "pan"
          markSuppress()
        }
      }

      if (gestureRef.current === "pan" && pointersRef.current.size === 1) {
        const dx = p.x - current.x
        const dy = p.y - current.y
        const v = stateRef.current
        applyView(v.scale, v.x + dx, v.y + dy)
      } else if (gestureRef.current === "pinch" && pointersRef.current.size >= 2) {
        const pts = [...pointersRef.current.values()]
        const focal = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 }
        const ratio = distBetween(pts) / (pinchDistRef.current || 1)
        const { scale: s, x, y } = pinchStartRef.current
        if (s > 0) {
          const ns = clamp(s * ratio, minScale, maxScale)
          const nx = focal.x - ((focal.x - x) * ns) / s
          const ny = focal.y - ((focal.y - y) * ns) / s
          applyView(ns, nx, ny)
        }
      }

      pointersRef.current.set(e.pointerId, p)
    }

    const endPointer = (e: PointerEvent) => {
      pointersRef.current.delete(e.pointerId)

      if (pointersRef.current.size === 0) {
        gestureRef.current = "none"
      } else if (pointersRef.current.size === 1) {
        // A finger lifted during a pinch — keep panning with the remaining one.
        gestureRef.current = "pan"
        const only = pointersRef.current.values().next().value
        panStartRef.current = { ...only, startX: stateRef.current.x, startY: stateRef.current.y }
      }
      vp.releasePointerCapture?.(e.pointerId)
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      markSuppress()
      const rect = vp.getBoundingClientRect()
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
      zoomAt(e.clientX - rect.left, e.clientY - rect.top, factor)
    }

    const onResize = () => resetView()

    vp.addEventListener("pointerdown", onPointerDown)
    vp.addEventListener("pointermove", onPointerMove)
    vp.addEventListener("pointerup", endPointer)
    vp.addEventListener("pointercancel", endPointer)
    vp.addEventListener("wheel", onWheel, { passive: false })
    window.addEventListener("resize", onResize)

    // Centre the map on first layout.
    resetView()

    return () => {
      vp.removeEventListener("pointerdown", onPointerDown)
      vp.removeEventListener("pointermove", onPointerMove)
      vp.removeEventListener("pointerup", endPointer)
      vp.removeEventListener("pointercancel", endPointer)
      vp.removeEventListener("wheel", onWheel)
      window.removeEventListener("resize", onResize)
      clearSuppressTimer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetView, zoomAt])

  const canZoomIn = scale < maxScale - 0.001
  const canZoomOut = scale > minScale + 0.001
  const isZoomed = Math.abs(scale - initialScale) > 0.001

  return {
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
  }
}


