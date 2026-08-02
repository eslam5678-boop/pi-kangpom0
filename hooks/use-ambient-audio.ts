'use client'

import { useEffect, useRef, useState } from 'react'

export type TileAudioType = 'water' | 'animal' | 'bird' | 'ambience'

const AUDIO_LIBRARY: Record<TileAudioType, string> = {
  water: 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==',
  animal: 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==',
  bird: 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==',
  ambience: 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==',
}

export function useAmbientAudio() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const [isEnabled, setIsEnabled] = useState(true)

  useEffect(() => {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)()
    audioContextRef.current = context
  }, [])

  const playTileSound = async (type: TileAudioType, volume: number = 0.3) => {
    if (!isEnabled || !audioContextRef.current) return

    try {
      const context = audioContextRef.current
      const response = await fetch(AUDIO_LIBRARY[type])
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await context.decodeAudioData(arrayBuffer)

      const source = context.createBufferSource()
      const gainNode = context.createGain()

      source.buffer = audioBuffer
      gainNode.gain.value = volume
      source.connect(gainNode)
      gainNode.connect(context.destination)
      source.start(0)
    } catch (err) {
      console.log('[v0] Audio playback skipped (audio context not ready)')
    }
  }

  return { playTileSound, isEnabled, setIsEnabled }
}

// Simple web audio synthesizer for fallback
export function synthesizeSound(frequency: number, duration: number, type: 'sine' | 'square' = 'sine') {
  try {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = context.createOscillator()
    const gain = context.createGain()

    osc.frequency.value = frequency
    osc.type = type
    gain.gain.setValueAtTime(0.3, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + duration)

    osc.connect(gain)
    gain.connect(context.destination)
    osc.start(context.currentTime)
    osc.stop(context.currentTime + duration)
  } catch (err) {
    console.log('[v0] Synthesized sound skipped')
  }
}
