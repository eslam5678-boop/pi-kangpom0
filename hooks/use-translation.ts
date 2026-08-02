"use client"

import { useFarm } from "@/contexts/farm-context"
import { makeT, type Language } from "@/lib/farm-i18n"
import { useMemo } from "react"

export function useTranslation() {
  const { state } = useFarm()
  
  const t = useMemo(
    () => makeT(state.preferredLanguage as Language),
    [state.preferredLanguage]
  )
  
  const lang = state.preferredLanguage as Language
  const isRTL = lang === "ar"
  
  return { t, lang, isRTL }
}
