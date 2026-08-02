'use client'

import { useEffect, useState } from 'react'

export function useTimeTheme() {
  const [isDaytime, setIsDaytime] = useState(true)

  useEffect(() => {
    const updateTheme = () => {
      const now = new Date()
      const hour = now.getHours()
      // Daytime: 6am - 6pm, Nighttime: 6pm - 6am
      const isDay = hour >= 6 && hour < 18
      setIsDaytime(isDay)
      
      if (isDay) {
        document.documentElement.classList.remove('night-mode')
      } else {
        document.documentElement.classList.add('night-mode')
      }
    }

    updateTheme()
    const interval = setInterval(updateTheme, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [])

  return isDaytime
}
