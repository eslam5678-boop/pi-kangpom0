import { GameAsset, ProductionRecipe, AssetCategory } from '@/lib/types';

// ============================================================================
// 1. مباني التصنيع الملكية (Crafting Buildings)
// تم تعريفها كـ GameAsset لتنضم لمتجر اللعبة بسهولة وبدون تعديل ملف gameData.ts القديم
// ============================================================================

export const CRAFTING_BUILDINGS: Record<string, GameAsset> = {
  royal_mill: {
    id: 'royal_mill',
    name: 'طاحونة الوادي الفرعونية',
    category: 'building' as AssetCategory,
    image: '/buildings/royal_mill.png', // يمكنك تغيير المسار حسب الأيقونات المتاحة لديك
    productName: 'دقيق ومنتجات مطحونة',
    gridSize: { width: 2, height: 2 },
    buyPriceGold: 300,
    requiredLevel: 3,
    xpReward: 50,
    rarity: 'common',
    description: 'تستخدم لطحن سنابل القمح وحبوب الشعير لتحويلها إلى دقيق فاخر ومواد أساسية.'
  } as GameAsset & { description?: string },

  sacred_oil_press: {
    id: 'sacred_oil_press',
    name: 'معصرة الزيوت المقدسة',
    category: 'building' as AssetCategory,
    image: '/buildings/oil_press.png',
    productName: 'زيوت وعطور ملكية',
    gridSize: { width: 2, height: 2 },
    buyPriceGold: 600,
    buyPricePi: 0.5,
    requiredLevel: 5,
    xpReward: 100,
    rarity: 'rare',
    description: 'تعصر بذور الكتان والسمسم وزهور اللوتس لإنتاج زيوت نادرة ومطلوبة في القوافل.'
  } as GameAsset & { description?: string },

  pharaoh_bakery: {
    id: 'pharaoh_bakery',
    name: 'مخبز الشمس الملكي',
    category: 'building' as AssetCategory,
    image: '/buildings/pharaoh_bakery.png',
    productName: 'مخبوزات وأطعمة طاقة',
    gridSize: { width: 2, height: 3 },
    buyPriceGold: 1200,
    buyPricePi: 1.0,
    requiredLevel: 7,
    xpReward: 200,
    rarity: 'epic',
    description: 'يصنع خبز الشمس الملكي والأطعمة الفاخرة التي تعيد شحن طاقة المملكة ⚡ وتُباع بأسعار باهظة.'
  } as GameAsset & { description?: string },

  royal_alchemist: {
    id: 'royal_alchemist',
    name: 'معمل الخيميائي الأسطوري',
    category: 'building' as AssetCategory,
    image: '/buildings/alchemist.png',
    productName: 'أختام وقطع أسطورية',
    gridSize: { width: 3, height: 3 },
    buyPriceGold: 3000,
    buyPricePi: 3.5,
    requiredLevel: 10,
    xpReward: 500,
    rarity: 'legendary',
    isNftEligible: true,
    nftMintPricePi: 2.0,
    description: 'المكان الوحيد القادر على دمج العناصر النادرة لإنتاج تحف فرعونية أسطورية جاهزة للصك كـ NFTs.'
  } as GameAsset & { description?: string }
};

// ============================================================================
// 2. وصفات التصنيع والإنتاج (Production Recipes)
// تربط المدخلات (المحاصيل الأساسية) بالمخرجات (السلع المتطورة) مع تحديد الندرة والمكافآت
// ============================================================================

