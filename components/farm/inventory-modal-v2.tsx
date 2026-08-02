'use client';

import React, { useState } from 'react';

// تعريف بيانات المنتجات لتزيين الحقيبة (أيقونات، أسعار، تصنيفات)
const ITEM_METADATA: Record<string, { icon: string; category: string; price: number; desc: string; isRare?: boolean }> = {
  'حبوب القمح': { icon: '🌾', category: 'crops', price: 10, desc: 'محصول أساسي لصناعة الخبز والأعلاف' },
  'تمور فاخرة': { icon: '🌴', category: 'crops', price: 25, desc: 'تمور ملكية عالية الطاقة من واحة سيوة' },
  'خيوط الكتان': { icon: '🧵', category: 'materials', price: 40, desc: 'تستخدم في نسج الملابس الفاخرة والأشرعة' },
  'بيض': { icon: '🥚', category: 'animals', price: 15, desc: 'إنتاج طازج يومي من المزارع الملكية' },
  'حليب': { icon: '🥛', category: 'animals', price: 30, desc: 'حليب غني يستخدم في معمل الألبان والجبن' },
  'لؤلؤ طبيعي': { icon: '🦪', category: 'rare', price: 150, desc: 'جوهرة نادرة تستخرج من أعماق النيل', isRare: true },
  'سبائك ذهب': { icon: '🪙', category: 'rare', price: 300, desc: 'ذهب مصهور جاهز لصناعة الحلي الملكية', isRare: true },
};

interface InventoryModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  inventory: Record<string, number>;
  onSellItem: (itemName: string, quantity: number, totalGold: number) => void;
  playSound?: (type: 'click' | 'coin' | 'error') => void;
}

