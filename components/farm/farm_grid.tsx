'use client';

import React, { useState, useEffect } from 'react';
import { PlacedItem, Worker, GrowthStage } from '@/lib/types';
import { GAME_ASSETS } from '../../lib/gameData';
import { ONBOARDING_STEPS, INITIAL_WORKERS } from './onboardingData';
import { plowSoil, waterSoil, plantSeed, harvestCrop, calculateGrowthStage } from '../../lib/farmingEngine';
import { useProductionTimer, Building } from '../../lib/useProductionTimer';

interface FarmGridProps {
  items?: PlacedItem[];
  inventory?: { [key: string]: number };
  piBalance?: number;
  playerEnergy?: number;
  onSelectItem: (item: PlacedItem) => void;
  onPlaceTileClick: (x: number, y: number) => void;
  onUpdateItem?: (updatedItem: PlacedItem) => void;
  onPiTransaction?: (amount: number, description: string) => void;
  onUpdateInventory?: (itemKey: string, delta: number) => void;
  onUpdateEnergy?: (delta: number) => void;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

// 🎵 محرك الأصوات المدمج باستخدام Web Audio API
const playSound = (type: 'harvest' | 'plant' | 'plow' | 'speedup' | 'harvestAll') => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const now = ctx.currentTime;
    if (type === 'harvest' || type === 'harvestAll') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      if (type === 'harvestAll') {
        osc.frequency.setValueAtTime(880, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
      }
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + (type === 'harvestAll' ? 0.35 : 0.2));
      osc.start(now);
      osc.stop(now + (type === 'harvestAll' ? 0.35 : 0.2));
    } else if (type === 'plant' || type === 'plow') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'speedup') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(783.99, now + 0.16);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (e) {
    // تجاهل خطأ سياق الصوت
  }
};

