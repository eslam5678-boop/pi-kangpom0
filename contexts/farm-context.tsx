"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react"
import {
  type GameState,
  type OwnedAsset,
  type FactoryJob,
  type MarketListing,
  EXPANDED_LAND_TIERS,
  LAND_TIERS,
  FACTORIES,
  DAILY_TASKS,
  assetDef,
  landTier,
  computeStatus,
  randomNpc,
  uid,
  computeWorkerStamina,
  computeAssetHealth,
  isHealthCritical,
  resetDailyTasks,
  resetDailyAds,
  isNewDay,
  WORKER_STAMINA_DRAIN_PER_FACTORY_JOB,
  WORKER_MIN_STAMINA_FOR_PRODUCTION,
} from "@/lib/farm-types"
import { detectLanguage, type Language } from "@/lib/farm-i18n"

const STORAGE_KEY = "pharaohs_pi_farm_v1"

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function seedState(): GameState {
  const now = Date.now()
  const lang = detectLanguage()
  const starter: OwnedAsset[] = [
    { uid: uid(), defId: "chicken", hunger: 90, lastFedAt: now, sickSince: 0, dead: false, landId: "municipal", storedProduct: 0, health: 100 },
    { uid: uid(), defId: "chicken", hunger: 70, lastFedAt: now, sickSince: 0, dead: false, landId: "municipal", storedProduct: 0, health: 100 },
    { uid: uid(), defId: "chicken", hunger: 80, lastFedAt: now, sickSince: 0, dead: false, landId: "municipal", storedProduct: 0, health: 100 },
    { uid: uid(), defId: "tilapia", hunger: 85, lastFedAt: now, sickSince: 0, dead: false, landId: "municipal", storedProduct: 0, health: 100 },
  ]
  const listings: MarketListing[] = [
    { id: uid(), defId: "sheep", assetName: "أغنام", emoji: "🐑", seller: randomNpc(), price: 180, mine: false },
    { id: uid(), defId: "duck", assetName: "بط", emoji: "🦆", seller: randomNpc(), price: 75, mine: false },
    { id: uid(), defId: "oyster", assetName: "محار ملكي", emoji: "🦪", seller: randomNpc(), price: 480, mine: false },
    { id: uid(), defId: "cow", assetName: "أبقار", emoji: "🐄", seller: randomNpc(), price: 320, mine: false },
  ]
  return {
    coins: 500,
    xp: 0,
    completedTasks: [],
    assets: starter,
    leases: EXPANDED_LAND_TIERS.map((t) => ({ id: t.id, leased: t.id === "municipal", expiresAt: 0 })),
    craftedGoods: {},
    factoryJobs: [],
    listings,
    adsWatchedToday: 0,
    lastAdDate: today(),
    lastTaskResetDate: today(),
    workerStamina: 100,
    lastStaminaUpdateAt: Date.now(),
    hasSeenOnboarding: false,
    preferredLanguage: lang,
    lastHealthCheckAt: now,
  }
}

function load(): GameState {
  if (typeof window === "undefined") return seedState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return seedState()
    }
    let parsed = JSON.parse(raw) as GameState
    const currentDate = today()
    
    // Reset daily tasks and ads if new day detected
    if (isNewDay(parsed.lastTaskResetDate)) {
      parsed = resetDailyTasks(parsed)
    }
    if (isNewDay(parsed.lastAdDate)) {
      parsed = resetDailyAds(parsed)
    }
    return parsed
  } catch (error) {
    console.error("[v0] Error loading game state from localStorage:", error)
    return seedState()
  }
}

interface FarmContextType {
  state: GameState
  tick: number
  buyAsset: (defId: string, price: number, listingId?: string) => boolean
  feedAsset: (assetUid: string) => void
  feedAll: () => void
  collectProduct: (assetUid: string) => void
  collectAll: () => void
  leaseLand: (tierId: string) => void
  isLandActive: (tierId: string) => boolean
  startFactory: (factoryId: string) => boolean
  collectFactory: (factoryId: string) => void
  sellGood: (good: string) => void
  listAsset: (assetUid: string, price: number) => void
  unlistListing: (listingId: string) => void
  reviveAsset: (assetUid: string) => void
  watchAd: () => void
  resetAds: () => void
  rawProductCount: (key: string) => number
  restWorker: () => void
  getWorkerStamina: () => number
  addCoins: (amount: number) => void
  unlockService: (serviceId: string) => boolean
  completeOnboarding: () => void
  setLanguage: (lang: Language) => void
  getAverageHealth: () => number
  completeTask: (taskId: string) => void
  factoryReset: () => void
}