export default function InventoryModalV2({
  isOpen,
  onClose,
  inventory,
  onSellItem,
  playSound
}: InventoryModalV2Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [sellQuantities, setSellQuantities] = useState<Record<string, number>>({});

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: '📦 الكل' },
    { id: 'crops', label: '🌾 محاصيل' },
    { id: 'animals', label: '🐎 منتجات حيوانية' },
    { id: 'materials', label: '🪵 مواد خام' },
    { id: 'rare', label: '💎 نوادر ملكية' },
  ];

  const handleQuantityChange = (itemName: string, maxQty: number, delta: number) => {
    if (playSound) playSound('click');
    const current = sellQuantities[itemName] || 1;
    const next = Math.max(1, Math.min(maxQty, current + delta));
    setSellQuantities((prev) => ({ ...prev, [itemName]: next }));
  };

  const handleSell = (itemName: string, maxQty: number) => {
    const qtyToSell = sellQuantities[itemName] || 1;
    if (qtyToSell > maxQty || qtyToSell <= 0) return;

    const meta = ITEM_METADATA[itemName] || { price: 15 };
    const totalGold = qtyToSell * meta.price;

    if (playSound) playSound('coin');
    onSellItem(itemName, qtyToSell, totalGold);

    // إعادة ضبط العداد بعد البيع
    setSellQuantities((prev) => ({ ...prev, [itemName]: 1 }));
  };

  // فلترة المنتجات حسب البحث والتصويب
  const filteredItems = Object.entries(inventory).filter(([name, qty]) => {
    if (qty <= 0) return false;
    const meta = ITEM_METADATA[name] || { category: 'crops' };
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || meta.category === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn select-none font-sans" dir="rtl">
      <div className="bg-gradient-to-b from-[#3a1d0d] via-[#261308] to-[#120a04] border-4 border-[#d4af37] rounded-3xl w-full max-w-2xl shadow-[0_0_50px_rgba(212,175,55,0.2)] flex flex-col max-h-[85vh] overflow-hidden relative">
        
        {/* الهيدر الملكي */}
        <div className="bg-gradient-to-r from-black/80 via-[#3a1d0d] to-black/80 p-4 border-b-2 border-[#d4af37]/60 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-3xl animate-bounce">🎒</span>
            <div>
              <h2 className="text-xl font-black text-[#d4af37] tracking-wider">المخزن الملكي المطور</h2>
              <p className="text-[11px] text-amber-200/70">إدارة الموارد، التصنيف، والبيع المباشر للسوق</p>
            </div>
          </div>
          <button
            onClick={() => { if (playSound) playSound('click'); onClose(); }}
            className="bg-red-900/80 hover:bg-red-800 text-white font-black w-8 h-8 rounded-full border border-red-500 flex items-center justify-center transition shadow-lg active:scale-90"
          >
            ✕
          </button>
        </div>

        {/* شريط البحث والتصنيفات */}
        <div className="p-4 bg-black/40 border-b border-amber-900/40 flex flex-col gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 ابحث عن محصول، سبيكة، أو مورد..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/70 border-2 border-amber-700/60 focus:border-[#d4af37] rounded-xl px-4 py-2 text-sm text-amber-100 placeholder-gray-500 outline-none transition shadow-inner"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { if (playSound) playSound('click'); setActiveTab(tab.id); }}
                className={`px-3 py-1.5 rounded-xl font-extrabold text-xs whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-black font-black border border-white shadow-md scale-105'
                    : 'bg-black/50 text-amber-300/70 border border-amber-900/50 hover:bg-black/80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* قائمة المنتجات */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-[#d4af37] scrollbar-track-black/40">
          {filteredItems.length > 0 ? (
            filteredItems.map(([itemName, quantity]) => {
              const meta = ITEM_METADATA[itemName] || {
                icon: '📦',
                category: 'crops',
                price: 15,
                desc: 'مورد ملكي قيم مستخرج من أراضي الإمبراطورية',
                isRare: false
              };
              const currentSellQty = sellQuantities[itemName] || 1;
              const expectedGold = currentSellQty * meta.price;

              return (
                <div
                  key={itemName}
                  className={`bg-gradient-to-r from-black/80 via-amber-950/40 to-black/80 border-2 rounded-2xl p-3 flex flex-col sm:flex-row justify-between items-center gap-3 transition-all hover:border-amber-500 ${
                    meta.isRare ? 'border-purple-500/80 shadow-[0_0_15px_rgba(168,85,247,0.15)]' : 'border-amber-900/60'
                  }`}
                >
                  {/* معلومات المنتج */}
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="w-12 h-12 rounded-xl bg-black/80 border border-amber-600/50 flex items-center justify-center text-2xl shadow-inner shrink-0">
                      {meta.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-white">{itemName}</h4>
                        {meta.isRare && (
                          <span className="bg-purple-900/80 text-purple-300 border border-purple-500 text-[9px] px-2 py-0.5 rounded-full font-black">
                            ✨ نادر
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 max-w-xs line-clamp-1 mt-0.5">{meta.desc}</p>
                      <div className="text-[11px] font-bold text-amber-400 mt-1 flex items-center gap-1">
                        <span>سعر الوحدة:</span>
                        <span className="text-yellow-400 font-black">{meta.price} 💰</span>
                      </div>
                    </div>
                  </div>

                  {/* وحدة التفاعل والبيع */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto bg-black/60 p-2 rounded-xl border border-amber-900/40">
                    <div className="text-center px-2 border-l border-amber-900/50">
                      <span className="text-[9px] text-gray-400 block">المتاح</span>
                      <span className="font-black text-sm text-amber-300">{quantity}</span>
                    </div>

                    {/* عداد تحديد الكمية */}
                    <div className="flex items-center gap-1 bg-black rounded-lg p-1 border border-amber-800">
                      <button
                        onClick={() => handleQuantityChange(itemName, quantity, -1)}
                        className="w-6 h-6 bg-amber-900/80 hover:bg-amber-800 text-white font-black rounded flex items-center justify-center text-xs active:scale-90 transition"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-black text-xs text-yellow-400">{currentSellQty}</span>
                      <button
                        onClick={() => handleQuantityChange(itemName, quantity, 1)}
                        className="w-6 h-6 bg-amber-900/80 hover:bg-amber-800 text-white font-black rounded flex items-center justify-center text-xs active:scale-90 transition"
                      >
                        +
                      </button>
                    </div>

                    {/* زر البيع */}
                    <button
                      onClick={() => handleSell(itemName, quantity)}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-black px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-lg active:scale-95 transition border border-green-400/50 shrink-0"
                    >
                      <span>بيع</span>
                      <span className="bg-black/40 px-1.5 py-0.5 rounded text-yellow-300 font-extrabold text-[10px]">
                        +{expectedGold} 💰
                      </span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 flex flex-col items-center justify-center">
              <span className="text-5xl mb-2 opacity-40">🕸️</span>
              <p className="text-amber-200/60 font-bold text-sm">لا توجد عناصر مطابقة في المخزن الملكي دلوقتي!</p>
              <p className="text-gray-500 text-xs mt-1">قم بحصاد المحاصيل أو تغيير تصنيف البحث.</p>
            </div>
          )}
        </div>

        {/* الفوتر */}
        <div className="bg-gradient-to-t from-black via-black/90 to-transparent p-4 border-t border-amber-900/60 flex justify-between items-center text-xs">
          <span className="text-amber-400/80 font-bold">💡 تلميح: يمكنك بيع الموارد الفائضة لتوفير السيولة لتطوير الأراضي.</span>
          <button
            onClick={() => { if (playSound) playSound('click'); onClose(); }}
            className="bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold px-6 py-2 rounded-xl border border-[#d4af37] shadow-lg transition active:scale-95"
          >
            إغلاق المخزن
          </button>
        </div>

      </div>
    </div>
  );
}