import React from 'react';
import { ProductionRecipe, RarityTier } from '@/lib/types';
import { getRecipesForBuilding, CRAFTING_BUILDINGS } from '../../lib/craftingData';

// --- واجهة الخصائص المطلوبة لتشغيل النافذة بأمان من أي مكان في اللعبة ---
export interface CraftingModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildingId: string | null;
  playerLevel: number;
  playerInventory: Record<string, number>;
  onStartCraft: (recipeId: string, craftTimeSec: number) => void;
}

export const CraftingModal: React.FC<CraftingModalProps> = ({
  isOpen,
  onClose,
  buildingId,
  playerLevel,
  playerInventory,
  onStartCraft,
}) => {
  // إذا كانت النافذة مغلقة أو لم يتم تحديد مبنى، لا نقوم بعرض أي شيء
  if (!isOpen || !buildingId) return null;

  // جلب بيانات المبنى والوصفات الخاصة به مع توضيح الخاصية الاختيارية description لـ TypeScript
  const buildingData = CRAFTING_BUILDINGS[buildingId] as { name?: string; description?: string } | undefined;
  const recipes = getRecipesForBuilding(buildingId);

  // دالة مساعدة لتنسيق وتلوين شارة الندرة (Rarity Badge)
  const getRarityBadge = (rarity?: RarityTier) => {
    switch (rarity) {
      case 'legendary':
        return <span className="bg-amber-500 text-black font-bold px-2 py-0.5 rounded text-xs animate-pulse">🟡 أسطوري (NFT)</span>;
      case 'epic':
        return <span className="bg-purple-600 text-white font-semibold px-2 py-0.5 rounded text-xs">🟣 ملحمي</span>;
      case 'rare':
        return <span className="bg-blue-600 text-white font-semibold px-2 py-0.5 rounded text-xs">🔵 نادر</span>;
      case 'common':
      default:
        return <span className="bg-slate-600 text-slate-200 px-2 py-0.5 rounded text-xs">⚪ عادي</span>;
    }
  };

  // دالة مساعدة لتحويل الثواني إلى صيغة وقت مقروءة (مثال: 3m 0s أو 45s)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}د ${secs}ث`;
    return `${secs} ثانية`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn" dir="rtl">
      {/* حاوية النافذة مع تصميم بطابع فرعوني ذهبي */}
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-amber-600/80 rounded-xl shadow-2xl overflow-hidden text-amber-50">
        
        {/* شريط العنوان الملكي */}
        <div className="bg-gradient-to-r from-amber-900 via-amber-700 to-amber-900 p-4 border-b border-amber-500 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-amber-200 flex items-center gap-2">
              <span>🏛️</span>
              <span>{buildingData ? buildingData.name : 'مبنى الإنتاج الملكي'}</span>
            </h2>
            {buildingData?.description && (
              <p className="text-xs text-amber-100/80 mt-1">{buildingData.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-amber-200 flex items-center justify-center transition border border-amber-500/50 font-bold"
            title="إغلاق"
          >
            ✕
          </button>
        </div>

        {/* قائمة الوصفات المتاحة */}
        <div className="p-4 max-h-[70vh] overflow-y-auto space-y-3 custom-scrollbar">
          {recipes.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              لا توجد وصفات تصنيع متاحة لهذا المبنى حالياً.
            </div>
          ) : (
            recipes.map((recipe) => {
              // التحقق من أن اللاعب وصل للمستوى المطلوب
              const isLevelUnlocked = playerLevel >= recipe.requiredLevel;

              // التحقق من توافر كافة المواد الخام المطلوبة في حقيبة اللاعب
              const hasAllIngredients = recipe.inputs.every((input) => {
                const currentAmount = playerInventory[input.assetId] || 0;
                return currentAmount >= input.quantity;
              });

              // إمكانية البدء في التصنيع تعتمد على المستوى وتوافر المواد
              const canCraft = isLevelUnlocked && hasAllIngredients;

              return (
                <div
                  key={recipe.id}
                  className={`flex flex-col md:flex-row items-center justify-between p-3 rounded-lg border transition ${
                    canCraft
                      ? 'bg-slate-800/80 border-amber-500/40 hover:border-amber-500'
                      : 'bg-slate-900/60 border-slate-700/50 opacity-75'
                  }`}
                >
                  {/* الجزء الأيمن: صورة واسم المنتج والندرة */}
                  <div className="flex items-center gap-3 w-full md:w-auto mb-3 md:mb-0">
                    <div className="w-14 h-14 rounded-lg bg-slate-950 border border-amber-600/50 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                      {/* عرض صورة افتراضية أو رمز معبر في حال عدم تحميل الصورة */}
                      <span role="img" aria-label={recipe.outputName}>📦</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-base text-amber-200">{recipe.outputName}</h3>
                        {getRarityBadge(recipe.outputRarity)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-300">
                        <span>⏱️ {formatTime(recipe.craftTimeSec)}</span>
                        <span>⭐ +{recipe.xpGranted} خبرة</span>
                        <span className="text-amber-400 font-semibold">💰 {recipe.outputGoldValue} ذهب</span>
                        {recipe.outputPiValue && (
                          <span className="text-purple-400 font-semibold">🟣 {recipe.outputPiValue} Pi</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* الجزء الأوسط: المكونات المطلوبة للتصنيع */}
                  <div className="flex items-center gap-2 w-full md:w-auto justify-end mb-3 md:mb-0 bg-slate-950/60 p-2 rounded border border-slate-800">
                    <span className="text-xs text-slate-400 ml-1">المطلوب:</span>
                    {recipe.inputs.map((input, index) => {
                      const currentAmount = playerInventory[input.assetId] || 0;
                      const hasEnough = currentAmount >= input.quantity;
                      
                      return (
                        <div
                          key={index}
                          className={`text-xs px-2 py-1 rounded flex items-center gap-1 font-mono font-bold ${
                            hasEnough
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50'
                              : 'bg-rose-950/80 text-rose-300 border border-rose-700/50'
                          }`}
                        >
                          <span>{input.assetId}</span>
                          <span>({currentAmount}/{input.quantity})</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* الجزء الأيسر: زر البدء أو رسالة القفل */}
                  <div className="w-full md:w-auto flex justify-end shrink-0">
                    {!isLevelUnlocked ? (
                      <span className="text-xs bg-slate-800 text-rose-400 px-3 py-2 rounded border border-rose-900/50 font-semibold w-full md:w-auto text-center">
                        🔒 يتطلب مستوى {recipe.requiredLevel}
                      </span>
                    ) : (
                      <button
                        disabled={!canCraft}
                        onClick={() => {
                          onStartCraft(recipe.id, recipe.craftTimeSec);
                          onClose();
                        }}
                        className={`w-full md:w-auto px-5 py-2 rounded font-bold text-sm transition shadow-lg flex items-center justify-center gap-1 ${
                          canCraft
                            ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 cursor-pointer transform active:scale-95 shadow-amber-900/20'
                            : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                        }`}
                      >
                        <span>⚙️</span>
                        <span>بدء التصنيع</span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* التذييل الملكي للنصائح */}
        <div className="bg-slate-950 p-3 border-t border-slate-800 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <span>💡 نصيحة فرعونية:</span>
          <span className="text-amber-300/80">المنتجات ذات الندرة (الأسطورية) فقط هي التي تؤهلك لصكها كـ NFTs حقيقية على شبكة Pi.</span>
        </div>

      </div>
    </div>
  );
};
