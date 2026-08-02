// src/lib/marketData.ts

export interface MarketItem {
  id: string;
  name: string;
  category: 'crop' | 'tree' | 'processed' | 'factory' | 'equipment';
  icon: string;
  priceGold: number;
  xpReward: number;
}

export const MARKET_ITEMS: MarketItem[] = [
  // 🌾 المحاصيل الزراعية
  { id: 'crop_wheat', name: 'قمح فرعوني', category: 'crop', icon: '🌾', priceGold: 15, xpReward: 5 },
  { id: 'crop_barley', name: 'شعير أصيل', category: 'crop', icon: '🌿', priceGold: 20, xpReward: 7 },
  { id: 'crop_lotus', name: 'زهرة اللوتس', category: 'crop', icon: '🌸', priceGold: 35, xpReward: 12 },

  // 🌴 الأشجار المثمرة
  { id: 'date_palm', name: 'بلح النخيل', category: 'tree', icon: '🌴', priceGold: 30, xpReward: 10 },
  { id: 'fig_fruit', name: 'تين ملكي', category: 'tree', icon: '🍑', priceGold: 45, xpReward: 15 },

  // 🍞 المصنوعات
  { id: 'crop_flour', name: 'دقيق فاخر', category: 'processed', icon: '🍞', priceGold: 50, xpReward: 20 },
  { id: 'animal_produce', name: 'منتجات ألبان طازجة', category: 'processed', icon: '🥛', priceGold: 40, xpReward: 18 },

  // 🏭 المصانع والإنتاج
  { id: 'factory_bread_unit', name: 'وحدة مخابز فرعونية', category: 'factory', icon: '🏭', priceGold: 250, xpReward: 80 },
  { id: 'factory_loom_unit', name: 'منسج النيل الآلي', category: 'factory', icon: '🏛️', priceGold: 300, xpReward: 100 },

  // ⚙️ المعدات والعلف
  { id: 'feed', name: 'علف أسود مغذي (BSF)', category: 'equipment', icon: '🪱', priceGold: 25, xpReward: 8 },
  { id: 'equipment_plow_boost', name: 'محراث مسطح متطور', category: 'equipment', icon: '⚙️', priceGold: 120, xpReward: 40 },
];