import type { AssetDef, LandTierDef, FactoryDef, DailyTask, GameState, OwnedAsset } from "./types"

export * from "./types"

// ==========================================
// 2. الثوابت وإعدادات اللعبة (Constants)
// ==========================================

export const WORKER_STAMINA_DRAIN_PER_FACTORY_JOB = 20
export const WORKER_MIN_STAMINA_FOR_PRODUCTION = 10

export const ASSETS: AssetDef[] = [
  { id: "chicken", name: "دجاج بلدي", emoji: "🐔", produces: "eggs", price: 45 },
  { id: "tilapia", name: "سمك بلطي", emoji: "🐟", produces: "fish", price: 90 },
  { id: "cow", name: "بقرة ملكية", emoji: "🐄", produces: "milk", price: 350 },
  { id: "sheep", name: "أغنام", emoji: "🐑", produces: "wool", price: 200 },
  { id: "duck", name: "بط صحراوي", emoji: "🦆", produces: "feathers", price: 70 },
  { id: "oyster", name: "محار ملكي", emoji: "🦪", produces: "pearls", price: 520 },
]

export const LAND_TIERS: LandTierDef[] = [
  { id: "municipal", name: "الحيز البلدي", cap: 5, periodMs: 0, rentCoins: 0, costPi: 0, blurb: "بداية الملكية الأساسية" },
  { id: "farmer", name: "عزبة المزارع", cap: 12, periodMs: 7 * 24 * 3600 * 1000, rentCoins: 150, costPi: 2, requiredTierId: "municipal", blurb: "توسعة أولى للمزرعة" },
  { id: "pasha", name: "المزرعة البشواتية", cap: 25, periodMs: 14 * 24 * 3600 * 1000, rentCoins: 600, costPi: 7, requiredTierId: "farmer", blurb: "مستوى إقطاعي مميز" },
  { id: "royal", name: "المحمية الملكية", cap: 50, periodMs: 30 * 24 * 3600 * 1000, rentCoins: 1800, costPi: 15, requiredTierId: "pasha", blurb: "أرض ملكية فاخرة" },
]

export const EXPANDED_LAND_TIERS: LandTierDef[] = [
  ...LAND_TIERS,
  { id: "golden_pyramid", name: "الهرم الذهبي", cap: 75, periodMs: 45 * 24 * 3600 * 1000, rentCoins: 3500, costPi: 30, requiredTierId: "royal", blurb: "مستوى ملكي ذهبي" },
  { id: "solar_temple", name: "المعبد الشمسي", cap: 100, periodMs: 60 * 24 * 3600 * 1000, rentCoins: 5500, costPi: 50, requiredTierId: "golden_pyramid", blurb: "قمة الرفاهية والسلطة" },
]

export const FACTORIES: FactoryDef[] = [
  { id: "dairy", name: "معمل الألبان", input: "milk", inputAmount: 2, output: "cheese", outputValue: 160, durationMs: 12000 },
  { id: "bakery", name: "المخبز الملكي", input: "eggs", inputAmount: 3, output: "cake", outputValue: 120, durationMs: 10000 },
]

export const EXPANDED_FACTORY_BLUEPRINTS: FactoryDef[] = [
  ...FACTORIES,
  { id: "gold_mill", name: "طاحونة الذهب", input: "gold", inputAmount: 1, output: "gold_ingot", outputValue: 280, durationMs: 20000 },
  { id: "perfume_foundry", name: "ورش العطور الملكية", input: "oil", inputAmount: 2, output: "perfume", outputValue: 320, durationMs: 24000 },
]

// المهام اليومية المطلوبة
export const DAILY_TASKS: DailyTask[] = [
  {
    id: "feed_chickens",
    titleKey: "task_feed_chickens_title",
    descKey: "task_feed_chickens_desc",
    xpReward: 25,
    coinReward: 50,
  },
  {
    id: "harvest_crops",
    titleKey: "task_harvest_crops_title",
    descKey: "task_harvest_crops_desc",
    xpReward: 30,
    coinReward: 60,
  },
  {
    id: "cook_meal",
    titleKey: "task_cook_meal_title",
    descKey: "task_cook_meal_desc",
    xpReward: 40,
    coinReward: 100,
  },
]

// ==========================================
// 3. الدوال المساعدة (Helper Functions)
// ==========================================

export function uid(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
}

export function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function isNewDay(lastDateStr: string): boolean {
  if (!lastDateStr) return true
  return today() !== lastDateStr
}

export function randomNpc(): string {
  const npcs = ["فرعون العصور", "معلم إبراهيم", "شيخ العرب", "الأمير إخناتون", "الحاج متولي"]
  return npcs[Math.floor(Math.random() * npcs.length)]
}

export function assetDef(defId: string): AssetDef {
  return ASSETS.find((a) => a.id === defId) || { id: defId, name: defId, emoji: "📦", produces: null, price: 100 }
}

export function landTier(tierId: string): LandTierDef {
  return EXPANDED_LAND_TIERS.find((t) => t.id === tierId) || LAND_TIERS[0]
}

export function computeStatus(asset: OwnedAsset, now: number) {
  const hoursSinceFed = (now - asset.lastFedAt) / (3600 * 1000)
  const hunger = Math.max(0, Math.floor(100 - hoursSinceFed * 10))
  const sick = asset.sickSince > 0 || hunger < 20
  const dead = asset.dead || (asset.sickSince > 0 && (now - asset.sickSince) > 24 * 3600 * 1000)
  return { hunger, sick, dead }
}

export function computeWorkerStamina(currentStamina: number, lastUpdateAt: number, now: number): number {
  const minutes = (now - lastUpdateAt) / (60 * 1000)
  const restored = minutes * 2
  return Math.min(100, Math.floor(currentStamina + restored))
}

export function computeAssetHealth(asset: OwnedAsset, now: number): number {
  if (asset.dead) return 0
  const hours = (now - asset.lastFedAt) / (3600 * 1000)
  if (hours > 12) {
    return Math.max(10, asset.health - Math.floor((hours - 12) * 5))
  }
  return Math.min(100, asset.health + 2)
}

export function isHealthCritical(health: number): boolean {
  return health < 30
}

export function resetDailyTasks(state: GameState): GameState {
  return {
    ...state,
    completedTasks: [],
    lastTaskResetDate: today(),
  }
}

export function resetDailyAds(state: GameState): GameState {
  return {
    ...state,
    adsWatchedToday: 0,
    lastAdDate: today(),
  }
}
