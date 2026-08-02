// Unified shared types for the farm app.
// This file is the single source of truth for cross-module interfaces.

export type AssetCategory =
  | 'crop'
  | 'tree'
  | 'animal'
  | 'aquaculture'
  | 'building'
  | 'decoration'
  | 'equipment'
  | 'soil'
  | 'seed'
  | 'factory';

export type BuffType =
  | 'yield_boost'
  | 'time_reduction'
  | 'cost_reduction'
  | 'quality_boost'
  | 'worker_blessing';

export type SoilState = 'raw' | 'plowed' | 'watered' | 'planted';
export type GrowthStage = 0 | 1 | 2 | 3;
export type RarityTier = 'common' | 'rare' | 'epic' | 'legendary';

export interface AuraBuff {
  type: BuffType;
  value: number;
  radius: number;
  targetCategories: AssetCategory[];
  description: string;
}

export interface GameAsset {
  id: string;
  name: string;
  category: AssetCategory;
  image: string;
  productName: string;
  gridSize: { width: number; height: number };
  requiresPedestal?: boolean;
  buyPriceGold: number;
  buyPricePi?: number;
  sellPriceGold?: number;
  requiredLevel: number;
  xpReward: number;
  productionTimeSec: number;
  outputQuantity: number;
  yieldAmount?: number;
  maintenanceCostGold?: number;
  auraBuff?: AuraBuff;
  rarity?: RarityTier;
  isNftEligible?: boolean;
  nftMintPricePi?: number;
}

export interface ProductionRecipe {
  id: string;
  buildingId: string;
  outputName: string;
  outputImage: string;
  inputs: { assetId: string; quantity: number }[];
  outputGoldValue: number;
  outputPiValue?: number;
  craftTimeSec: number;
  xpGranted: number;
  requiredLevel: number;
  outputRarity?: RarityTier;
}

export interface LandContract {
  id: string;
  name: string;
  description?: string;
  requiredLevel: number;
  priceGold?: number;
  pricePi?: number;
  gridDimensions: { rows: number; cols: number };
  storageBonus: number;
  marketFeeDiscount: number;
}

export interface StakingTier {
  id: string;
  name: string;
  stakedPiAmount: number;
  durationDays: number;
  rewardType: 'global_speed_boost' | 'rare_seeds' | 'gold_bonus' | 'storage_expansion';
  rewardValue: number;
}

export interface PlayerStats {
  gold: number;
  pi: number;
  level: number;
  xp: number;
  maxXp: number;
  energy: number;
  maxEnergy: number;
  inventory: Record<string, number>;
  walletAddress?: string;
  mintedNftsCount?: number;
}

export interface OwnedAsset {
  uid: string;
  defId: string;
  hunger: number;
  lastFedAt: number;
  sickSince: number;
  dead: boolean;
  landId: string;
  storedProduct: number;
  health: number;
}

export type ResourceType = string;

export interface InventoryItem {
  id: ResourceType;
  amount: number;
}

export interface FarmInventory {
  items: InventoryItem[];
}

export interface FactoryJob {
  factoryId: string;
  startedAt: number;
  finishesAt: number;
}

export interface MarketListing {
  id: string;
  defId: string;
  assetName: string;
  emoji: string;
  seller: string;
  price: number;
  mine: boolean;
}

export interface LandLease {
  id: string;
  leased: boolean;
  expiresAt: number;
}

export interface GameState {
  coins: number;
  xp: number;
  completedTasks: string[];
  assets: OwnedAsset[];
  leases: LandLease[];
  craftedGoods: Record<string, number>;
  factoryJobs: FactoryJob[];
  listings: MarketListing[];
  adsWatchedToday: number;
  lastAdDate: string;
  lastTaskResetDate: string;
  workerStamina: number;
  lastStaminaUpdateAt: number;
  hasSeenOnboarding: boolean;
  preferredLanguage: string;
  lastHealthCheckAt: number;
  unlockedServices?: string[];
}