export default function FarmGrid({ 
  items = [], 
  inventory = {}, 
  piBalance = 100, 
  playerEnergy = 100,
  onSelectItem, 
  onPlaceTileClick, 
  onUpdateItem,
  onPiTransaction,
  onUpdateInventory,
  onUpdateEnergy
}: FarmGridProps) {
  const gridSize = 8; 
  const [onboardingStep, setOnboardingStep] = useState<number | null>(0);
  const [workers, setWorkers] = useState<Worker[]>(INITIAL_WORKERS);
  const [selectedSoil, setSelectedSoil] = useState<PlacedItem | null>(null);
  const [selectedAnimal, setSelectedAnimal] = useState<PlacedItem | null>(null);
  const [selectedFactory, setSelectedFactory] = useState<Building | null>(null);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [energy, setEnergy] = useState<number>(playerEnergy);
  const [isFactoriesOpen, setIsFactoriesOpen] = useState<boolean>(false); // حالة طي قائمة المصانع الجانبية

  useEffect(() => {
    setEnergy(playerEnergy);
  }, [playerEnergy]);

  const modifyEnergy = (amount: number): boolean => {
    if (energy + amount < 0) return false;
    setEnergy(prev => prev + amount);
    if (onUpdateEnergy) onUpdateEnergy(amount);
    return true;
  };

  const [productionBuildings, setProductionBuildings] = useState<Building[]>([]);

  useEffect(() => {
    if (items && items.length > 0) {
      const factoryItems = items.filter(i => i.type === 'factory' || GAME_ASSETS[i.assetId]?.category === 'building');
      setProductionBuildings(prev => {
        const updated = [...prev];
        factoryItems.forEach(fItem => {
          if (!updated.some(b => b.id === fItem.uid)) {
            updated.push({
              id: fItem.uid,
              type: 'factory',
              currentRecipeId: 'bread_recipe',
              status: 'producing',
              progress: 0,
              timeRemaining: 45,
              totalProductionTime: 45,
            });
          }
        });
        return updated;
      });
    }
  }, [items]);

  useProductionTimer(
    productionBuildings,
    setProductionBuildings,
    (buildingId, recipeId) => {
      triggerFloatingText(2, 2, '✨ اكتمل الإنتاج وتم إرسال المنتجات للحقيبة!', 'text-yellow-300');
      if (onUpdateInventory) onUpdateInventory('crop_flour', 1);
      if (onPiTransaction) onPiTransaction(1.0, 'مكافأة إتمام الإنتاج الصناعي');
    }
  );

  const triggerFloatingText = (x: number, y: number, text: string, color = 'text-yellow-400') => {
    const id = Date.now() + Math.random();
    setFloatingTexts(prev => [...prev, { id, x, y, text, color }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(item => item.id !== id));
    }, 1600);
  };

  useEffect(() => {
    if (selectedSoil && items) {
      const currentItem = items.find(i => i.uid === selectedSoil.uid);
      if (currentItem) setSelectedSoil(currentItem);
    }
    if (selectedAnimal && items) {
      const currentAnimal = items.find(i => i.uid === selectedAnimal.uid);
      if (currentAnimal) setSelectedAnimal(currentAnimal);
    }
    if (selectedFactory && productionBuildings) {
      const currentBuild = productionBuildings.find(b => b.id === selectedFactory.id);
      if (currentBuild) setSelectedFactory(currentBuild);
    }
  }, [items, productionBuildings]);

  // 🐾 مؤقت حركة الحيوية للحيوانات
  useEffect(() => {
    if (!items || !onUpdateItem) return;
    const animalTimer = setInterval(() => {
      items.forEach((item) => {
        if (item.type === 'animal') {
          const currentHealth = item.health !== undefined ? item.health : 100;
          if (currentHealth > 10) {
            const updated = { ...item, health: Math.max(0, currentHealth - 2) };
            onUpdateItem(updated);
            if (selectedAnimal?.uid === item.uid) setSelectedAnimal(updated);
          }
        }
      });
    }, 4000);
    return () => clearInterval(animalTimer);
  }, [items, onUpdateItem, selectedAnimal]);

  useEffect(() => {
    const interval = setInterval(() => {
      setWorkers((prevWorkers) =>
        prevWorkers.map((w) => {
          const dx = w.targetX - w.x;
          const dy = w.targetY - w.y;
          
          if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
            let nextX = Math.floor(Math.random() * (gridSize - 1));
            let nextY = Math.floor(Math.random() * (gridSize - 1));
            
            if (items && items.length > 0) {
              if (w.id === 'w2') {
                const randomItem = items[Math.floor(Math.random() * items.length)];
                nextX = randomItem.x;
                nextY = randomItem.y;
              } else if (w.id === 'w3') {
                const animalItems = items.filter(i => i.type === 'animal');
                if (animalItems.length > 0) {
                  const randomAnimal = animalItems[Math.floor(Math.random() * animalItems.length)];
                  nextX = randomAnimal.x;
                  nextY = randomAnimal.y;
                }
              }
            }
            return { ...w, targetX: nextX, targetY: nextY, status: 'walking' };
          }
          return { ...w, x: w.x + dx * 0.04, y: w.y + dy * 0.04 };
        })
      );
    }, 400);
    return () => clearInterval(interval);
  }, [items]);

  useEffect(() => {
    if (!items || !onUpdateItem) return;
    const growTimer = setInterval(() => {
      items.forEach((item) => {
        if (item.type === 'soil' && item.soilState === 'planted' && item.plantedAt) {
          const totalGrowTimeSec = 30; 
          const currentStage = calculateGrowthStage(item, totalGrowTimeSec);
          if (currentStage !== item.growthStage) {
            const updated = { ...item, growthStage: currentStage };
            onUpdateItem(updated);
            if (selectedSoil?.uid === item.uid) setSelectedSoil(updated);
          }
        }
      });
    }, 1000);
    return () => clearInterval(growTimer);
  }, [items, onUpdateItem, selectedSoil]);

  const handleSpeedUp = (type: 'soil' | 'factory') => {
    if (energy < 15) {
      triggerFloatingText(3, 3, '❌ طاقة غير كافية! تحتاج 15 طاقة للتسريع.', 'text-red-400');
      return;
    }

    if (type === 'soil' && selectedSoil && selectedSoil.plantedAt) {
      modifyEnergy(-15);
      playSound('speedup');
      const updatedItem = {
        ...selectedSoil,
        plantedAt: selectedSoil.plantedAt - 60000,
        growthStage: 3 as GrowthStage
      };
      if (onUpdateItem) onUpdateItem(updatedItem);
      setSelectedSoil(updatedItem);
      triggerFloatingText(updatedItem.x, updatedItem.y, '⚡ تم تسريع النمو (+60 ثانية)!', 'text-cyan-300');
    } else if (type === 'factory' && selectedFactory) {
      modifyEnergy(-15);
      playSound('speedup');
      setProductionBuildings(prev => prev.map(b => {
        if (b.id === selectedFactory.id) {
          return {
            ...b,
            progress: 100,
            timeRemaining: 0,
            status: 'ready_to_harvest'
          };
        }
        return b;
      }));
      triggerFloatingText(3, 3, '⚡ تم تسريع إنتاج المصنع بنجاح!', 'text-cyan-300');
    }
  };

  const handleHarvestAll = () => {
    const readyCrops = items.filter(i => i.type === 'soil' && i.soilState === 'planted' && i.growthStage === 3);
    if (readyCrops.length === 0) {
      triggerFloatingText(3, 3, '❌ لا توجد محاصيل جاهزة للحصاد حالياً!', 'text-amber-400');
      return;
    }

    playSound('harvestAll');
    let totalPi = 0;
    let totalCrops = 0;

    readyCrops.forEach(item => {
      const harvested = harvestCrop(item);
      if (onUpdateItem) onUpdateItem(harvested);
      totalPi += 2.0; 
      totalCrops += 1;
    });

    if (onPiTransaction) onPiTransaction(totalPi, `حصاد جماعي لـ ${totalCrops} محاصيل`);
    if (onUpdateInventory) onUpdateInventory('crop_wheat', totalCrops);

    triggerFloatingText(3, 3, `🌾 تم حصاد ${totalCrops} محاصيل | +${totalPi} Pi 🪙!`, 'text-green-400');
    setSelectedSoil(null);
  };

  const handleFarmingAction = (action: 'plow' | 'water' | 'plant' | 'harvest', seedKey?: string) => {
    if (!selectedSoil) return;
    let updatedItem = { ...selectedSoil };

    switch (action) {
      case 'plow':
        updatedItem = plowSoil(updatedItem);
        playSound('plow');
        triggerFloatingText(updatedItem.x, updatedItem.y, '🚜 حرث الأرض!', 'text-amber-400');
        break;
      case 'water':
        updatedItem = waterSoil(updatedItem);
        playSound('plow');
        triggerFloatingText(updatedItem.x, updatedItem.y, '💧 تم الري!', 'text-blue-400');
        break;
      case 'plant':
        if (seedKey) {
          const seedCount = inventory[seedKey] || 0;
          if (seedCount <= 0) {
            triggerFloatingText(updatedItem.x, updatedItem.y, '❌ لا توجد بذور كافية في الحقيبة!', 'text-red-400');
            return;
          }
          updatedItem = plantSeed(updatedItem, seedKey);
          if (onUpdateInventory) onUpdateInventory(seedKey, -1);
          playSound('plant');
          triggerFloatingText(updatedItem.x, updatedItem.y, '🌱 تم البذر!', 'text-green-400');
        }
        break;
      case 'harvest':
        if (onPiTransaction) onPiTransaction(2.0, 'حصاد محصول زراعي');
        if (onUpdateInventory) onUpdateInventory('crop_wheat', 1);
        updatedItem = harvestCrop(updatedItem);
        playSound('harvest');
        triggerFloatingText(updatedItem.x, updatedItem.y, '-0.5 🪙 Pi (رسوم) | +2.5 🪙 Pi | +1 محصول', 'text-yellow-300');
        break;
    }

    if (onUpdateItem) onUpdateItem(updatedItem);
    onSelectItem(updatedItem);
    setSelectedSoil(updatedItem.soilState === 'raw' ? null : updatedItem);
  };

  const handleAnimalAction = (action: 'feed' | 'collect') => {
    if (!selectedAnimal) return;
    let updatedAnimal = { ...selectedAnimal };

    if (action === 'feed') {
      const feedCount = inventory['feed'] || 0;
      if (feedCount <= 0) {
        triggerFloatingText(updatedAnimal.x, updatedAnimal.y, '❌ لا يوجد علف كافٍ في الحقيبة!', 'text-red-400');
        return;
      }
      if (onUpdateInventory) onUpdateInventory('feed', -1);
      updatedAnimal.health = Math.min(100, (updatedAnimal.health || 50) + 25);
      playSound('plant');
      triggerFloatingText(updatedAnimal.x, updatedAnimal.y, '🌾 تم الإطعام بنجاح!', 'text-green-400');
    } else if (action === 'collect') {
      if (onPiTransaction) onPiTransaction(1.5, 'بيع منتج حيواني');
      if (onUpdateInventory) onUpdateInventory('animal_produce', 1);
      updatedAnimal.health = Math.max(10, (updatedAnimal.health || 50) - 10);
      playSound('harvest');
      triggerFloatingText(updatedAnimal.x, updatedAnimal.y, '+1.5 🪙 Pi | +1 منتج طازج!', 'text-yellow-300');
    }

    if (onUpdateItem) onUpdateItem(updatedAnimal);
    onSelectItem(updatedAnimal);
  };

  const getIsometricStyle = (x: number, y: number, isAsset = false) => {
    const tileWidth = 110;
    const tileHeight = 55;
    const originX = 420;
    const originY = 140;

    const isoX = originX + (x - y) * (tileWidth / 2);
    const isoY = originY + (x + y) * (tileHeight / 2);
    const zIndex = Math.floor(x + y + (isAsset ? 15 : 0));

    return {
      left: `${isoX}px`,
      top: `${isoY}px`,
      zIndex: zIndex,
      transition: isAsset ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'left 0.4s linear, top 0.4s linear'
    };
  };

  const getTileImage = (x: number, y: number) => {
    const sum = x + y;
    if (sum % 3 === 0) return '/sand_tile_1.png';
    if (sum % 3 === 1) return '/sand_tile_2.png';
    return '/sand_tile.png';
  };

  const getCropStageIcon = (stage?: GrowthStage) => {
    switch (stage) {
      case 0: return '🌱'; 
      case 1: return '🌿'; 
      case 2: return '🌾'; 
      case 3: return '🌾✨'; 
      default: return '';
    }
  };

  const getGrowthProgress = (item: PlacedItem) => {
    if (!item.plantedAt) return { progress: 0, remaining: 30 };
    const elapsed = (Date.now() - item.plantedAt) / 1000;
    const total = 30; 
    const progress = Math.min(Math.floor((elapsed / total) * 100), 100);
    const remaining = Math.max(Math.ceil(total - elapsed), 0);
    return { progress, remaining };
  };

  return (
    <div className="relative w-full h-[720px] bg-[#1a0f07] overflow-hidden rounded-3xl border-4 border-[#d4af37] shadow-[0_0_30px_rgba(212,175,55,0.3)] p-4 select-none">
      
      {/* 1. الشريط العلوي الموحد (Cartouche الفرعوني) */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 bg-[#1e1108]/95 border-2 border-[#d4af37] px-6 py-2 rounded-2xl shadow-[0_0_20px_rgba(212,175,55,0.25)] flex items-center gap-5 text-xs font-bold text-[#f9e8a2] backdrop-blur-md">
        <span className="flex items-center gap-1.5">⚡ الطاقة: <strong className="text-cyan-400">{energy}</strong></span>
        <span className="text-amber-600">|</span>
        <span className="flex items-center gap-1.5">👷 العمال: <strong className="text-yellow-300">{workers.length}</strong></span>
        <span className="text-amber-600">|</span>
        <span className="flex items-center gap-1.5">🌾 المحاصيل: <strong className="text-emerald-400">{items.filter(i => i.soilState === 'planted').length}</strong></span>
        <span className="text-amber-600">|</span>
        <span className="flex items-center gap-1.5">🎒 القمح: <strong className="text-amber-300">{inventory['seed_wheat'] || 0}</strong></span>
        
        {items.some(i => i.soilState === 'planted' && i.growthStage === 3) && (
          <button
            onClick={handleHarvestAll}
            className="ml-2 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-extrabold px-3.5 py-1 rounded-xl shadow-md transition transform hover:scale-105 animate-pulse flex items-center gap-1 cursor-pointer border border-green-300"
          >
            <span>🌾✨</span> حصاد الكل
          </button>
        )}
      </div>

      {/* 4. قائمة المصانع الجانبية القابلة للطي (Collapsible Sidebar) */}
      <div className="absolute top-20 left-6 z-30">
        <button
          onClick={() => setIsFactoriesOpen(!isFactoriesOpen)}
          className="bg-[#2a1810]/95 border-2 border-[#d4af37] text-[#f9e8a2] px-3.5 py-2 rounded-xl shadow-[0_0_10px_rgba(212,175,55,0.2)] flex items-center gap-2 hover:bg-[#3a2216] transition text-xs font-bold cursor-pointer backdrop-blur-md"
        >
          <span>🏭 المصانع ({productionBuildings.length})</span>
          <span>{isFactoriesOpen ? '▲' : '▼'}</span>
        </button>

        {isFactoriesOpen && (
          <div className="mt-2 bg-[#2a1810]/95 border-2 border-[#d4af37]/80 p-3 rounded-2xl shadow-2xl flex flex-col gap-2 w-60 backdrop-blur-md text-xs text-[#f9e8a2] animate-fadeIn">
            <span className="font-extrabold text-[#d4af37] border-b border-amber-800/60 pb-1">حالة مباني الإنتاج:</span>
            {productionBuildings.length === 0 ? (
              <span className="text-amber-300/70 italic py-1">لا توجد مصانع مبنية</span>
            ) : (
              productionBuildings.map((b) => (
                <div key={b.id} className="flex flex-col gap-1 bg-black/40 p-2 rounded-xl border border-amber-900/30">
                  <div className="flex justify-between gap-2">
                    <span>🏭 مصنع 01</span>
                    <span className={b.status === 'ready_to_harvest' ? 'text-green-400 font-bold animate-pulse' : b.status === 'paused_missing_resources' ? 'text-red-400 font-bold' : 'text-yellow-400'}>
                      {b.status === 'producing' ? `${Math.round(b.progress)}%` : b.status === 'ready_to_harvest' ? '✨ جاهز!' : 'متوقف'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-amber-600/40">
                    <div className="h-full bg-gradient-to-r from-yellow-600 to-amber-400 transition-all duration-300" style={{ width: `${b.progress}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* لوحة الزراعة العائمة بتصميم معتم وزهري ملكي */}
      {selectedSoil && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md z-40 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#2a1810] border-4 border-[#d4af37] px-8 py-5 rounded-3xl shadow-[0_0_40px_rgba(212,175,55,0.4)] flex flex-col items-center gap-4 max-w-md w-full text-center relative">
            <span className="text-[#f9e8a2] font-black text-lg border-b border-amber-700/60 pb-2 w-full">
              إدارة القطعة الزراعية ({selectedSoil.x}, {selectedSoil.y})
            </span>

            {(!selectedSoil.soilState || selectedSoil.soilState === 'raw') && (
              <button
                onClick={() => handleFarmingAction('plow')}
                className="w-full bg-amber-700 hover:bg-amber-600 text-white font-extrabold py-3 rounded-2xl flex justify-center items-center gap-2 shadow cursor-pointer transition transform hover:scale-105 border border-amber-500"
              >
                <span>🚜</span> حرث الأرض
              </button>
            )}

            {selectedSoil.soilState === 'plowed' && (
              <button
                onClick={() => handleFarmingAction('water')}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-3 rounded-2xl flex justify-center items-center gap-2 shadow cursor-pointer transition transform hover:scale-105 border border-blue-400 animate-pulse"
              >
                <span>💧</span> رش المياه
              </button>
            )}

            {selectedSoil.soilState === 'watered' && (
              <div className="flex flex-col gap-2.5 w-full">
                <span className="text-xs text-amber-300 font-bold">اختر البذور المناسبة:</span>
                <button
                  onClick={() => handleFarmingAction('plant', 'seed_wheat')}
                  className="w-full bg-green-700 hover:bg-green-600 text-white font-extrabold py-2.5 rounded-xl flex justify-between px-6 items-center shadow cursor-pointer border border-green-500"
                >
                  <span>🌾 بذور القمح</span>
                  <span className="bg-black/30 px-2 py-0.5 rounded-lg text-xs">المتاح: {inventory['seed_wheat'] || 0}</span>
                </button>
                <button
                  onClick={() => handleFarmingAction('plant', 'seed_barley')}
                  className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold py-2.5 rounded-xl flex justify-between px-6 items-center shadow cursor-pointer border border-emerald-500"
                >
                  <span>🌿 بذور الشعير</span>
                  <span className="bg-black/30 px-2 py-0.5 rounded-lg text-xs">المتاح: {inventory['seed_barley'] || 0}</span>
                </button>
                <button
                  onClick={() => handleFarmingAction('plant', 'seed_lotus')}
                  className="w-full bg-teal-700 hover:bg-teal-600 text-white font-extrabold py-2.5 rounded-xl flex justify-between px-6 items-center shadow cursor-pointer border border-teal-500"
                >
                  <span>🌸 بذور اللوتس</span>
                  <span className="bg-black/30 px-2 py-0.5 rounded-lg text-xs">المتاح: {inventory['seed_lotus'] || 0}</span>
                </button>
              </div>
            )}

            {selectedSoil.soilState === 'planted' && (selectedSoil.growthStage ?? 0) < 3 && (
              <div className="flex flex-col gap-3 w-full bg-black/50 p-4 rounded-2xl border border-amber-600/40">
                <div className="flex justify-between text-xs font-bold text-amber-300">
                  <span>⏳ جاري النمو ({getGrowthProgress(selectedSoil).progress}%)</span>
                  <span>الوقت المتبقي: {getGrowthProgress(selectedSoil).remaining}ث</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-600">
                  <div className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all duration-500" style={{ width: `${getGrowthProgress(selectedSoil).progress}%` }} />
                </div>
                <button
                  onClick={() => handleSpeedUp('soil')}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold py-2 rounded-xl shadow flex justify-center items-center gap-2 transition transform hover:scale-105 cursor-pointer border border-cyan-300 mt-2"
                >
                  <span>⚡💧</span> تسريع النمو بـ 15 طاقة
                </button>
              </div>
            )}

            {selectedSoil.soilState === 'planted' && selectedSoil.growthStage === 3 && (
              <button
                onClick={() => handleFarmingAction('harvest')}
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-black py-3 rounded-2xl shadow-lg cursor-pointer transition transform hover:scale-105 animate-pulse border border-yellow-200"
              >
                🌾✨ حصاد المحصول الآن (+2.5 Pi)
              </button>
            )}

            <button
              onClick={() => setSelectedSoil(null)}
              className="absolute top-3 left-4 text-red-400 hover:text-red-300 font-black text-lg cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* لوحة تفاعل الحيوانات مع خلفية معتمة */}
      {selectedAnimal && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md z-40 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#2a1810] border-4 border-[#d4af37] px-8 py-6 rounded-3xl shadow-[0_0_40px_rgba(212,175,55,0.4)] flex flex-col items-center gap-4 max-w-md w-full text-center relative">
            <span className="text-[#f9e8a2] font-black text-lg border-b border-amber-700/60 pb-2 w-full">
              🐾 رعاية الحيوان
            </span>
            <button
              onClick={() => handleAnimalAction('feed')}
              className="w-full bg-green-700 hover:bg-green-600 text-white font-bold py-3 rounded-2xl flex justify-center items-center gap-2 shadow cursor-pointer border border-green-500"
            >
              <span>🌾</span> إطعام (العلف المتاح: {inventory['feed'] || 0})
            </button>
            <button
              onClick={() => handleAnimalAction('collect')}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-2xl flex justify-center items-center gap-2 shadow cursor-pointer border border-amber-400"
            >
              <span>🥛</span> جمع الإنتاج الحيواني
            </button>
            <button
              onClick={() => setSelectedAnimal(null)}
              className="absolute top-3 left-4 text-red-400 hover:text-red-300 font-black text-lg cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* لوحة المصنع المنبثقة مع خلفية معتمة */}
      {selectedFactory && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md z-40 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#2a1810] border-4 border-[#d4af37] px-8 py-6 rounded-3xl shadow-[0_0_40px_rgba(212,175,55,0.4)] flex flex-col items-center gap-4 max-w-md w-full text-center relative">
            <span className="text-[#f9e8a2] font-black text-lg border-b border-amber-700/60 pb-2 w-full">
              🏭 مصنع الإنتاج الفرعوني
            </span>
            <span className="text-yellow-400 text-sm font-bold">
              {selectedFactory.status === 'producing' ? `جاري التصنيع (${Math.round(selectedFactory.progress)}%)` : selectedFactory.status === 'ready_to_harvest' ? '✨ جاهز للحصاد!' : 'متوقف'}
            </span>
            
            {selectedFactory.status === 'producing' && (
              <button
                onClick={() => handleSpeedUp('factory')}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-extrabold py-3 rounded-2xl shadow flex justify-center items-center gap-2 cursor-pointer border border-cyan-300"
              >
                <span>⚡</span> تسريع التصنيع بـ 15 طاقة
              </button>
            )}

            {selectedFactory.status === 'ready_to_harvest' && (
              <button
                onClick={() => {
                  if (onUpdateInventory) onUpdateInventory('crop_flour', 1);
                  if (onPiTransaction) onPiTransaction(1.0, 'حصاد المصنع');
                  playSound('harvest');
                  triggerFloatingText(2, 2, '+1 منتج مصنع و Pi! 🍞', 'text-yellow-300');
                  setProductionBuildings(prev => prev.map(b => b.id === selectedFactory.id ? { ...b, status: 'producing', progress: 0, timeRemaining: b.totalProductionTime } : b));
                  setSelectedFactory(null);
                }}
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-black py-3 rounded-2xl shadow cursor-pointer animate-pulse border border-yellow-200"
              >
                📦 جمع المنتج النهائي
              </button>
            )}
            <button
              onClick={() => setSelectedFactory(null)}
              className="absolute top-3 left-4 text-red-400 hover:text-red-300 font-black text-lg cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* رسم الشبكة والأصول */}
      <div className="relative w-full h-full">
        {Array.from({ length: gridSize }).map((_, x) =>
          Array.from({ length: gridSize }).map((_, y) => {
            const style = getIsometricStyle(x, y);
            const tileImg = getTileImage(x, y);
            return (
              <div
                key={`tile-${x}-${y}`}
                onClick={() => {
                  setSelectedSoil(null);
                  setSelectedAnimal(null);
                  setSelectedFactory(null);
                  onPlaceTileClick(x, y);
                }}
                style={style}
                className="absolute w-[110px] h-[55px] cursor-pointer group hover:brightness-125 transition-all duration-150"
              >
                <img
                  src={tileImg}
                  alt="ground"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/sand_tile.png';
                  }}
                  className="w-full h-full object-cover block drop-shadow-sm pointer-events-none"
                />
                <div className="absolute inset-0 border-[0.5px] border-amber-900/30 group-hover:border-[#d4af37] transition-colors pointer-events-none" />
              </div>
            );
          })
        )}

        {items && items.map((item) => {
          const asset = GAME_ASSETS[item.assetId];
          if (!asset) return null;
          
          const isLargeBuilding = asset.gridSize && asset.gridSize.width >= 2;
          const style = getIsometricStyle(item.x, item.y, true);
          const isSoil = item.type === 'soil';
          const isAnimal = item.type === 'animal';
          const isFactory = item.type === 'factory' || asset.category === 'building' || item.assetId?.includes('factory');
          const growthInfo = isSoil && item.soilState === 'planted' ? getGrowthProgress(item) : null;
          const animalHealth = item.health !== undefined ? item.health : 100;

          return (
            <div
              key={item.uid}
              onClick={(e) => {
                e.stopPropagation();
                onSelectItem(item);
                if (isSoil) {
                  setSelectedSoil(item);
                  setSelectedAnimal(null);
                  setSelectedFactory(null);
                } else if (isAnimal) {
                  setSelectedAnimal(item);
                  setSelectedSoil(null);
                  setSelectedFactory(null);
                } else if (isFactory) {
                  const currentBuild = productionBuildings.find(b => b.id === item.uid) || {
                    id: item.uid,
                    type: 'factory',
                    currentRecipeId: 'bread_recipe',
                    status: 'producing',
                    progress: 0,
                    timeRemaining: 45,
                    totalProductionTime: 45,
                  };
                  setSelectedFactory(currentBuild);
                  setSelectedSoil(null);
                  setSelectedAnimal(null);
                }
              }}
              style={style}
              className={`absolute cursor-pointer transform -translate-x-1/4 -translate-y-3/4 hover:scale-105 transition-transform duration-200 group ${
                isLargeBuilding ? 'z-20' : 'z-10'
              }`}
            >
              {asset.requiresPedestal && (
                <img
                  src="/pedestal.png"
                  alt="pedestal"
                  className="absolute -bottom-4 -left-3 w-[140px] h-auto z-0 drop-shadow-lg pointer-events-none"
                />
              )}

              <img
                src={asset.image}
                alt={asset.name}
                style={{
                  filter: isSoil && item.soilState === 'plowed' 
                    ? 'sepia(0.6) brightness(0.8) drop-shadow(0px 14px 8px rgba(0,0,0,0.55))' 
                    : isSoil && (item.soilState === 'watered' || item.soilState === 'planted')
                    ? 'hue-rotate(180deg) brightness(0.9) drop-shadow(0px 14px 8px rgba(0,0,0,0.55))'
                    : 'drop-shadow(0px 14px 8px rgba(0, 0, 0, 0.55))'
                }}
                className={`relative z-10 object-contain pointer-events-none ${
                  isLargeBuilding 
                    ? 'w-[190px] sm:w-[230px] max-h-[230px] -ml-8 -mt-12' 
                    : 'w-[85px] sm:w-[100px] max-h-[100px]'      
                }`}
              />

              {/* 2. تنظيف الشبكة: أشرطة النمو والحيوية تظهر عند المرور بالفأرة (Hover) أو انخفاض الحيوية */}
              {isSoil && item.soilState === 'planted' && (
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="text-2xl drop-shadow-md animate-bounce">
                    {getCropStageIcon(item.growthStage)}
                  </span>
                  {growthInfo && (item.growthStage ?? 0) < 3 && (
                    <div className="w-16 bg-black/80 rounded-full h-1.5 border border-amber-500 overflow-hidden mt-1 shadow">
                      <div className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full" style={{ width: `${growthInfo.progress}%` }} />
                    </div>
                  )}
                </div>
              )}

              {isAnimal && (
                <div className={`absolute -top-2 left-4 w-14 bg-black/90 rounded-full h-2 border border-[#d4af37] overflow-hidden z-30 flex shadow-md transition-opacity duration-200 ${animalHealth < 50 ? 'opacity-100 animate-pulse' : 'opacity-0 group-hover:opacity-100'}`}>
                  <div className={`h-full ${animalHealth > 50 ? 'bg-green-500' : 'bg-red-600'}`} style={{ width: `${animalHealth}%` }} />
                </div>
              )}
            </div>
          );
        })}

        {floatingTexts.map((ft) => {
          const style = getIsometricStyle(ft.x, ft.y, true);
          return (
            <div
              key={ft.id}
              style={{
                ...style,
                transform: 'translate(-50%, -120%)',
                animation: 'floatUp 1.5s ease-out forwards'
              }}
              className={`absolute z-50 font-black text-sm md:text-base drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] pointer-events-none whitespace-nowrap ${ft.color}`}
            >
              {ft.text}
            </div>
          );
        })}

        {workers.map((worker) => {
          const style = getIsometricStyle(worker.x, worker.y, true);
          return (
            <div
              key={worker.id}
              style={style}
              className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 z-30"
            >
              <img
                src={worker.image}
                alt={worker.name}
                style={{ filter: 'drop-shadow(0px 6px 4px rgba(0, 0, 0, 0.6))' }}
                className="w-12 h-12 object-contain"
              />
              <span className="absolute -bottom-3 left-0 right-0 text-center bg-black/85 text-[#f9e8a2] text-[8px] px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap border border-amber-600/50 shadow">
                {worker.name} ⚡{worker.stamina}%
              </span>
            </div>
          );
        })}
      </div>

      {/* نافذة الترحيب */}
      {onboardingStep !== null && onboardingStep < ONBOARDING_STEPS.length && (
        <div className="absolute inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#2a1810] border-4 border-[#d4af37] rounded-3xl p-6 max-w-lg w-full shadow-[0_0_50px_rgba(212,175,55,0.4)] relative flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full border-2 border-[#d4af37] overflow-hidden bg-[#1a0f07] -mt-16 mb-4 shadow-lg">
              <img src="/shaheen.png" alt="عم شاهين" className="w-full h-full object-contain" />
            </div>
            
            <h3 className="text-[#d4af37] font-black text-2xl mb-2 drop-shadow">
              {ONBOARDING_STEPS[onboardingStep].title}
            </h3>
            
            <p className="text-[#f9e8a2] text-sm md:text-base leading-relaxed mb-6 bg-[#1a0f07]/60 p-4 rounded-xl border border-amber-900/40">
              {ONBOARDING_STEPS[onboardingStep].text}
            </p>

            <div className="flex gap-4 w-full justify-center">
              <button
                onClick={() => {
                  if (onboardingStep < ONBOARDING_STEPS.length - 1) {
                    setOnboardingStep(onboardingStep + 1);
                  } else {
                    setOnboardingStep(null);
                  }
                }}
                className="bg-gradient-to-r from-[#d4af37] to-[#aa820a] hover:from-[#e5c158] hover:to-[#c49814] text-[#1a0f07] font-black px-8 py-3 rounded-full shadow-lg transform hover:scale-105 transition-all duration-150 border border-yellow-200 cursor-pointer"
              >
                {onboardingStep < ONBOARDING_STEPS.length - 1 ? 'التالي ◄' : 'ابدأ العمل يا باشا! 🚀'}
              </button>
              
              <button
                onClick={() => setOnboardingStep(null)}
                className="text-amber-500 hover:text-amber-300 text-xs underline self-center cursor-pointer"
              >
                تخطي الشرح
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}