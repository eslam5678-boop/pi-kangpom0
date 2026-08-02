import React from 'react';
import { PlacedItem } from '@/lib/types';

interface Props {
  selectedItem: PlacedItem | null;
  onRelocate: () => void;
  onRefund: () => void;
  onClose: () => void;
}

export const ItemActionBanner: React.FC<Props> = ({
  selectedItem,
  onRelocate,
  onRefund,
  onClose,
}) => {
  if (!selectedItem) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-amber-950/90 border-2 border-amber-500 rounded-full px-6 py-3 shadow-2xl flex items-center gap-6 text-white dir-rtl">
      <div className="flex items-center gap-2 font-bold text-amber-300">
        <span>⚡ التحكم في ( {selectedItem.name} ):</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onRelocate}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-full font-bold transition flex items-center gap-1.5 shadow"
        >
          <span>🚜 نقل المكان</span>
        </button>

        <button
          onClick={onRefund}
          className="bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 rounded-full font-bold transition flex items-center gap-1.5 shadow"
        >
          <span>🗑️ إزالة واسترداد ( {selectedItem.refundGold} ذهب )</span>
        </button>
      </div>

      <button
        onClick={onClose}
        className="bg-gray-800 hover:bg-gray-700 text-gray-300 w-8 h-8 rounded-full font-bold flex items-center justify-center ml-2"
      >
        ✕
      </button>
    </div>
  );
};