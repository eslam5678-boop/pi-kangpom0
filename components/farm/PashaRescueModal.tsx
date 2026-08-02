"use client";

import React from "react";

// واجهة بيانات الكائن الحي المتوافقة مع هيكل المزرعة
export interface FarmAnimal {
  id: string;
  name: string;
  type: string;
  health: number; // 0 - 100
  hunger: number; // 0 - 100 (100 يعني شبعان، 0 يعني جائع جداً)
  lastFed: number; // Timestamp
}

interface BashaRescueModalProps {
  animal: FarmAnimal | null;
  onClose: () => void;
  onRescueWithPi: (animalId: string, cost: number) => void;
  onRescueWithAd: (animalId: string) => void;
  onCallVet: (animalId: string) => void;
}

export default function BashaRescueModal({
  animal,
  onClose,
  onRescueWithPi,
  onRescueWithAd,
  onCallVet,
}: BashaRescueModalProps) {
  if (!animal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-purple-950 to-slate-900 border-2 border-amber-500 rounded-2xl p-6 shadow-[0_0_35px_rgba(245,158,11,0.4)] text-white">
        {/* شريط العنوان */}
        <div className="flex items-center justify-between border-b border-amber-500/30 pb-3 mb-4">
          <h3 className="text-xl font-bold text-amber-400 flex items-center gap-2">
            <span>⚠️</span> نافذة الإنقاذ البشواتي الطارئ
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white font-bold text-lg"
          >
            ✕
          </button>
        </div>

        {/* حالة الحيوان */}
        <div className="bg-red-950/40 border border-red-500/50 rounded-xl p-4 mb-6 text-center">
          <p className="text-lg font-semibold text-red-300">
            الحيوان ({animal.name}) في حالة خطر شديد بسبب الإهمال!
          </p>
          <div className="flex justify-around mt-3 text-sm font-bold">
            <span className="text-red-400">الصحة: {animal.health}%</span>
            <span className="text-amber-400">التغذية: {animal.hunger}%</span>
          </div>
        </div>

        {/* خيارات الإنقاذ */}
        <div className="space-y-3">
          <button
            onClick={() => onRescueWithPi(animal.id, 0.5)}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-extrabold rounded-xl shadow-lg flex items-center justify-between transition-all"
          >
            <span>إنعاش فوري بالرصيد الملكي</span>
            <span className="bg-black/20 px-3 py-1 rounded-lg text-sm">0.5 Pi 𝝿</span>
          </button>

          <button
            onClick={() => onCallVet(animal.id)}
            className="w-full py-3 px-4 bg-purple-800/80 hover:bg-purple-700 text-white font-bold rounded-xl border border-purple-500 flex items-center justify-between transition-all"
          >
            <span>استدعاء الطبيب البيطري الفرعوني</span>
            <span className="text-xs text-amber-300">علاج كامل (فوري)</span>
          </button>

          <button
            onClick={() => onRescueWithAd(animal.id)}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-gray-200 font-medium rounded-xl border border-slate-600 flex items-center justify-center gap-2 text-sm transition-all"
          >
            <span>📺 مشاهدة إعلان مدعوم للإنقاذ المؤقت</span>
          </button>
        </div>
      </div>
    </div>
  );
}