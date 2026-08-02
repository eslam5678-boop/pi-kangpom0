// src/components/farm/royal-market-modal.tsx
'use client';

import React, { useState } from 'react';
import { MARKET_ITEMS, MarketItem } from '../../lib/marketData';

interface RoyalMarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: Record<string, number>;
  onSellItem: (itemId: string, quantity: number, priceGold: number, xpReward: number) => void;
}

export default function RoyalMarketModal({
  isOpen,
  onClose,
  inventory,
  onSellItem,
}: RoyalMarketModalProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'crop' | 'tree' | 'processed' | 'factory' | 'equipment'>('all');
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});

  if (!isOpen) return null;

  const filteredItems = MARKET_ITEMS.filter(
    (item) => activeTab === 'all' || item.category === activeTab
  );

  const handleQtyChange = (itemId: string, qty: number, max: number) => {
    const validQty = Math.max(1, Math.min(qty, max));
    setSelectedQuantities((prev) => ({ ...prev, [itemId]: validQty }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn select-none">
      <div className="relative w-full max-w-2xl rounded-3xl border-4 border-[#d4af37] bg-gradient-to-b from-[#3a1d0d] via-[#1a0f07] to-[#120a04] p-6 text-white shadow-2xl">
        
        {/* رأس النافذة */}
        <div className="flex items-center justify-between border-b-2 border-amber-800/60 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚖️</span>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-[#d4af37]">السوق الملكي الكبير</h2>
              <p className="text-xs text-amber-200/70">بِع فائض محاصيلك ومنتجاتك لخزينة المملكة مقابل الذهب والخبرة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-red-800/80 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-red-700 transition"
          >
            ✕ إغلاق
          </button>
        </div>

        {/* التبويبات التصنيفة */}
        <div className="flex gap-2 my-4 border-b border-amber-900/40 pb-2 overflow-x-auto scrollbar-none">
          {[
            { id: 'all', label: '🌟 الكل' },
            { id: 'crop', label: '🌾 المحاصيل' },
            { id: 'tree', label: '🌴 الأشجار' },
            { id: 'processed', label: '🍞 المصنوعات' },
            { id: 'factory', label: '🏭 المصانع والإنتاج' },
            { id: 'equipment', label: '⚙️ المعدات والعلف' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#d4af37] text-black shadow-lg scale-105'
                  : 'bg-black/60 text-amber-200/70 hover:bg-black/80 border border-amber-800/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* قائمة المنتجات */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[45vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#d4af37]">
          {filteredItems.map((item) => {
            const ownedQty = inventory[item.id] || 0;
            const currentSellQty = selectedQuantities[item.id] || 1;
            const isOutOfStock = ownedQty <= 0;

            return (
              <div
                key={item.id}
                className={`flex flex-col justify-between rounded-2xl border p-3 transition-all ${
                  isOutOfStock
                    ? 'border-gray-800 bg-black/40 opacity-50'
                    : 'border-amber-700/50 bg-black/70 hover:border-[#d4af37]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-950/60 text-2xl border border-amber-600/30">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xs text-amber-300">{item.name}</h3>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-300 mt-0.5">
                        <span>السعر: <strong className="text-yellow-400">{item.priceGold} 💰</strong></span>
                        <span>•</span>
                        <span>خبرة: <strong className="text-blue-300">+{item.xpReward} ⭐</strong></span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-left bg-amber-950/40 px-2 py-1 rounded-lg border border-amber-800/30">
                    <span className="text-[9px] text-gray-400 block">المخزون</span>
                    <span className={`text-xs font-black ${ownedQty > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {ownedQty}
                    </span>
                  </div>
                </div>

                {/* أزرار تحديد الكمية والبيع */}
                <div className="mt-3 flex items-center justify-between border-t border-amber-900/40 pt-2 gap-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      disabled={isOutOfStock}
                      onClick={() => handleQtyChange(item.id, 1, ownedQty)}
                      className="rounded bg-gray-800 px-1.5 py-1 text-[10px] font-bold hover:bg-gray-700 disabled:opacity-30"
                    >
                      1x
                    </button>
                    <button
                      disabled={isOutOfStock || ownedQty < 5}
                      onClick={() => handleQtyChange(item.id, 5, ownedQty)}
                      className="rounded bg-gray-800 px-1.5 py-1 text-[10px] font-bold hover:bg-gray-700 disabled:opacity-30"
                    >
                      5x
                    </button>
                    <button
                      disabled={isOutOfStock}
                      onClick={() => handleQtyChange(item.id, ownedQty, ownedQty)}
                      className="rounded bg-amber-900/60 text-amber-300 border border-amber-600/40 px-1.5 py-1 text-[10px] font-black hover:bg-amber-800 disabled:opacity-30"
                    >
                      الكل
                    </button>
                  </div>

                  <button
                    disabled={isOutOfStock}
                    onClick={() => {
                      const qtyToSell = Math.min(currentSellQty, ownedQty);
                      onSellItem(item.id, qtyToSell, item.priceGold, item.xpReward);
                      setSelectedQuantities((prev) => ({ ...prev, [item.id]: 1 }));
                    }}
                    className="flex-1 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 py-1.5 px-2 text-xs font-black text-white shadow-md hover:from-amber-500 hover:to-yellow-500 active:scale-95 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed transition"
                  >
                    بيع ({Math.min(currentSellQty, ownedQty) * item.priceGold} 💰)
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 border-t border-amber-900/60 pt-3 text-center text-[11px] text-gray-400">
          💡 <span className="text-amber-300 font-bold">نصيحة ملكية:</span> تصنيع المواد الخام في المصانع يضاعف قيمتها في السوق الملكي!
        </div>

      </div>
    </div>
  );
}