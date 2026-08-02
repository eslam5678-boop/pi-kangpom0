// components/BashaRescueModal.tsx
'use client';

import React from 'react';
import { PlacedItem } from '@/lib/types'; // تم تصحيح مسار الاستيراد بناءً على هيكل المشروع

export interface FarmAnimal {
  id: string;
  name: string;
  type: string;
  health: number;
  hunger: number;
  lastFed: number;
}

interface PashaRescueModalProps {
  animal: FarmAnimal | null;
  onClose: () => void;
  onRescueWithPi: (id: string, cost: number) => void;
  onRescueWithAd: (id: string) => void;
  onCallVet: (id: string) => void;
}

export default function BashaRescueModal({ 
  animal, 
  onClose, 
  onRescueWithPi, 
  onRescueWithAd, 
  onCallVet 
}: PashaRescueModalProps) {
  if (!animal) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-gradient-to-b from-[#3d0e0e] via-[#2a0808] to-[#120202] border-4 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.6)] rounded-3xl p-6 max-w-md w-full text-center relative overflow-hidden">
        
        <div className="absolute -right-10 -top-10 text-9xl opacity-10 text-red-500 select-none">⚠️</div>

        <div className="w-20 h-20 bg-red-950/80 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-bounce">
          <span className="text-4xl">🚨</span>
        </div>

        <h3 className="text-xl md:text-2xl font-black text-red-400 drop-shadow">
          نافذة الإنقاذ البشواتي العاجل!
        </h3>
        <p className="text-xs md:text-sm text-gray-200 mt-2 leading-relaxed">
          الحيوان الملكي <span className="text-yellow-400 font-bold">({animal.name})</span> في حالة خطر شديد بسبب الإهمال والجوع! تدخل فوراً قبل أن تفقده للأبد!
        </p>

        <div className="bg-black/60 border border-red-800/60 rounded-2xl p-3 my-4 flex justify-around text-xs font-bold">
          <div>
            <span className="text-gray-400 block">نسبة الصحة:</span>
            <span className="text-red-400 font-black text-base">{animal.health}% ❤️</span>
          </div>
          <div>
            <span className="text-gray-400 block">حالة الجوع:</span>
            <span className="text-amber-400 font-black text-base">{animal.hunger}% 🍖</span>
          </div>
        </div>

        <div className="space-y-2.5">
          <button
            onClick={() => onRescueWithPi(animal.id, 0.1)}
            className="w-full bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 hover:from-purple-600 text-white font-black py-3 rounded-xl border border-purple-400 shadow-lg flex items-center justify-center gap-2 transition active:scale-95 text-xs md:text-sm"
          >
            <span>💜</span> إنعاش فوري بالعملة الرسمية (0.1 Pi)
          </button>

          <button
            onClick={() => onCallVet(animal.id)}
            className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-yellow-500 text-black font-black py-2.5 rounded-xl border border-yellow-300 shadow flex items-center justify-center gap-2 transition active:scale-95 text-xs md:text-sm"
          >
            <span>👨‍⚕️</span> استدعاء الطبيب البيطري الملكي (100 💰 ذهب)
          </button>

          <button
            onClick={() => onRescueWithAd(animal.id)}
            className="w-full bg-gradient-to-r from-blue-700 to-cyan-700 hover:from-blue-600 text-white font-bold py-2.5 rounded-xl border border-blue-400 shadow flex items-center justify-center gap-2 transition active:scale-95 text-xs"
          >
            <span>📺</span> مشاهدة إعلان مدعوم (إنقاذ مجاني)
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-4 text-[11px] text-gray-400 hover:text-white underline block mx-auto transition"
        >
          تجاهل المخاطرة وتحمل العواقب...
        </button>
      </div>
    </div>
  );
}