const FarmContext = createContext<FarmContextType | undefined>(undefined)

export function FarmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(seedState())
  const [tick, setTick] = useState(0)
  const loaded = useRef(false)

  // hydrate
  useEffect(() => {
    try {
      const loadedState = load()
      console.log("[v0] Loaded state from localStorage:", loadedState ? "success" : "empty")
      setState(loadedState)
      loaded.current = true
    } catch (error) {
      console.error("[v0] Error during game hydration:", error)
      setState(seedState())
      loaded.current = true
    }
  }, [])

  // persist - triggered on ANY state change
  useEffect(() => {
    if (!loaded.current) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (error) {
      console.error("[v0] [PERSIST] Failed to save game state:", error)
    }
  }, [state])

  // game loop — every 3s: produce, age, mark deaths, regen stamina
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        setTick((t) => t + 1)
        setState((prev) => {
          try {
            const now = Date.now()
            let changed = false
            
            // Update worker stamina (regen over time)
            const currentStamina = computeWorkerStamina(prev.workerStamina, prev.lastStaminaUpdateAt, now)
            if (currentStamina !== prev.workerStamina) changed = true
            
            const assets = prev.assets.map((a) => {
              if (a.dead) return a
              const st = computeStatus(a, now)
              const next = { ...a }
              // sync sickness onset into stored state
              if (st.sick && next.sickSince === 0) {
                next.sickSince = now
                changed = true
              }
              if (st.dead && !next.dead) {
                next.dead = true
                changed = true
              }
              // production: only if not sick, not dead, land active, has hunger, AND worker stamina > threshold
              const def = assetDef(a.defId)
              const landActive = isLeaseActive(prev, a.landId, now)
              if (def.produces && !st.sick && !st.dead && st.hunger > 0 && landActive && currentStamina > WORKER_MIN_STAMINA_FOR_PRODUCTION) {
                // produce slowly: 1 unit per ~30s of healthy time -> add fraction
                next.storedProduct = Math.min(20, next.storedProduct + 0.1)
                changed = true
              }
              return next
            })
            if (!changed && currentStamina === prev.workerStamina) return prev
            return { 
              ...prev, 
              assets,
              workerStamina: currentStamina,
              lastStaminaUpdateAt: now,
            }
          } catch (error) {
            console.error("[v0] Error in game loop tick:", error)
            return prev
          }
        })
      } catch (error) {
        console.error("[v0] Error in game loop interval:", error)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Health check loop — every 30 minutes: update asset health
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        setState((prev) => {
          try {
            const now = Date.now()
            const hoursSinceLastCheck = (now - prev.lastHealthCheckAt) / 3600e3
            if (hoursSinceLastCheck < 0.5) return prev // check every 30 min
            
            const assets = prev.assets.map((a) => {
              if (a.dead) return a
              const newHealth = computeAssetHealth(a, now)
              if (newHealth !== a.health) {
                return { ...a, health: newHealth }
              }
              return a
            })
            
            return {
              ...prev,
              assets,
              lastHealthCheckAt: now,
            }
          } catch (error) {
            console.error("[v0] Error in health check:", error)
            return prev
          }
        })
      } catch (error) {
        console.error("[v0] Error in health check interval:", error)
      }
    }, 30 * 60 * 1000) // Check every 30 minutes
    return () => clearInterval(interval)
  }, [])

  const rawProductCount = useCallback(
    (key: string) => {
      return Math.floor(
        state.assets
          .filter((a) => !a.dead && assetDef(a.defId).produces === key)
          .reduce((s, a) => s + a.storedProduct, 0),
      )
    },
    [state.assets],
  )

  const isLandActive = useCallback(
    (tierId: string) => isLeaseActive(state, tierId, Date.now()),
    [state],
  )

  const buyAsset = useCallback((defId: string, price: number, listingId?: string) => {
    try {
      let ok = false
      setState((prev) => {
        try {
          if (prev.coins < price) {
            return prev
          }
          // find a land tier with capacity
          const now = Date.now()
          const targetLand = EXPANDED_LAND_TIERS.find((t) => {
            if (!isLeaseActive(prev, t.id, now)) return false
            const count = prev.assets.filter((a) => a.landId === t.id && !a.dead).length
            return count < t.cap
          })
          if (!targetLand) {
            return prev
          }
          ok = true
          const newAsset: OwnedAsset = {
            uid: uid(),
            defId,
            hunger: 100,
            lastFedAt: now,
            sickSince: 0,
            dead: false,
            landId: targetLand.id,
            storedProduct: 0,
            health: 100,
          }
          const listings = listingId ? prev.listings.filter((l) => l.id !== listingId) : prev.listings
          return { ...prev, coins: prev.coins - price, assets: [...prev.assets, newAsset], listings }
        } catch (error) {
          console.error("[v0] Error in buyAsset setState:", error)
          return prev
        }
      })
      return ok
    } catch (error) {
      console.error("[v0] Error in buyAsset:", error)
      return false
    }
  }, [])

  const feedAsset = useCallback((assetUid: string) => {
    try {
      setState((prev) => {
        try {
          return {
            ...prev,
            assets: prev.assets.map((a) =>
              a.uid === assetUid && !a.dead
                ? { ...a, hunger: 100, lastFedAt: Date.now(), sickSince: 0 }
                : a,
            ),
          }
        } catch (error) {
          console.error("[v0] Error in feedAsset setState:", error)
          return prev
        }
      })
    } catch (error) {
      console.error("[v0] Error in feedAsset:", error)
    }
  }, [])

  const feedAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      assets: prev.assets.map((a) =>
        a.dead ? a : { ...a, hunger: 100, lastFedAt: Date.now(), sickSince: 0 },
      ),
    }))
  }, [])

  const collectProduct = useCallback((assetUid: string) => {
    try {
      setState((prev) => {
        try {
          const asset = prev.assets.find((a) => a.uid === assetUid)
          if (!asset || asset.storedProduct <= 0) return prev
          const amount = Math.floor(asset.storedProduct)
          return {
            ...prev,
            coins: prev.coins + amount,
            assets: prev.assets.map((a) =>
              a.uid === assetUid ? { ...a, storedProduct: 0 } : a,
            ),
          }
        } catch (error) {
          console.error("[v0] Error in collectProduct setState:", error)
          return prev
        }
      })
    } catch (error) {
      console.error("[v0] Error in collectProduct:", error)
    }
  }, [])

  const collectAll = useCallback(() => {
    setState((prev) => {
      let raws: Record<string, number> = { ...prev.craftedGoods }
      const assets = prev.assets.map((a) => {
        const amt = Math.floor(a.storedProduct)
        if (amt > 0 && !a.dead) {
          const key = assetDef(a.defId).produces
          if (key) raws[key] = (raws[key] || 0) + amt
          return { ...a, storedProduct: a.storedProduct - amt }
        }
        return a
      })
      return { ...prev, assets, craftedGoods: raws }
    })
  }, [])

  const leaseLand = useCallback((tierId: string) => {
    setState((prev) => {
      const tier = landTier(tierId)
      const now = Date.now()
      return {
        ...prev,
        leases: prev.leases.map((l) =>
          l.id === tierId
            ? { ...l, leased: true, expiresAt: tier.periodMs === 0 ? 0 : now + tier.periodMs }
            : l,
        ),
      }
    })
  }, [])

  const startFactory = useCallback((factoryId: string) => {
    let ok = false
    setState((prev) => {
      const f = FACTORIES.find((x) => x.id === factoryId)
      if (!f) return prev
      if (prev.factoryJobs.some((j) => j.factoryId === factoryId)) {
        return prev
      }
      const have = prev.craftedGoods[f.input] || 0
      if (have < f.inputAmount) {
        return prev
      }
      
      // Check worker stamina
      const currentStamina = computeWorkerStamina(prev.workerStamina, prev.lastStaminaUpdateAt, Date.now())
      if (currentStamina < WORKER_STAMINA_DRAIN_PER_FACTORY_JOB) {
        return prev
      }
      
      ok = true
      const now = Date.now()
      return {
        ...prev,
        craftedGoods: { ...prev.craftedGoods, [f.input]: have - f.inputAmount },
        factoryJobs: [...prev.factoryJobs, { factoryId, startedAt: now, finishesAt: now + f.durationMs }],
        workerStamina: Math.max(0, currentStamina - WORKER_STAMINA_DRAIN_PER_FACTORY_JOB),
        lastStaminaUpdateAt: now,
      }
    })
    return ok
  }, [])

  const collectFactory = useCallback((factoryId: string) => {
    setState((prev) => {
      const job = prev.factoryJobs.find((j) => j.factoryId === factoryId)
      if (!job || Date.now() < job.finishesAt) {
        return prev
      }
      const f = FACTORIES.find((x) => x.id === factoryId)!
      return {
        ...prev,
        coins: prev.coins + f.outputValue,
        craftedGoods: { ...prev.craftedGoods, [f.output]: (prev.craftedGoods[f.output] || 0) + 1 },
        factoryJobs: prev.factoryJobs.filter((j) => j.factoryId !== factoryId),
      }
    })
  }, [])

  const sellGood = useCallback((good: string) => {
    setState((prev) => {
      const qty = prev.craftedGoods[good] || 0
      if (qty <= 0) return prev
      const f = FACTORIES.find((x) => x.output === good)
      const value = f ? f.outputValue : 10
      return {
        ...prev,
        coins: prev.coins + value,
        craftedGoods: { ...prev.craftedGoods, [good]: qty - 1 },
      }
    })
  }, [])

  const listAsset = useCallback((assetUid: string, price: number) => {
    setState((prev) => {
      const a = prev.assets.find((x) => x.uid === assetUid)
      if (!a || a.dead) {
        return prev
      }
      const def = assetDef(a.defId)
      const listing: MarketListing = {
        id: uid(),
        defId: a.defId,
        assetName: def.name,
        emoji: def.emoji,
        seller: "أنت",
        price,
        mine: true,
      }
      return {
        ...prev,
        assets: prev.assets.filter((x) => x.uid !== assetUid),
        listings: [listing, ...prev.listings],
      }
    })
  }, [])

  const unlistListing = useCallback((listingId: string) => {
    setState((prev) => {
      const listing = prev.listings.find((l) => l.id === listingId)
      if (!listing || !listing.mine) return prev
      const now = Date.now()
      const targetLand = LAND_TIERS.find((t) => {
        if (!isLeaseActive(prev, t.id, now)) return false
        const count = prev.assets.filter((a) => a.landId === t.id && !a.dead).length
        return count < t.cap
      })
      if (!targetLand) return prev
      const restored: OwnedAsset = {
        uid: uid(),
        defId: listing.defId,
        hunger: 100,
        lastFedAt: now,
        sickSince: 0,
        dead: false,
        landId: targetLand.id,
        storedProduct: 0,
        health: 100,
      }
      return {
        ...prev,
        assets: [...prev.assets, restored],
        listings: prev.listings.filter((l) => l.id !== listingId),
      }
    })
  }, [])

  const reviveAsset = useCallback((assetUid: string) => {
    setState((prev) => ({
      ...prev,
      adsWatchedToday: 0,
      assets: prev.assets.map((a) =>
        a.uid === assetUid
          ? { ...a, dead: false, hunger: 100, lastFedAt: Date.now(), sickSince: 0 }
          : a,
      ),
    }))
  }, [])

  const watchAd = useCallback(() => {
    setState((prev) => ({
      ...prev,
      adsWatchedToday: prev.adsWatchedToday + 1,
      lastAdDate: today(),
    }))
  }, [])

  const resetAds = useCallback(() => {
    setState((prev) => ({ ...prev, adsWatchedToday: 0 }))
  }, [])

  const restWorker = useCallback(() => {
    setState((prev) => ({
      ...prev,
      workerStamina: 100,
      lastStaminaUpdateAt: Date.now(),
    }))
  }, [])

  const getWorkerStamina = useCallback((): number => {
    return computeWorkerStamina(state.workerStamina, state.lastStaminaUpdateAt, Date.now())
  }, [state.workerStamina, state.lastStaminaUpdateAt])

  const addCoins = useCallback((amount: number) => {
    setState((prev) => ({
      ...prev,
      coins: prev.coins + amount,
    }))
  }, [])

  const unlockService = useCallback((serviceId: string) => {
    let ok = false
    setState((prev) => {
      const already = prev.unlockedServices?.includes(serviceId)
      if (already) return prev
      ok = true
      return {
        ...prev,
        unlockedServices: [...(prev.unlockedServices || []), serviceId],
      }
    })
    return ok
  }, [])

  const completeOnboarding = useCallback(() => {
    setState((prev) => ({
      ...prev,
      hasSeenOnboarding: true,
    }))
  }, [])

  const setLanguage = useCallback((lang: Language) => {
    setState((prev) => ({
      ...prev,
      preferredLanguage: lang,
    }))
  }, [])

  const getAverageHealth = useCallback((): number => {
    if (state.assets.length === 0) return 100
    const totalHealth = state.assets.reduce((sum, a) => sum + a.health, 0)
    return Math.round(totalHealth / state.assets.length)
  }, [state.assets])

  const completeTask = useCallback((taskId: string) => {
    setState((prev) => {
      if (prev.completedTasks.includes(taskId)) {
        return prev
      }
      const task = DAILY_TASKS.find((t) => t.id === taskId)
      if (!task) {
        return prev
      }
      const today = new Date().toISOString().split("T")[0]
      return {
        ...prev,
        xp: prev.xp + task.xpReward,
        coins: prev.coins + task.coinReward,
        completedTasks: [...prev.completedTasks, taskId],
        lastTaskResetDate: today,
      }
    })
  }, [])

  const factoryReset = useCallback(() => {
    // Clear all localStorage data
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error("[v0] [FACTORY_RESET] Error clearing localStorage:", error)
    }

    // Clear session storage and any caches
    try {
      sessionStorage.clear()
    } catch (error) {
      console.error("[v0] [FACTORY_RESET] Error clearing sessionStorage:", error)
    }

    // Reset all state to fresh seed
    const freshState = seedState()

    // Set state to fresh and ensure onboarding shows
    setState((prev) => ({
      ...freshState,
      hasSeenOnboarding: false // Force onboarding to show
    }))

    console.log("[v0] ===== FACTORY RESET COMPLETE - GAME READY FOR FRESH START =====")
  }, [])

  const value: FarmContextType = {
    state,
    tick,
    buyAsset,
    feedAsset,
    feedAll,
    collectProduct,
    collectAll,
    leaseLand,
    isLandActive,
    startFactory,
    collectFactory,
    sellGood,
    listAsset,
    unlistListing,
    reviveAsset,
    watchAd,
    resetAds,
    rawProductCount,
    restWorker,
    getWorkerStamina,
    addCoins,
    unlockService,
    completeOnboarding,
    setLanguage,
    getAverageHealth,
    completeTask,
    factoryReset,
  }

  return <FarmContext.Provider value={value}>{children}</FarmContext.Provider>
}

function isLeaseActive(state: GameState, tierId: string, now: number): boolean {
  const lease = state.leases.find((l) => l.id === tierId)
  if (!lease || !lease.leased) return false
  if (lease.expiresAt === 0) return true
  return now < lease.expiresAt
}

function accumulateRaw(state: GameState, key: string | null, amt: number): Partial<GameState> {
  if (!key) return {}
  return {
    craftedGoods: { ...state.craftedGoods, [key]: (state.craftedGoods[key] || 0) + amt },
  }
}

export function useFarm() {
  const ctx = useContext(FarmContext)
  if (!ctx) throw new Error("useFarm must be used within FarmProvider")
  return ctx
}
