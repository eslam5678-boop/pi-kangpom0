import { PlacedItem } from "@/lib/types"; // تأكد إن ده المسار الصحيح للملف عندك

export type SoilState = 'raw' | 'plowed' | 'watered' | 'planted';
export type GrowthStage = 0 | 1 | 2 | 3;

/**
 * 1. حرث الأرض: يحول الأرض الخام إلى أرض محروثة
 */
export function plowSoil(item: PlacedItem): PlacedItem {
  // تم تحويل && إلى || لمنع أي خطأ منطقي عند التفاعل مع أي عنصر غير التربة
  if (item.type !== 'soil' || item.soilState !== 'raw') return item;
  return {
    ...item,
    soilState: 'plowed',
    growthStage: 0,
    isWatered: false,
    plantedSeedId: null
  };
}

/**
 * 2. رش المياه: يحول الأرض المحروثة إلى مروية وجاهزة للزرع
 */
export function waterSoil(item: PlacedItem): PlacedItem {
  if (item.soilState !== 'plowed' && item.soilState !== 'planted') return item;
  return {
    ...item,
    soilState: item.soilState === 'plowed' ? 'watered' : 'planted',
    isWatered: true,
    lastWateredAt: Date.now()
  };
}

/**
 * 3. زرع البذور: يبدأ الزراعة في الأرض المروية
 */
export function plantSeed(item: PlacedItem, seedId: string): PlacedItem {
  if (item.soilState !== 'watered') return item;
  return {
    ...item,
    soilState: 'planted',
    plantedSeedId: seedId,
    plantedAt: Date.now(),
    growthStage: 0
  };
}

/**
 * 4. حساب وتحديث مرحلة النمو تلقائياً حسب الوقت المرتفع
 */
export function calculateGrowthStage(item: PlacedItem, totalGrowTimeSec: number): GrowthStage {
  if (item.soilState !== 'planted' || !item.plantedAt || !item.isWatered) return 0;

  const elapsedSec = (Date.now() - item.plantedAt) / 1000;
  const progress = elapsedSec / totalGrowTimeSec;

  if (progress >= 1) return 3;       // ناضج تماماً
  if (progress >= 0.66) return 2;    // نمو متوسط
  if (progress >= 0.33) return 1;    // برعم صغير
  return 0;                          // بذور
}

/**
 * 5. الحصاد: يرجع الأرض فوراً لحالة الأرض الخام (فاضية) بعد جمع المحصول
 */
export function harvestCrop(item: PlacedItem): PlacedItem {
  if (item.soilState !== 'planted' || item.growthStage !== 3) return item;
  return {
    ...item,
    soilState: 'raw',
    growthStage: 0,
    isWatered: false,
    plantedSeedId: null,
    plantedAt: null,
    lastHarvestTime: Date.now()
  };
}
