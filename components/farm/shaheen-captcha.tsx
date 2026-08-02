"use client"

import { useRef, useState, useCallback, useEffect } from "react"

/**
 * "عم شاهين" anti-bot contextual drag captcha.
 * Player must drag the scarab into the ankh target to prove they are human.
 */
export function ShaheenCaptcha({
  onVerified,
  onCancel,
}: {
  onVerified: () => void
  onCancel: () => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState(0) // 0..1
  const draggingRef = useRef(false)
  const [done, setDone] = useState(false)

  const move = useCallback(
    (clientX: number) => {
      const track = trackRef.current
      if (!track || done) return
      const rect = track.getBoundingClientRect()
      // RTL: target is on the LEFT, start on the RIGHT.
      const fromRight = rect.right - clientX - 28
      const ratio = Math.max(0, Math.min(1, fromRight / (rect.width - 56)))
      setPos(ratio)
      if (ratio >= 0.95) {
        setDone(true)
        draggingRef.current = false
        setPos(1)
        setTimeout(onVerified, 350)
      }
    },
    [onVerified, done],
  )

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => draggingRef.current && move(e.clientX)
    const onTouchMove = (e: TouchEvent) => draggingRef.current && move(e.touches[0].clientX)
    const stop = () => {
      draggingRef.current = false
    }
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("touchmove", onTouchMove, { passive: false })
    window.addEventListener("mouseup", stop)
    window.addEventListener("touchend", stop)
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("mouseup", stop)
      window.removeEventListener("touchend", stop)
    }
  }, [move])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/90 backdrop-blur p-4">
      <div className="w-full max-w-sm bg-card rounded-2xl border-2 border-secondary/50 glow-mint p-5 space-y-4 text-center">
        <div className="text-4xl">🧔🏽</div>
        <h3 className="text-base font-bold text-secondary">تحقّق عم شاهين</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          أثبت أنك إنسان حقيقي وليس روبوتاً. اسحب الجُعران 🪲 نحو رمز العنخ ☥ على اليسار.
        </p>

        <div
          ref={trackRef}
          className="relative h-14 rounded-full bg-background border border-border overflow-hidden select-none touch-none"
        >
          {/* target */}
          <div className="absolute inset-y-0 left-0 w-14 flex items-center justify-center text-2xl text-primary">
            ☥
          </div>
          {/* fill */}
          <div
            className="absolute inset-y-0 right-0 bg-secondary/20"
            style={{ width: `${pos * 100}%` }}
          />
          {/* handle */}
          <div
            role="slider"
            aria-valuenow={Math.round(pos * 100)}
            aria-label="اسحب للتحقق"
            tabIndex={0}
            onMouseDown={() => {
              draggingRef.current = true
            }}
            onTouchStart={() => {
              draggingRef.current = true
            }}
            className={`absolute inset-y-1 w-12 rounded-full flex items-center justify-center text-2xl cursor-grab active:cursor-grabbing transition-colors ${
              done ? "bg-secondary" : "bg-primary"
            }`}
            style={{ right: `calc(${pos} * (100% - 56px))` }}
          >
            {done ? "✓" : "🪲"}
          </div>
        </div>

        <button onClick={onCancel} className="text-xs text-muted-foreground underline">
          إلغاء
        </button>
      </div>
    </div>
  )
}