export const PRODUCTION_RECIPES: ProductionRecipe[] = [
  // --- وصفات طاحونة الوادي (royal_mill) ---
  {
    id: 'recipe_flour',
    buildingId: 'royal_mill',
    outputName: 'دقيق قمح ذهبي',
    outputImage: '/products/flour.png',
    inputs: [
      { assetId: 'seed_wheat', quantity: 3 } // يتطلب 3 سنابل قمح
    ],
    outputGoldValue: 45,
    craftTimeSec: 30,
    xpGranted: 15,
    requiredLevel: 3,
    outputRarity: 'common'
  },
  {
    id: 'recipe_barley_malt',
    buildingId: 'royal_mill',
    outputName: 'شعير مطحون فاخر',
    outputImage: '/products/barley_malt.png',
    inputs: [
      { assetId: 'seed_barley', quantity: 2 }
    ],
    outputGoldValue: 55,
    craftTimeSec: 45,
    xpGranted: 20,
    requiredLevel: 4,
    outputRarity: 'common'
  },

  // --- وصفات معصرة الزيوت (sacred_oil_press) ---
  {
    id: 'recipe_flax_oil',
    buildingId: 'sacred_oil_press',
    outputName: 'زيت الكتان المعالج',
    outputImage: '/products/flax_oil.png',
    inputs: [
      { assetId: 'seed_flax', quantity: 3 }
    ],
    outputGoldValue: 120,
    outputPiValue: 0.05,
    craftTimeSec: 90,
    xpGranted: 40,
    requiredLevel: 5,
    outputRarity: 'rare'
  },
  {
    id: 'recipe_sacred_oil',
    buildingId: 'sacred_oil_press',
    outputName: 'زيت اللوتس المقدس',
    outputImage: '/products/sacred_oil.png',
    inputs: [
      { assetId: 'seed_sesame', quantity: 2 },
      { assetId: 'seed_flax', quantity: 2 }
    ],
    outputGoldValue: 250,
    outputPiValue: 0.15,
    craftTimeSec: 180,
    xpGranted: 80,
    requiredLevel: 6,
    outputRarity: 'rare'
  },

  // --- وصفات مخبز الشمس (pharaoh_bakery) ---
  {
    id: 'recipe_sun_bread',
    buildingId: 'pharaoh_bakery',
    outputName: 'خبز الشمس الفرعوني',
    outputImage: '/products/sun_bread.png',
    inputs: [
      { assetId: 'recipe_flour', quantity: 2 }, // يستهلك الدقيق المصنع سابقاً
      { assetId: 'fig_tree', quantity: 2 }      // مع ثمار التين
    ],
    outputGoldValue: 350,
    outputPiValue: 0.25,
    craftTimeSec: 300,
    xpGranted: 150,
    requiredLevel: 7,
    outputRarity: 'epic'
  },
  {
    id: 'recipe_royal_feast',
    buildingId: 'pharaoh_bakery',
    outputName: 'وليمة الملك المكونة من التمور',
    outputImage: '/products/royal_feast.png',
    inputs: [
      { assetId: 'recipe_barley_malt', quantity: 2 },
      { assetId: 'palm_tree', quantity: 4 }, // يستهلك البلح والتمور
      { assetId: 'pomegranate_tree', quantity: 2 }
    ],
    outputGoldValue: 600,
    outputPiValue: 0.5,
    craftTimeSec: 450,
    xpGranted: 250,
    requiredLevel: 8,
    outputRarity: 'epic'
  },

  // --- وصفات معمل الخيميائي الأسطورية (royal_alchemist) - مؤهلة للـ NFT ---
  {
    id: 'recipe_golden_ankh',
    buildingId: 'royal_alchemist',
    outputName: 'مفتاح الحياة (أنخ) الذهب الخالص',
    outputImage: '/products/golden_ankh.png',
    inputs: [
      { assetId: 'recipe_sacred_oil', quantity: 3 },
      { assetId: 'seed_lotus', quantity: 2 },
      { assetId: 'recipe_sun_bread', quantity: 1 }
    ],
    outputGoldValue: 2500,
    outputPiValue: 2.5,
    craftTimeSec: 900, // 15 دقيقة صهر وتصنيع
    xpGranted: 1000,
    requiredLevel: 10,
    outputRarity: 'legendary'
  },
  {
    id: 'recipe_bastet_statue',
    buildingId: 'royal_alchemist',
    outputName: 'تمثال القط باستيت الملكي',
    outputImage: '/products/bastet_statue.png',
    inputs: [
      { assetId: 'recipe_sacred_oil', quantity: 5 },
      { assetId: 'seed_lotus', quantity: 3 },
      { assetId: 'recipe_royal_feast', quantity: 2 }
    ],
    outputGoldValue: 5000,
    outputPiValue: 5.0,
    craftTimeSec: 1800, // 30 دقيقة
    xpGranted: 2500,
    requiredLevel: 12,
    outputRarity: 'legendary'
  }
];

// ============================================================================
// 3. دوال مساعدة (Helper Functions)
// لتسهيل جلب الوصفات والمباني في مكونات واجهة المستخدم (UI Components) لاحقاً
// ============================================================================

/**
 * جلب جميع الوصفات المتاحة لمبنى معين
 */
export function getRecipesForBuilding(buildingId: string): ProductionRecipe[] {
  return PRODUCTION_RECIPES.filter((recipe) => recipe.buildingId === buildingId);
}

/**
 * جلب وصفة معينة بواسطة المعرّف (ID)
 */
export function getRecipeById(recipeId: string): ProductionRecipe | undefined {
  return PRODUCTION_RECIPES.find((recipe) => recipe.id === recipeId);
}

/**
 * جلب كافة مباني التصنيع مدمجة في مصفوفة واحدة لتسهيل عرضها في المتجر
 */
export function getAllCraftingBuildings(): GameAsset[] {
  return Object.values(CRAFTING_BUILDINGS);
}