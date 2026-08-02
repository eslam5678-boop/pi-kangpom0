import { useEffect } from 'react';

export interface Building {
  id: string;
  type: 'factory' | 'animal_pen';
  currentRecipeId: string | null;
  status: 'idle' | 'producing' | 'paused_missing_resources' | 'ready_to_harvest';
  progress: number; // نسبة الإنجاز من 0 إلى 100
  timeRemaining: number; // الوقت المتبقي بالثواني
  totalProductionTime: number; // الوقت الإجمالي للوصفة بالثواني
}

/**
 * خطاف مخصص لإدارة العدادات الزمنية وتقدم الإنتاج للمباني
 * @param buildings قائمة المباني الحالية
 * @param setBuildings دالة تحديث حالة المباني
 * @param onCompleteProduction دالة تُنفذ فور اكتمال الإنتاج لإضافة المنتجات للحقيبة
 */
export function useProductionTimer(
  buildings: Building[],
  setBuildings: React.Dispatch<React.SetStateAction<Building[]>>,
  onCompleteProduction: (buildingId: string, recipeId: string) => void
) {
  useEffect(() => {
    // تشغيل مؤقت يحدث كل ثانية واحدة
    const interval = setInterval(() => {
      setBuildings((prevBuildings) =>
        prevBuildings.map((building) => {
          // إذا لم يكن المبنى في حالة إنتاج أو انتهى وقته بالفعل، تجاوزه
          if (building.status !== 'producing' || building.timeRemaining <= 0) {
            return building;
          }

          const nextTimeRemaining = building.timeRemaining - 1;
          const totalTime = building.totalProductionTime > 0 ? building.totalProductionTime : 1;
          
          // حساب نسبة التقدم المئوية ديناميكياً
          const calculatedProgress = Math.min(
            100,
            ((totalTime - nextTimeRemaining) / totalTime) * 100
          );

          // التحقق مما إذا انتهى وقت الإنتاج
          if (nextTimeRemaining <= 0) {
            if (building.currentRecipeId) {
              onCompleteProduction(building.id, building.currentRecipeId);
            }
            return {
              ...building,
              status: 'ready_to_harvest',
              progress: 100,
              timeRemaining: 0,
            };
          }

          // تحديث الوقت المتبقي والتقدم بشكل سليم
          return {
            ...building,
            timeRemaining: nextTimeRemaining,
            progress: calculatedProgress,
          };
        })
      );
    }, 1000);

    // تنظيف المؤقت عند إلغاء تحميل المكون (Cleanup)
    return () => clearInterval(interval);
  }, [setBuildings, onCompleteProduction]);
}