import { useState, useEffect, useCallback } from 'react';
import { PlacedItem, FarmState } from '@/lib/types';
import { LAND_CONTRACTS } from '../lib/gameData';

export function useFarmEngine(initialGold: number = 2570, initialPi: number = 0.15) {
  const [gold, setGold] = useState<number>(initialGold);
  const [pi, setPi] = useState<number>(initialPi);
  
  const [farmState, setFarmState] = useState<FarmState>({
    gridColumns: 8,
    gridRows: 8,
    placedItems: [],
    selectedItemForAction: null,
    isRelocating: false,
    isDiwanModalOpen: false,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setFarmState((prev) => ({
        ...prev,
        placedItems: (prev.placedItems ?? []).map((item) => {
          if (item.type === 'decoration' || item.assetId === 'diwan') return item;
          
          // تأمين القيم لتفادي خطأ Object is possibly 'undefined'
          const lastHarvest = item.lastHarvestTime ?? now;
          const duration = item.productionDuration ?? Infinity;
          
          const elapsedSeconds = (now - lastHarvest) / 1000;
          if (elapsedSeconds >= duration && !item.isReadyToHarvest) {
            return { ...item, isReadyToHarvest: true };
          }
          return item;
        }),
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleItemClick = useCallback((item: PlacedItem) => {
    if (item.assetId === 'diwan') {
      setFarmState((prev) => ({ ...prev, isDiwanModalOpen: true }));
      return;
    }
    if (item.isReadyToHarvest) {
      harvestItem(item);
      return;
    }
    setFarmState((prev) => ({
      ...prev,
      selectedItemForAction: item,
      isRelocating: false,
    }));
  }, []);

  const harvestItem = (item: PlacedItem) => {
    // استخدام ?? 0 لضمان وجود قيمة رقمية دائمًا
    if (item.yieldType === 'gold') setGold((g) => g + (item.yieldAmount ?? 0));
    if (item.yieldType === 'pi') setPi((p) => Number((p + (item.yieldAmount ?? 0)).toFixed(2)));
    
    setFarmState((prev) => ({
      ...prev,
      placedItems: (prev.placedItems ?? []).map((el) =>
        el.instanceId === item.instanceId
          ? { ...el, lastHarvestTime: Date.now(), isReadyToHarvest: false }
          : el
      ),
    }));
  };

  const startRelocating = () => {
    setFarmState((prev) => ({ ...prev, isRelocating: true }));
  };

  const confirmRelocation = (newX: number, newY: number) => {
    setFarmState((prev) => {
      if (!prev.selectedItemForAction) return prev;
      return {
        ...prev,
        placedItems: (prev.placedItems ?? []).map((item) =>
          item.instanceId === prev.selectedItemForAction?.instanceId
            ? { ...item, gridX: newX, gridY: newY }
            : item
        ),
        selectedItemForAction: null,
        isRelocating: false,
      };
    });
  };

  const handleRemoveAndRefund = () => {
    setFarmState((prev) => {
      const target = prev.selectedItemForAction;
      if (!target) return prev;
      
      // حماية المتغيرات لضمان عدم جمع رقم مع undefined
      setGold((g) => g + (target.refundGold ?? 0));
      setPi((p) => Number((p + (target.refundPi ?? 0)).toFixed(2)));
      
      return {
        ...prev,
        placedItems: (prev.placedItems ?? []).filter((item) => item.instanceId !== target.instanceId),
        selectedItemForAction: null,
      };
    });
  };

  const buyLandExpansion = (contractId: string) => {
    const contract = LAND_CONTRACTS.find((c) => c.id === contractId);
    if (!contract) return;

    const priceGold = (contract as any).priceGold ?? (contract as any).price ?? (contract as any).costGold ?? (contract as any).cost ?? 0;
    const pricePi = (contract as any).pricePi ?? (contract as any).piPrice ?? (contract as any).costPi ?? (contract as any).costPi ?? 0;

    if (gold < priceGold || pi < pricePi) {
      alert('رصيدك لا يكفي لإتمام عقد التوسعة!');
      return;
    }

    setGold((g) => g - priceGold);
    setPi((p) => Number((p - pricePi).toFixed(2)));

    const newWidth = (contract as any).gridDimensions?.cols ?? (contract as any).size?.split('x')?.[0] ?? 8;
    const newHeight = (contract as any).gridDimensions?.rows ?? (contract as any).size?.split('x')?.[1] ?? 8;

    setFarmState((prev) => ({
      ...prev,
      gridColumns: Number(newWidth),
      gridRows: Number(newHeight),
      isDiwanModalOpen: false,
    }));
  };

  return {
    gold,
    pi,
    farmState,
    setFarmState,
    handleItemClick,
    startRelocating,
    confirmRelocation,
    handleRemoveAndRefund,
    buyLandExpansion,
  };
}