export interface FarmState {
  coins?: number;
  xp?: number;
  completedTasks?: string[];
  assets?: OwnedAsset[];
  leases?: LandLease[];
  craftedGoods?: Record<string, number>;
  factoryJobs?: FactoryJob[];
  listings?: MarketListing[];
  adsWatchedToday?: number;
  lastAdDate?: string;
  lastTaskResetDate?: string;
  workerStamina?: number;
  lastStaminaUpdateAt?: number;
  hasSeenOnboarding?: boolean;
  preferredLanguage?: string;
  lastHealthCheckAt?: number;
  gridColumns?: number;
  gridRows?: number;
  placedItems: PlacedItem[];
  selectedItemForAction?: any;
  isRelocating?: boolean;
  isDiwanModalOpen?: boolean;
  [key: string]: any;
}

export interface AssetDef {
  id: string;
  name: string;
  emoji: string;
  produces: string | null;
  price: number;
}

export interface LandTierDef {
  id: string;
  name: string;
  cap: number;
  periodMs: number;
  rentCoins: number;
  costPi?: number;
  requiredTierId?: string;
  blurb?: string;
}

export interface FactoryDef {
  id: string;
  name: string;
  input: string;
  inputAmount: number;
  output: string;
  outputValue: number;
  durationMs: number;
}

export interface DailyTask {
  id: string;
  titleKey: string;
  descKey: string;
  xpReward: number;
  coinReward: number;
}

export interface PlacedItem {
  uid: string;
  assetId: string;
  x: number;
  y: number;
  type: AssetCategory;
  health: number;
  lastHarvestTime?: number;
  buffActive?: boolean;
  plantedSeedId?: string | null;
  plantedAt?: number | null;
  soilState?: SoilState;
  growthStage?: GrowthStage;
  isWatered?: boolean;
  lastWateredAt?: number | null;
  hunger?: number;
  thirst?: number;
  isSleeping?: boolean;
  isSick?: boolean;
  diseaseType?: string | null;
  pregnancyTimer?: number | null;
  isFed?: boolean;
  activeCrafts?: CraftingQueueItem[];
  isMintedNft?: boolean;
  nftTokenId?: string;
  currentRecipeId?: string | null;
  status?: 'idle' | 'producing' | 'paused_missing_resources' | 'ready_to_harvest' | string;
  progress?: number;
  timeRemaining?: number;
  totalProductionTime?: number;
  [key: string]: any;
}

export interface Worker {
  id: string;
  name: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  stamina: number;
  status: 'walking' | 'working' | 'resting' | 'carrying';
  image: string;
  currentTask?: string;
  level?: number;
  xp?: number;
  speed?: number;
  salaryGold?: number;
  hunger?: number;
  restTimer?: number;
}

export interface CraftingQueueItem {
  queueId: string;
  recipeId: string;
  startTime: number;
  endTime: number;
  isCompleted: boolean;
}

export interface OrderItemRequirement {
  itemName: string;
  quantityRequired: number;
}

export interface TradeOrder {
  id: string;
  title: string;
  description?: string;
  clientName: string;
  clientImage?: string;
  requirements: OrderItemRequirement[];
  rewardGold: number;
  rewardPi: number;
  rewardXp: number;
  rewardSpecialItem?: string;
  timeRemainingSec: number;
  expiresAt: number;
  isCompleted: boolean;
  rarity: RarityTier;
}

export interface NftMetadata {
  tokenId: string;
  assetId: string;
  name: string;
  description: string;
  image: string;
  rarity: RarityTier;
  mintedAt: number;
  mintedBy: string;
  piMintFee: number;
  attributes: {
    trait_type: string;
    value: string | number;
  }[];
}

export interface NftMintRequest {
  requestId: string;
  assetId: string;
  targetItemUid: string;
  status: 'idle' | 'pending_approval' | 'processing_mint' | 'completed' | 'failed';
  txHash?: string;
  errorMessage?: string;
  createdAt: number;
}
