"use client";

import React, { useState } from "react";
import { payWithPi, getPiUid } from "@/lib/pi-direct-payment";

export interface LandTier {
  id: string;
  name: string;
  category: "بلدي مجاني" | "عزبة المزارع" | "المزرعة البشواتية" | "المحمية الملكية";
  pricePerWeek: number; // بعملة Pi
  isRented: boolean;
  expiresAt?: number; // Timestamp
}

export default function LandRentalSystem() {
  const [lands, setLands] = useState<LandTier[]>([
    { id: "land-1", name: "الحيز البلدي الأساسي", category: "بلدي مجاني", pricePerWeek: 0, isRented: true },
    { id: "land-2", name: "عزبة المزارع الشمالية", category: "عزبة المزارع", pricePerWeek: 5, isRented: false },
    { id: "land-3", name: "أراضي البشوات الخصبة", category: "المزرعة البشواتية", pricePerWeek: 15, isRented: false },
    { id: "land-4", name: "المحمية الملكية المقدسة", category: "المحمية الملكية", pricePerWeek: 50, isRented: false },
  ]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRentLand = async (id: string, price: number) => {
    if (price === 0) {
      setLands((prev) =>
        prev.map((land) =>
          land.id === id
            ? { ...land, isRented: true, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 }
            : land
        )
      );
      return;
    }

    setBusy(id);
    setError(null);
    try {
      // فتح محفظة Pi عبر Pi.createPayment (المدفوعات الحقيقية عبر /api/auth/pi)
      const land = lands.find((l) => l.id === id);
      const uid = await getPiUid();
      await payWithPi({
        amount: price,
        memo: `استئجار أرض - ${land?.name || id}`,
        metadata: { landId: id, action: "land_lease" },
        uid,
      });

      // لا يتم تفعيل العقد إلا بعد نجاح الدفع فعلياً
      setLands((prev) =>
        prev.map((land) =>
          land.id === id
            ? { ...land, isRented: true, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 }
            : land
        )
      );
    } catch (e) {
      console.error("[LandRental] payment failed:", e);
      setError(`تعذّر إتمام الدفع عبر محفظة باي. حاول مجدداً.`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="bg-slate-900/90 border-2 border-amber-600/60 rounded-2xl p-5 text-white max-w-4xl mx-auto my-6 shadow-2xl">
      <h2 className="text-2xl font-extrabold text-amber-400 mb-4 text-center border-b border-amber-500/30 pb-3">
        📜 ديوان الأراضي وعقود الإيجار الملكية
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {lands.map((land) => (
          <div
            key={land.id}
            className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
              land.isRented
                ? "bg-purple-950/30 border-green-500/50"
                : "bg-slate-800/60 border-slate-700 hover:border-amber-500/50"
            }`}
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-lg text-yellow-300">{land.name}</h4>
                <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-300 rounded-md font-semibold">
                  {land.category}
                </span>
              </div>
              <p className="text-sm text-gray-300">
                {land.pricePerWeek === 0 ? "أرض مجانية دائمة للاعبين" : `الإيجار الأسبوعي: ${land.pricePerWeek} Pi 𝝿`}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
{land.isRented ? (
                <span className="text-green-400 text-sm font-bold flex items-center gap-1">
                  ✓ خاضعة لحيازتك (عقد فعال)
                </span>
              ) : (
                <button
                  onClick={() => handleRentLand(land.id, land.pricePerWeek)}
                  disabled={busy === land.id}
                  className="w-full py-2 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-extrabold text-sm rounded-lg shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {busy === land.id
                    ? "جارٍ فتح محفظة باي..."
                    : `توقيع عقد الإيجار (${land.pricePerWeek} Pi)`}
                </button>
              )}
            </div>
</div>
        ))}
      </div>

      {error && (
        <div className="mt-4 bg-red-950/50 border border-red-500/50 rounded-xl p-3 text-red-300 text-sm font-bold text-center">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
