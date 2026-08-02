"use client";

import React, { useState } from "react";

interface P2PItem {
  id: string;
  seller: string;
  itemName: string;
  quantity: number;
  pricePi: number;
}

export default function MarketplaceArchitecture() {
  const [activeTab, setActiveTab] = useState<"system" | "p2p">("system");
  const [p2pListings, setP2pListings] = useState<P2PItem[]>([
    { id: "p1", seller: "Basha_Mina", itemName: "محصول قمح ملكي", quantity: 100, pricePi: 2.5 },
    { id: "p2", seller: "Pharaoh_99", itemName: "حزمة أعلاف فاخرة", quantity: 50, pricePi: 1.8 },
  ]);

  const handleBuyP2P = (item: P2PItem) => {
    const fee = (item.pricePi * 0.02).toFixed(3); // عمولة 2%
    const sellerNet = (item.pricePi * 0.98).toFixed(3);
    alert(`[نظام الضمان Escrow]: تم تجميد ${item.pricePi} Pi.\nسيتم تحويل ${sellerNet} Pi للبائع واقتطاع عمولة الخزينة (${fee} Pi) فور استلام العتاد.`);
    setP2pListings((prev) => prev.filter((i) => i.id !== item.id));
  };

  return (
    <div className="bg-slate-900/95 border-2 border-amber-500/50 rounded-2xl p-5 text-white max-w-4xl mx-auto my-6 shadow-2xl">
      {/* أزرار التبديل بين السوقين */}
      <div className="flex border-b border-slate-700 mb-6">
        <button
          onClick={() => setActiveTab("system")}
          className={`flex-1 py-3 text-center font-bold text-lg transition-all ${
            activeTab === "system"
              ? "text-amber-400 border-b-2 border-amber-400 bg-amber-500/10"
              : "text-gray-400 hover:text-white"
          }`}
        >
          🏛️ البورصة الرسمية (بيع فوري للملكية)
        </button>
        <button
          onClick={() => setActiveTab("p2p")}
          className={`flex-1 py-3 text-center font-bold text-lg transition-all ${
            activeTab === "p2p"
              ? "text-amber-400 border-b-2 border-amber-400 bg-amber-500/10"
              : "text-gray-400 hover:text-white"
          }`}
        >
          🤝 سوق P2P المفتوح (تداول بـ Pi)
        </button>
      </div>

      {activeTab === "system" ? (
        <div className="text-center py-8 bg-slate-800/40 rounded-xl border border-slate-700/50">
          <h3 className="text-xl font-bold text-yellow-300 mb-2">نافذة السيولة السريعة</h3>
          <p className="text-gray-300 text-sm mb-6">
            بيع منتجات مزرعتك الخام فوراً للخزينة الملكية بأسعار ثابتة ومضمونة.
          </p>
          <button
            onClick={() => alert("تم بيع المحصول الزائد بنجاح في البورصة!")}
            className="px-6 py-3 bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-extrabold rounded-xl shadow hover:brightness-110"
          >
            بيع كل المحاصيل المتاحة الآن
          </button>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4 text-xs text-amber-300/80 bg-purple-950/40 p-3 rounded-lg border border-purple-500/30">
            <span>🔒 كل الصفقات محمية بنظام العقود الذكية (Escrow)</span>
            <span>⚡ عمولة الخزينة الملكية: 2% فقط</span>
          </div>

          <div className="space-y-3">
            {p2pListings.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-slate-800/80 border border-slate-700 rounded-xl hover:border-amber-500/50 transition-all"
              >
                <div>
                  <h4 className="font-bold text-amber-300">{item.itemName}</h4>
                  <p className="text-xs text-gray-400">
                    البائع: {item.seller} | الكمية: {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-extrabold text-yellow-400">
                    {item.pricePi} Pi 𝝿
                  </span>
                  <button
                    onClick={() => handleBuyP2P(item)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm rounded-lg shadow"
                  >
                    شراء آمن
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}