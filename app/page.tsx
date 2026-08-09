"use client";

import React, { useState, useEffect } from 'react';
import FarmGrid from '../components/farm/farm_grid';
import { GAME_ASSETS, LAND_CONTRACTS } from '../lib/gameData';
import { PlacedItem, PlayerStats, ProductionRecipe } from './types';
import RoyalMarketModal from '../components/farm/royal-market-modal';
import { usePiAuth } from '../contexts/auth-context';
import { getPiUid } from '../lib/pi-direct-payment';

// 1. تصحيح مسارات الاستيراد للمكونات والأدوات بناءً على هيكل المجلدات لديك
import PharaonicSplashScreen from "../components/PharaonicSplashScreen";
import BashaRescueModal, { FarmAnimal } from "../components/BashaRescueModal";
import LandRentalSystem from "../components/LandRentalSystem";
import MarketplaceArchitecture from "../components/MarketplaceArchitecture";
import { AudioManagerAndCycle, TimeOfDay } from "../components/AudioManager";

// ==========================================
// نظام الترجمة الشامل (Localization System)
// ==========================================
const translations: Record<string, Record<string, string>> = {
  ar: {
    level: "المستوى",
    energy: "الطاقة",
    crops: "المحاصيل",
    wheat: "قمح",
    day: "نهار مشرق",
    night: "ليل المشاعل",
    sunset: "غروب/شروق",
    harp: "عزف القيثارة",
    harvestAll: "حصاد الكل",
    market: "السوق",
    factory: "المصانع",
    leaderboard: "المتصدرين",
    quests: "المهام",
    inventory: "الحقيبة",
    factoriesStatus: "حالة مصانع المملكة",
    integrated: "مدمجة",
    openFullFactory: "فتح لوحة التصنيع الكاملة",
    buildingTab: "🏰 المباني الملكية",
    factoryTab: "🏭 المصانع والإنتاج",
    animalTab: "🐎 المواشي والطيور",
    cropTab: "🌾 الحقول والأشجار",
    equipmentTab: "⚙️ المعدات والعلف",
    decorationTab: "🗿 المعالم والزينة",
    logout: "تسجيل الخروج",
    close: "إغلاق",
  },
  en: {
    level: "Level",
    energy: "Energy",
    crops: "Crops",
    wheat: "Wheat",
    day: "Bright Day",
    night: "Torch Night",
    sunset: "Sunset/Sunrise",
    harp: "Play Harp",
    harvestAll: "Harvest All",
    market: "Market",
    factory: "Factories",
    leaderboard: "Leaderboard",
    quests: "Quests",
    inventory: "Inventory",
    factoriesStatus: "Kingdom Factories Status",
    integrated: "Integrated",
    openFullFactory: "Open Full Factory Panel",
    buildingTab: "🏰 Royal Buildings",
    factoryTab: "🏭 Factories & Production",
    animalTab: "🐎 Livestock & Birds",
    cropTab: "🌾 Fields & Trees",
equipmentTab: "⚙️ Equipment & Feed",
    decorationTab: "🗿 Landmarks & Decor",
    logout: "Logout",
    close: "Close",
  },
  fr: {
    level: "Niveau",
    energy: "Énergie",
    crops: "Cultures",
    wheat: "Blé",
    day: "Jour Lumineux",
    night: "Nuit Torche",
    sunset: "Coucher/Lever",
    harp: "Jouer de la harpe",
    harvestAll: "Tout récolter",
    market: "Marché",
    factory: "Usines",
    leaderboard: "Classement",
    quests: "Quêtes",
    inventory: "Inventaire",
    factoriesStatus: "État des usines",
    integrated: "Intégré",
    openFullFactory: "Ouvrir le panneau d'usine",
    buildingTab: "🏰 Bâtiments",
    factoryTab: "🏭 Usines",
    animalTab: "🐎 Animaux",
    cropTab: "🌾 Champs",
    equipmentTab: "⚙️ Équipement",
    decorationTab: "🗿 Décoration",
    close: "Fermer",
  },
  vi: {
    level: "Cấp độ",
    energy: "Năng lượng",
    crops: "Cây trồng",
    wheat: "Lúa mì",
    day: "Ban ngày",
    night: "Ban đêm",
    sunset: "Hoàng hôn/Bình minh",
    harp: "Chơi đàn hạc",
    harvestAll: "Thu hoạch tất cả",
    market: "Thị trường",
    factory: "Nhà máy",
    leaderboard: "Bảng xếp hạng",
    quests: "Nhiệm vụ",
    inventory: "Kho đồ",
    factoriesStatus: "Trạng thái nhà máy",
    integrated: "Tích hợp",
    openFullFactory: "Mở bảng nhà máy",
    buildingTab: "🏰 Tòa nhà",
    factoryTab: "🏭 Nhà máy",
    animalTab: "🐎 Động vật",
    cropTab: "🌾 Cánh đồng",
    equipmentTab: "⚙️ Thiết bị",
    decorationTab: "🗿 Trang trí",
    close: "Đóng",
  },
  ko: {
    level: "레벨",
    energy: "에너지",
    crops: "작물",
    wheat: "밀",
    day: "맑은 낮",
    night: "밤",
    sunset: "일몰/일출",
    harp: "하프 연주",
    harvestAll: "모두 수확",
    market: "시장",
    factory: "공장",
    leaderboard: "순위표",
    quests: "퀘스트",
    inventory: "인벤토리",
    factoriesStatus: "왕국 공장 상태",
    integrated: "통합됨",
    openFullFactory: "공장 패널 열기",
    buildingTab: "🏰 왕실 건물",
    factoryTab: "🏭 공장 및 생산",
    animalTab: "🐎 가축 및 조류",
    cropTab: "🌾 들판 및 나무",
    equipmentTab: "⚙️ 장비 및 사료",
    decorationTab: "🗿 명소 및 장식",
    close: "닫기",
  },
  es: {
    level: "Nivel",
    energy: "Energía",
    crops: "Cultivos",
    wheat: "Trigo",
    day: "Día Brillante",
    night: "Noche de Antorchas",
    sunset: "Atardecer/Amanecer",
    harp: "Tocar Arpa",
    harvestAll: "Cosechar Todo",
    market: "Mercado",
    factory: "Fábricas",
    leaderboard: "Clasificación",
    quests: "Misiones",
    inventory: "Inventario",
    factoriesStatus: "Estado de Fábricas",
    integrated: "Integrado",
    openFullFactory: "Abrir Panel de Fábrica",
    buildingTab: "🏰 Edificios",
    factoryTab: "🏭 Fábricas",
    animalTab: "🐎 Animales",
    cropTab: "🌾 Cultivos",
    equipmentTab: "⚙️ Equipo",
    decorationTab: "🗿 Decoración",
    close: "Cerrar",
  },
  zh: {
    level: "等级",
    energy: "能量",
    crops: "农作物",
    wheat: "小麦",
    day: "明亮白天",
    night: "火把之夜",
    sunset: "日落/日出",
    harp: "弹奏竖琴",
    harvestAll: "全部收获",
    market: "市场",
    factory: "工厂",
    leaderboard: "排行榜",
    quests: "任务",
    inventory: "背包",
    factoriesStatus: "王国工厂状态",
    integrated: "已集成",
    openFullFactory: "打开工厂面板",
    buildingTab: "🏰 王国建筑",
    factoryTab: "🏭 工厂生产",
    animalTab: "🐎 牲畜禽鸟",
    cropTab: "🌾 田地树木",
    equipmentTab: "⚙️ 装备饲料",
    decorationTab: "🗿 景观装饰",
    close: "关闭",
  },
  ru: {
    level: "Уровень",
    energy: "Энергия",
    crops: "Урожай",
    wheat: "Пшеница",
    day: "Ясный день",
    night: "Ночь",
    sunset: "Закат/Рассвет",
    harp: "Играть на арфе",
    harvestAll: "Собрать всё",
    market: "Рынок",
    factory: "Фабрики",
    leaderboard: "Таблица лидеров",
    quests: "Задания",
    inventory: "Инвенварь",
    factoriesStatus: "Статус фабрик",
    integrated: "Встроено",
    openFullFactory: "Открыть панель фабрик",
    buildingTab: "🏰 Здания",
    factoryTab: "🏭 Фабрики",
    animalTab: "🐎 Животные",
    cropTab: "🌾 Поля",
    equipmentTab: "⚙️ Оборудование",
    decorationTab: "🗿 Декор",
    close: "Закрыть",
  }
};

interface FloatingText {
  id: string;
  text: string;
  color: string;
}

interface RoyalQuest {
  id: string;
  title: string;
  description: string;
  rewardGold: number;
  rewardXp: number;
  rewardPi: number;
  completed: boolean;
}

interface LeaderboardPlayer {
  rank: number;
  name: string;
  level: number;
  xp: number;
  gold: number;
}

// تعديل: تم إزالة كلمة export لتجنب تعارض Next.js Page Exports
const farmItems: Record<string, any> = {
  seed_wheat: {
    id: 'seed_wheat',
    name: 'بذور القمح الذهبي',
    category: 'crop',
    image: '/seed_wheat.png',
    productName: 'سنابل قمح',
    gridSize: { width: 1, height: 1 },
    buyPriceGold: 10,
    requiredLevel: 1,
    xpReward: 5,
    productionTimeSec: 60,
    outputQuantity: 2
  },
  seed_barley: {
    id: 'seed_barley',
    name: 'بذور الشعير الفرعوني',
    category: 'crop',
    image: '/seed_barley.png',
    productName: 'حبوب الشعير',
    gridSize: { width: 1, height: 1 },
    buyPriceGold: 20,
    requiredLevel: 2,
    xpReward: 8,
    productionTimeSec: 120,
    outputQuantity: 2
  },
  seed_flax: {
    id: 'seed_flax',
    name: 'بذور الكتان الملكي',
    category: 'crop',
    image: '/seed_flax.png',
    productName: 'خيوط الكتان الخام',
    gridSize: { width: 1, height: 1 },
    buyPriceGold: 35,
    buyPricePi: 0.1,
    requiredLevel: 3,
    xpReward: 12,
    productionTimeSec: 180,
    outputQuantity: 3
  },
  seed_lotus: {
    id: 'seed_lotus',
    name: 'بذور زهرة اللوتس المقدسة',
    category: 'crop',
    image: '/seed_lotus.png',
    productName: 'لوتس أسطوري',
    gridSize: { width: 1, height: 1 },
    buyPriceGold: 200,
    buyPricePi: 1.0,
    requiredLevel: 10,
    xpReward: 50,
    productionTimeSec: 900,
    outputQuantity: 1
  },
  animal_feed_pack: {
    id: 'animal_feed_pack',
    name: 'علف الحيوانات الملكي المركب',
    category: 'equipment',
    image: '/animal_feed.png',
    productName: 'علف جاهز للإطعام',
    gridSize: { width: 1, height: 1 },
    buyPricePi: 0.05,
    buyPriceGold: 15,
    requiredLevel: 1,
    xpReward: 10,
    outputQuantity: 5,
    productionTimeSec: 0
  }
};

// تعديل: تم إزالة كلمة export لتجنب تعارض Next.js Page Exports
const factoryRecipes: ProductionRecipe[] = [
  {
    id: 'recipe_bread',
    buildingId: 'bakery',
    outputName: 'خبز فرعوني محمص',
    outputImage: '/bread.png',
    inputs: [{ assetId: 'سنابل قمح', quantity: 3 }],
    outputGoldValue: 60,
    craftTimeSec: 30,
    xpGranted: 15,
    requiredLevel: 1
  },
  {
    id: 'recipe_flax_cloth',
    buildingId: 'weaver',
    outputName: 'نسيج الكتان الملكي',
    outputImage: '/cloth.png',
    inputs: [{ assetId: 'خيوط الكتان الخام', quantity: 2 }],
    outputGoldValue: 120,
    outputPiValue: 0.1,
    craftTimeSec: 60,
    xpGranted: 30,
    requiredLevel: 3
  }
];

// ==========================================
// TEMP Pi SDK Diagnostic Panel (عرض فقط — لا يستدعي أي Pi API)
// ==========================================
function PiDiagnosticPanel({ piDiag }: { piDiag: { piPresent: boolean; authenticated: unknown; consentedScopes: unknown; error: string | null } }) {
  const [open, setOpen] = useState(true);
  return (
    <div
      style={{
        position: "fixed",
        top: 8,
        right: 8,
        zIndex: 9999,
        maxWidth: "min(90vw, 300px)",
        background: "rgba(0,0,0,0.92)",
        border: "2px solid #d4af37",
        borderRadius: 12,
        color: "#fff",
        fontSize: 11,
        fontFamily: "monospace",
        padding: 8,
        boxShadow: "0 0 20px rgba(212,175,55,0.5)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <b style={{ color: "#d4af37" }}>Pi SDK (تشخيص مؤقت)</b>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{ background: "#d4af37", color: "#000", border: "none", borderRadius: 6, fontWeight: 800, cursor: "pointer", padding: "0 6px" }}
        >
          {open ? "✕" : "+"}
        </button>
      </div>
      {open && (
        <div style={{ lineHeight: 1.6 }}>
          <div><b style={{ color: "#7dd3fc" }}>window.Pi:</b> {piDiag.piPresent ? "موجود ✅" : "غير موجود ❌"}</div>
          <div>
            <b style={{ color: "#86efac" }}>authenticated:</b>{" "}
            <span style={{ color: piDiag.authenticated ? "#86efac" : "#fca5a5" }}>
              {String(piDiag.authenticated)}
            </span>
          </div>
          <div>
            <b style={{ color: "#c4b5fd" }}>consentedScopes:</b>{" "}
            <span style={{ color: "#c4b5fd" }}>{JSON.stringify(piDiag.consentedScopes)}</span>
          </div>
          {piDiag.error && <div style={{ color: "#f87171" }}>⚠ error: {piDiag.error}</div>}
        </div>
      )}
    </div>
  );
}

export default function KingdomFarmPage() {
  const { logout } = usePiAuth();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("day");
  const [criticalAnimal, setCriticalAnimal] = useState<FarmAnimal | null>(null);

  // ==========================================
  // TEMP DIAGNOSTIC PANEL (read-only Pi SDK)
  // ==========================================
  const [piDiag, setPiDiag] = useState<{
    piPresent: boolean;
    authenticated: unknown;
    consentedScopes: unknown;
    error: string | null;
  }>({ piPresent: false, authenticated: undefined, consentedScopes: undefined, error: null });

  useEffect(() => {
    const readPi = () => {
      try {
        const pi = (window as any)?.Pi;
        setPiDiag({
          piPresent: !!pi,
          authenticated: pi?.authenticated,
          consentedScopes: pi?.consentedScopes,
          error: null,
        });
      } catch (e: any) {
        setPiDiag((prev) => ({ ...prev, error: e?.message || String(e) }));
      }
    };
    readPi();
    const id = setInterval(readPi, 2000);
    return () => clearInterval(id);
  }, []);

  // حالة اللغة المختارة (افتراضياً العربية أو الإنجليزية)
  const [currentLang, setCurrentLang] = useState<string>('ar');
  const t = (key: string) => translations[currentLang]?.[key] || translations['ar'][key] || key;

  const [stats, setStats] = useState<PlayerStats>({
    gold: 2500,
    pi: 15.0,
    level: 5,
    xp: 340,
    maxXp: 1000,
    energy: 100,
    maxEnergy: 100,
    inventory: {
      'سنابل قمح': 12,
      'بلح وتمور': 5,
      'خيوط الكتان الخام': 3,
      'علف جاهز للإطعام': 4
    }
  });

  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('crop');
  const [selectedAssetToPlace, setSelectedAssetToPlace] = useState<any | null>(null);
  const [selectedItemUid, setSelectedItemUid] = useState<string | null>(null);
  const [movingItemId, setMovingItemId] = useState<string | null>(null);
  
  const [showLandModal, setShowLandModal] = useState<boolean>(false);
  const [showInventoryModal, setShowInventoryModal] = useState<boolean>(false);
  const [showFactoryModal, setShowFactoryModal] = useState<boolean>(false);
  const [showMarketModal, setShowMarketModal] = useState<boolean>(false);
  const [showQuestsModal, setShowQuestsModal] = useState<boolean>(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const [quests, setQuests] = useState<RoyalQuest[]>([
    { id: 'q1', title: 'حصاد الخيرات', description: 'قم بحصاد أي محصولين من أراضي المملكة', rewardGold: 100, rewardXp: 50, rewardPi: 0.1, completed: false },
    { id: 'q2', title: 'توسيع الإمبراطورية', description: 'قم ببناء مبنى أو أصل جديد في مزرعتك', rewardGold: 150, rewardXp: 75, rewardPi: 0.2, completed: false },
    { id: 'q3', title: 'مباركة الآلهة', description: 'افتح ديوان الأراضي واستعرض عقود Pi', rewardGold: 80, rewardXp: 40, rewardPi: 0.1, completed: false }
  ]);

  const leaderboardData: LeaderboardPlayer[] = [
    { rank: 1, name: 'فرعون مصر (أنت)', level: stats.level, xp: stats.xp, gold: stats.gold },
    { rank: 2, name: 'كليوباترا العظيمة', level: 12, xp: 4500, gold: 18400 },
    { rank: 3, name: 'رمسيس الثاني', level: 10, xp: 3200, gold: 12100 },
    { rank: 4, name: 'إخناتون المتبتل', level: 8, xp: 2100, gold: 8900 },
    { rank: 5, name: 'توت عنخ آمون', level: 6, xp: 1450, gold: 5300 }
  ];

  const [harvestMessage, setHarvestMessage] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [, setTick] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t: number) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const cycleTimer = setInterval(() => {
      setTimeOfDay((prev: TimeOfDay) => {
        if (prev === "day") return "sunset";
        if (prev === "sunset") return "night";
        if (prev === "night") return "sunrise";
        return "day";
      });
    }, 130000);

    const riskTimer = setTimeout(() => {
      setCriticalAnimal({
        id: "cow-101",
        name: "البقرة الملكية حتحور",
        type: "cow",
        health: 25,
        hunger: 15,
        lastFed: Date.now() - 36000000,
      });
    }, 10000);

    return () => {
      clearInterval(cycleTimer);
      clearTimeout(riskTimer);
    };
  }, []);

useEffect(() => {
    const energyTimer = setInterval(() => {
      setStats((prev: PlayerStats) => {
        if (prev.energy < prev.maxEnergy) {
          return { ...prev, energy: Math.min(prev.maxEnergy, prev.energy + 1) };
        }
        return prev;
      });
    }, 5000);
    return () => clearInterval(energyTimer);
  }, []);

  // ==========================================
  // Pi SDK Payment Support (safe initialization)
  // ==========================================
  useEffect(() => {
    try {
      const pi = (window as any)?.Pi;
      if (pi && typeof pi.init === "function") {
        pi.init({ version: "2.0", sandbox: true })
          .then(() => {
            console.log("[PiPay] Pi.init({ version: '2.0', sandbox: true }) succeeded");
          })
          .catch((err: unknown) => {
            console.warn("[PiPay] Pi.init() failed (non-fatal):", err);
          });
      } else {
        console.warn("[PiPay] window.Pi not available for init");
      }
    } catch (e) {
      console.warn("[PiPay] Pi SDK init skipped:", e);
    }
  }, []);

  const playSound = (type: 'harvest' | 'place' | 'click' | 'error' | 'coin' | 'water') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;

      if (type === 'harvest') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.18);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'place') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'coin') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      }
    } catch (e) {}
  };

  const triggerFloatingText = (text: string, color = 'text-green-400') => {
    const id = Math.random().toString(36).substring(2, 9);
    setFloatingTexts((prev: FloatingText[]) => [...prev, { id, text, color }]);
    setTimeout(() => {
      setFloatingTexts((prev: FloatingText[]) => prev.filter((item) => item.id !== id));
    }, 1800);
  };

  // ==========================================
  // Pi.createPayment handler with all Pi SDK callbacks
  // ==========================================
  const handlePiPayment = async (
    amount: number,
    memo: string,
    metadata: Record<string, unknown>,
    onComplete?: () => void,
    onFail?: (msg: string) => void
  ) => {
    try {
      const pi = (window as any)?.Pi;
      if (!pi || typeof pi.createPayment !== "function") {
        const msg = "Pi Wallet غير متاح حاليًا. تأكد من فتح اللعبة داخل تطبيق Pi Browser.";
        console.error("[PiPay] createPayment unavailable:", !!pi);
        playSound("error");
        onFail ? onFail(msg) : alert(msg);
        return;
      }

      const uid = await getPiUid();
      const paymentData: any = {
        amount,
        memo: memo || "Pi Kingdom Farm purchase",
        metadata: metadata || {},
      };
      if (uid) paymentData.uid = uid;

      console.log("[PiPay] Calling Pi.createPayment", paymentData);

      pi.createPayment(
        paymentData,
        {
          onReadyForServerApproval: async (paymentId: string) => {
            console.log("[PiPay] onReadyForServerApproval", paymentId);
            try {
              await fetch("/api/auth/pi", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "approve", paymentId }),
              });
            } catch (approveErr) {
              console.error("[PiPay] Approve failed (continuing to completion):", approveErr);
            }
          },
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            console.log("[PiPay] onReadyForServerCompletion", paymentId, txid);
            try {
              await fetch("/api/auth/pi", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "complete", paymentId, txid }),
              });
              playSound("coin");
              triggerFloatingText(`+${amount} Pi 💜 تم الدفع بنجاح!`, "text-purple-300");
              if (onComplete) onComplete();
            } catch (completeErr) {
              console.error("[PiPay] Complete call failed:", completeErr);
              if (onFail) onFail("فشل إتمام الدفع على الخادم.");
            }
          },
          onCancel: (paymentId: string) => {
            console.log("[PiPay] onCancel", paymentId);
            if (onFail) onFail("تم إلغاء الدفع من قبل المستخدم.");
          },
          onError: (error: Error, payment?: unknown) => {
            console.error("[PiPay] onError", error, payment);
            if (onFail) onFail(error?.message || "خطأ غير متوقع أثناء الدفع.");
          },
        }
      );
    } catch (e) {
      console.error("[PiPay] handlePiPayment error:", e);
      playSound("error");
      if (onFail) onFail("تعذر بدء الدفع عبر Pi Wallet.");
    }
  };

  useEffect(() => {
    const savedStats = localStorage.getItem('pi_farm_stats');
    const savedItems = localStorage.getItem('pi_farm_items');

    if (savedStats) {
      try { setStats(JSON.parse(savedStats)); } catch (e) {}
    }
    if (savedItems) {
      try {
        const parsed = JSON.parse(savedItems);
        const fixedItems = parsed.map((item: any) => ({
          ...item,
          lastHarvestTime: typeof item.lastHarvestTime === 'number' ? item.lastHarvestTime : Date.now(),
          health: typeof item.health === 'number' ? item.health : 100
        }));
        setPlacedItems(fixedItems);
      } catch (e) {}
    } else {
      const now = Date.now();
      setPlacedItems([
        { uid: 'init-altar-1', assetId: 'altar', x: 3, y: 3, type: 'building', health: 100, lastHarvestTime: now },
        { uid: 'init-well-1', assetId: 'water_well', x: 4, y: 5, type: 'building', health: 90, lastHarvestTime: now }
      ]);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('pi_farm_stats', JSON.stringify(stats));
      localStorage.setItem('pi_farm_items', JSON.stringify(placedItems));
    }
  }, [stats, placedItems, isLoaded]);

  const allGameAssets: Record<string, any> = {
    ...GAME_ASSETS,
    ...farmItems
  };

  const filteredAssets = Object.values(allGameAssets).filter((asset: any) => {
    const cat = (asset.category || '').toLowerCase();
    if (selectedCategory === 'crop') {
      return ['crop', 'crops', 'plant', 'plants', 'seed', 'seeds', 'tree', 'trees', 'field', 'fields', 'farm', 'farms'].includes(cat);
    }
    if (selectedCategory === 'equipment') {
      return ['equipment', 'tool', 'tools', 'feed', 'consumable'].includes(cat) || asset.id === 'animal_feed_pack';
    }
    if (selectedCategory === 'factory') {
      return ['factory', 'factories', 'production', 'workshop'].includes(cat);
    }
    return cat === selectedCategory;
  });

  const selectedGridItem = placedItems.find((i: PlacedItem) => i.uid === selectedItemUid) || null;

  const handleUpdateItem = (updatedItem: PlacedItem) => {
    setPlacedItems((prevItems: PlacedItem[]) =>
      prevItems.map((item: PlacedItem) => (item.uid === updatedItem.uid ? updatedItem : item))
    );
  };

  const handlePlaceTileClick = (x: number, y: number) => {
    if (movingItemId) {
      playSound('place');
      setPlacedItems((prev: PlacedItem[]) =>
        prev.map((item: PlacedItem) => (item.uid === movingItemId ? { ...item, x, y } : item))
      );
      setMovingItemId(null);
      return;
    }

    if (!selectedAssetToPlace) return;

    if (stats.energy < 10) {
      playSound('error');
      alert('⚡ طاقة المملكة منخفضة جداً! انتظر حتى تتجدد الطاقة لتتمكن من البناء.');
      return;
    }

const assetAny = selectedAssetToPlace as any;
    if (assetAny.buyPricePi && stats.pi < assetAny.buyPricePi) {
      playSound('error');
      alert('رصيد عملات Pi لا يكفي لإتمام هذا العقد!');
      return;
    }
    if (!assetAny.buyPricePi && stats.gold < assetAny.buyPriceGold) {
      playSound('error');
      alert('رصيد الذهب لا يكفي لشراء هذا الأصل!');
      return;
    }

    // خارجي: ادفع عبر Pi Wallet لأي أصل يُباع بعملة Pi قبل وضعه
    if (assetAny.buyPricePi) {
      handlePiPayment(
        assetAny.buyPricePi,
        `شراء ${selectedAssetToPlace.name || 'أصل ملكي'} بـ ${assetAny.buyPricePi} Pi`,
        { action: "place_asset", assetId: selectedAssetToPlace.id, pricePi: assetAny.buyPricePi },
        () => {
          placePurchasedAsset(selectedAssetToPlace, x, y);
        },
        (msg: string) => {
          playSound('error');
          alert(msg);
        }
      );
      return;
    }

    playSound('place');
    triggerFloatingText(`-10 ⚡ طاقة`, 'text-amber-300');
    triggerFloatingText(`+50 XP ⭐`, 'text-blue-300');

    setStats((prev: PlayerStats) => {
      let newXp = prev.xp + 50;
      let newLevel = prev.level;
      let newMaxXp = prev.maxXp;

      while (newXp >= newMaxXp) {
        newXp -= newMaxXp;
        newLevel += 1;
        newMaxXp = Math.floor(newMaxXp * 1.5);
      }

      const updatedInv = { ...(prev.inventory || {}) };
      if (selectedAssetToPlace.id === 'animal_feed_pack') {
        const prodName = selectedAssetToPlace.productName || 'علف جاهز للإطعام';
        updatedInv[prodName] = (updatedInv[prodName] || 0) + (selectedAssetToPlace.outputQuantity || 5);
      }

      return {
        ...prev,
        gold: assetAny.buyPricePi ? prev.gold : prev.gold - assetAny.buyPriceGold,
        pi: assetAny.buyPricePi ? prev.pi - assetAny.buyPricePi : prev.pi,
        energy: Math.max(0, prev.energy - 10),
        xp: newXp,
        level: newLevel,
        maxXp: newMaxXp,
        inventory: updatedInv
      };
    });

    if (selectedAssetToPlace.id !== 'animal_feed_pack') {
      const newItem: PlacedItem = {
        uid: `${selectedAssetToPlace.id}-${Date.now()}`,
        assetId: selectedAssetToPlace.id,
        x,
        y,
        type: selectedAssetToPlace.category,
        health: 100,
        lastHarvestTime: Date.now(),
        isFed: false
      };
      setPlacedItems((prev: PlacedItem[]) => [...prev, newItem]);
    } else {
      triggerFloatingText(`+5 حزم علف أضيفت للحقيبة!`, 'text-green-400');
    }

    setSelectedAssetToPlace(null);
  };

  // ثاني هاندلر: إتمام وضع الأصل بعد نجاح الدفع عبر Pi
  const placePurchasedAsset = (assetToPlace: any, x: number, y: number) => {
    playSound('place');
    triggerFloatingText(`-10 ⚡ طاقة`, 'text-amber-300');
    triggerFloatingText(`+50 XP ⭐`, 'text-blue-300');

    setStats((prev: PlayerStats) => {
      let newXp = prev.xp + 50;
      let newLevel = prev.level;
      let newMaxXp = prev.maxXp;

      while (newXp >= newMaxXp) {
        newXp -= newMaxXp;
        newLevel += 1;
        newMaxXp = Math.floor(newMaxXp * 1.5);
      }

      return {
        ...prev,
        energy: Math.max(0, prev.energy - 10),
        xp: newXp,
        level: newLevel,
        maxXp: newMaxXp
      };
    });

    if (assetToPlace.id !== 'animal_feed_pack') {
      const newItem: PlacedItem = {
        uid: `${assetToPlace.id}-${Date.now()}`,
        assetId: assetToPlace.id,
        x,
        y,
        type: assetToPlace.category,
        health: 100,
        lastHarvestTime: Date.now(),
        isFed: false
      };
      setPlacedItems((prev: PlacedItem[]) => [...prev, newItem]);
    } else {
      triggerFloatingText(`+5 حزم علف أضيفت للحقيبة!`, 'text-green-400');
    }

    setSelectedAssetToPlace(null);
  };

  const handleHarvestItem = (item: PlacedItem) => {
    const asset = allGameAssets[item.assetId];
    if (!asset) return;

    if (item.health !== undefined && item.health < 40) {
      playSound('error');
      alert('⚠️ هذا المبنى مهترئ وحالته أقل من 40%! يجب إصلاحه بالذهب أولاً لتتمكن من الحصاد.');
      return;
    }

    const isAnimal = item.type === 'animal';
    if (isAnimal && !item.isFed) {
      playSound('error');
      alert('🐾 هذا الحيوان جائع جداً ولن يدعك تحصد إنتاجه حتى تطعمه بالعلف الملكي أولاً!');
      return;
    }

    const now = Date.now();
    const lastHarvest = typeof item.lastHarvestTime === 'number' ? item.lastHarvestTime : now;
    const elapsedSec = Math.floor((now - lastHarvest) / 1000);
    const requiredTime = asset.productionTimeSec || 0;

    if (requiredTime > 0 && elapsedSec < requiredTime) {
      playSound('error');
      setHarvestMessage(`⏳ المحصول لم ينضج بعد! متبقي ${requiredTime - elapsedSec} ثانية.`);
      setTimeout(() => setHarvestMessage(null), 3000);
      return;
    }

    if (stats.energy < 5) {
      playSound('error');
      alert('⚡ طاقة المملكة منخفضة جداً للحصاد! انتظر لتتجدد الطاقة.');
      return;
    }

    playSound('harvest');

    const assetAny = asset as any;
    const quantityToAdd = asset.outputQuantity || assetAny.yieldAmount || 1;
    const productKey = asset.productName || 'ممتلكات عامة';
    const goldEarned = assetAny.sellPriceGold || 15;
    const xpEarned = asset.xpReward || 25;

    triggerFloatingText(`-5 ⚡ طاقة`, 'text-amber-300');
    triggerFloatingText(`+${quantityToAdd} 📦 ${productKey}`, 'text-green-400');
    setTimeout(() => triggerFloatingText(`+${goldEarned} 💰 ذهب`, 'text-yellow-300'), 200);
    setTimeout(() => triggerFloatingText(`+${xpEarned} ⭐ XP`, 'text-blue-300'), 400);

    setStats((prev: PlayerStats) => {
      const currentInventory = prev.inventory || {};
      const updatedInventory = {
        ...currentInventory,
        [productKey]: (currentInventory[productKey] || 0) + quantityToAdd
      };

      let newXp = prev.xp + xpEarned;
      let newGold = prev.gold + goldEarned;
      let newLevel = prev.level;
      let newMaxXp = prev.maxXp;

      while (newXp >= newMaxXp) {
        newXp -= newMaxXp;
        newLevel += 1;
        newMaxXp = Math.floor(newMaxXp * 1.5);
      }

      return {
        ...prev,
        gold: newGold,
        energy: Math.max(0, prev.energy - 5),
        xp: newXp,
        level: newLevel,
        maxXp: newMaxXp,
        inventory: updatedInventory
      };
    });

    setPlacedItems((prev: PlacedItem[]) =>
      prev.map((i: PlacedItem) => (i.uid === item.uid ? { ...i, lastHarvestTime: Date.now(), isFed: false } : i))
    );

    setSelectedItemUid(null);
    setHarvestMessage(`🎉 تم حصاد (${quantityToAdd}x ${productKey}) بنجاح وإضافتها للحقيبة!`);
    setTimeout(() => setHarvestMessage(null), 4000);
  };

  const handleHarvestAllReady = () => {
    const now = Date.now();
    let harvestedCount = 0;
    let totalGoldEarned = 0;
    let totalXpEarned = 0;
    let totalEnergyCost = 0;
    const invUpdates: Record<string, number> = {};

    const updatedItems = placedItems.map((item: PlacedItem) => {
      if (item.health !== undefined && item.health < 40) return item;
      const asset = allGameAssets[item.assetId];
      if (!asset) return item;
      const isAnimal = item.type === 'animal';
      if (isAnimal && !item.isFed) return item;

      const lastHarvest = typeof item.lastHarvestTime === 'number' ? item.lastHarvestTime : now;
      const elapsedSec = Math.floor((now - lastHarvest) / 1000);
      const requiredTime = asset.productionTimeSec || 0;

      if (requiredTime > 0 && elapsedSec < requiredTime) return item;
      if (stats.energy - totalEnergyCost < 3) return item;

      harvestedCount++;
      totalEnergyCost += 3;
      const qty = asset.outputQuantity || (asset as any).yieldAmount || 1;
      const prodKey = asset.productName || 'ممتلكات عامة';
      const gold = (asset as any).sellPriceGold || 15;
      const xp = asset.xpReward || 25;

      totalGoldEarned += gold;
      totalXpEarned += xp;
      invUpdates[prodKey] = (invUpdates[prodKey] || 0) + qty;

      return { ...item, lastHarvestTime: now, isFed: false };
    });

    if (harvestedCount === 0) {
      playSound('error');
      alert('⏳ لا توجد محاصيل جاهزة، أو أن بعض المباني مهترئة تحتاج صيانة، أو أن الحيوانات جائعة!');
      return;
    }

    playSound('harvest');
    triggerFloatingText(`🌾 تم حصاد ${harvestedCount} أصول دفعة واحدة!`, 'text-green-400');
    setTimeout(() => triggerFloatingText(`+${totalGoldEarned} 💰 ذهب`, 'text-yellow-300'), 300);

    setStats((prev: PlayerStats) => {
      const newInv = { ...prev.inventory };
      Object.entries(invUpdates).forEach(([key, val]) => {
        newInv[key] = (newInv[key] || 0) + val;
      });

      let newXp = prev.xp + totalXpEarned;
      let newLevel = prev.level;
      let newMaxXp = prev.maxXp;
      while (newXp >= newMaxXp) {
        newXp -= newMaxXp;
        newLevel += 1;
        newMaxXp = Math.floor(newMaxXp * 1.5);
      }

      return {
        ...prev,
        gold: prev.gold + totalGoldEarned,
        energy: Math.max(0, prev.energy - totalEnergyCost),
        xp: newXp,
        level: newLevel,
        maxXp: newMaxXp,
        inventory: newInv
      };
    });

    setPlacedItems(updatedItems);
  };

  const handleRepairItem = (itemToRepair: PlacedItem) => {
    const repairCostGold = 50;
    if (stats.gold < repairCostGold) {
      playSound('error');
      alert('💰 رصيد الذهب لا يكفي لدفع تكاليف صيانة المبنى!');
      return;
    }

    playSound('coin');
    triggerFloatingText(`-50 💰 صيانة`, 'text-yellow-300');
    triggerFloatingText(`+100% ✨ حالة المبنى`, 'text-green-400');

    setStats((prev: PlayerStats) => ({ ...prev, gold: prev.gold - repairCostGold }));
    setPlacedItems((prev: PlacedItem[]) =>
      prev.map((i: PlacedItem) => (i.uid === itemToRepair.uid ? { ...i, health: 100 } : i))
    );
  };

  const handleRemoveItem = (itemToRemove: PlacedItem) => {
    playSound('coin');
    const asset = allGameAssets[itemToRemove.assetId];
    if (asset) {
      const assetAny = asset as any;
      const refundGold = Math.floor((assetAny.buyPriceGold || 0) * 0.5);
      const refundPi = (assetAny.buyPricePi || 0) * 0.5;
      triggerFloatingText(`+${refundGold} 💰 استرداد`, 'text-yellow-400');
      setStats((prev: PlayerStats) => ({
        ...prev,
        gold: prev.gold + refundGold,
        pi: prev.pi + refundPi
      }));
    }
    setPlacedItems((prev: PlacedItem[]) => prev.filter((i: PlacedItem) => i.uid !== itemToRemove.uid));
    setSelectedItemUid(null);
  };

  const handleStartCrafting = (recipe: ProductionRecipe) => {
    for (const input of recipe.inputs) {
      const playerQuantity = stats.inventory[input.assetId] || 0;
      if (playerQuantity < input.quantity) {
        playSound('error');
        alert(`عذراً، الخامات غير كافية في الحقيبة! تحتاج إلى ${input.quantity} من العنصر (${input.assetId}).`);
        return;
      }
    }

    if (stats.level < recipe.requiredLevel) {
      playSound('error');
      alert(`مستواك الحالي لا يسمح بتصنيع هذا المنتج! تتطلب مستوى ${recipe.requiredLevel}.`);
      return;
    }

    playSound('coin');

    setStats((prev: PlayerStats) => {
      const updatedInventory = { ...prev.inventory };
      
      for (const input of recipe.inputs) {
        updatedInventory[input.assetId] = (updatedInventory[input.assetId] || 0) - input.quantity;
        if (updatedInventory[input.assetId] <= 0) {
          delete updatedInventory[input.assetId];
        }
      }

      const outputName = recipe.outputName;
      updatedInventory[outputName] = (updatedInventory[outputName] || 0) + 1;

      let newXp = prev.xp + recipe.xpGranted;
      let newLevel = prev.level;
      let newMaxXp = prev.maxXp;

      while (newXp >= newMaxXp) {
        newXp -= newMaxXp;
        newLevel += 1;
        newMaxXp = Math.floor(newMaxXp * 1.5);
      }

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        maxXp: newMaxXp,
        inventory: updatedInventory
      };
    });

    triggerFloatingText(`+1 ${recipe.outputName} 🏭 تم الإنتاج بنجاح!`, 'text-green-400');
  };

  const handleSellMarketItem = (itemId: string, quantity: number, priceGold: number, xpReward: number) => {
    if (quantity <= 0) return;
    
    const currentQty = stats.inventory[itemId] || 0;
    if (currentQty < quantity) {
      playSound('error');
      alert('الكمية المتاحة في حقيبتك لا تكفي لإتمام البيع!');
      return;
    }

    playSound('coin');
    const totalGoldEarned = priceGold * quantity;
    const totalXpEarned = xpReward * quantity;

    triggerFloatingText(`+${totalGoldEarned} 💰 بيع ملكي!`, 'text-yellow-300');
    setTimeout(() => triggerFloatingText(`+${totalXpEarned} ⭐ XP`, 'text-blue-300'), 250);

    setStats((prev: PlayerStats) => {
      const updatedInv = { ...prev.inventory };
      updatedInv[itemId] = (updatedInv[itemId] || 0) - quantity;
      if (updatedInv[itemId] <= 0) {
        delete updatedInv[itemId];
      }

      let newXp = prev.xp + totalXpEarned;
      let newLevel = prev.level;
      let newMaxXp = prev.maxXp;

      while (newXp >= newMaxXp) {
        newXp -= newMaxXp;
        newLevel += 1;
        newMaxXp = Math.floor(newMaxXp * 1.5);
      }

      return {
        ...prev,
        gold: prev.gold + totalGoldEarned,
        xp: newXp,
        level: newLevel,
        maxXp: newMaxXp,
        inventory: updatedInv
      };
    });
  };

  const totalCropsCount = Object.values(stats.inventory || {}).reduce((a: number, b: number) => a + b, 0);
  const wheatCount = stats.inventory['سنابل قمح'] || 0;

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-slate-950 text-white flex flex-col justify-between select-none">
     
      {isLoading && (
        <PharaonicSplashScreen onLoadingComplete={() => setIsLoading(false)} />
      )}

      {/* ==========================================
          TEMP DIAGNOSTIC PANEL (اضغط لإخفاء/إظهار)
          يقرأ فقط window.Pi?.authenticated
          و window.Pi?.consentedScopes — عرض فقط
      ========================================== */}
      <PiDiagnosticPanel piDiag={piDiag} />

      <div
        className="transition-all duration-1000 ease-in-out min-h-screen flex flex-col justify-between"
        style={{
          filter: AudioManagerAndCycle.getCycleFilter(timeOfDay),
        }}
      >
        <header className="sticky top-0 z-40 bg-gradient-to-b from-[#3a1d0d] to-[#1f0f06] border-b-4 border-[#d4af37] px-4 md:px-6 py-3 flex flex-col md:flex-row justify-between items-center gap-3 shadow-[0_0_25px_rgba(212,175,55,0.25)]">
          <div className="flex items-center gap-3 bg-black/70 border border-[#d4af37]/70 rounded-2xl px-4 py-2 shadow-inner flex-wrap justify-center">
            
            {/* اختيار اللغات (Localization Selector) */}
            <div className="flex items-center gap-1 bg-black/80 px-2 py-1 rounded-xl border border-amber-500/50">
              <span className="text-xs">🌐</span>
              <select
                value={currentLang}
                onChange={(e) => setCurrentLang(e.target.value)}
                className="bg-transparent text-amber-300 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="ar" className="bg-black text-white">العربية</option>
                <option value="en" className="bg-black text-white">English</option>
                <option value="fr" className="bg-black text-white">Français</option>
                <option value="vi" className="bg-black text-white">Tiếng Việt</option>
                <option value="ko" className="bg-black text-white">한국어</option>
                <option value="es" className="bg-black text-white">Español</option>
                <option value="zh" className="bg-black text-white">中文</option>
                <option value="ru" className="bg-black text-white">Русский</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-lg">⭐</span>
              <div>
                <div className="text-[10px] text-[#d4af37] font-bold">{t('level')} {stats.level}</div>
                <div className="w-16 bg-gray-700 h-1.5 rounded-full mt-0.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-yellow-300 h-full transition-all duration-300" style={{ width: `${(stats.xp / stats.maxXp) * 100}%` }} />
                </div>
              </div>
            </div>

            <div className="h-6 w-[1px] bg-amber-700/50 mx-1 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="text-lg">⚡</span>
              <div>
                <div className="text-[10px] text-amber-400 font-bold">{t('energy')}</div>
                <span className="font-black text-amber-300 text-xs">{stats.energy}/{stats.maxEnergy}</span>
              </div>
            </div>

            <div className="h-6 w-[1px] bg-amber-700/50 mx-1 hidden sm:block" />

            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="text-green-400">🌿 {t('crops')}: {totalCropsCount}</span>
              <span className="text-amber-300">🌾 {t('wheat')}: {wheatCount}</span>
            </div>

            <div className="text-xs bg-purple-900/60 px-2.5 py-1 rounded-full border border-purple-500 text-purple-200">
              {timeOfDay === "day" ? `☀️ ${t('day')}` : timeOfDay === "night" ? `🌙 ${t('night')}` : `🌅 ${t('sunset')}`}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            <button
              onClick={() => AudioManagerAndCycle.playHarpSound(520)}
              className="text-xs bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 px-3 py-1.5 rounded-lg border border-amber-500/50 transition-all"
            >
              🎵 {t('harp')}
            </button>

            <div className="flex items-center bg-black/80 border-2 border-yellow-500 rounded-xl px-3 py-1">
              <span className="text-yellow-400 text-sm font-black mr-1.5">💰</span>
              <span className="font-extrabold text-yellow-400 text-xs">{stats.gold.toLocaleString()}</span>
            </div>

            <div className="flex items-center bg-gradient-to-r from-purple-950 to-black border-2 border-purple-500 rounded-xl px-3 py-1">
              <span className="text-purple-400 text-sm font-black mr-1.5">💜</span>
              <span className="font-extrabold text-purple-300 text-xs">{stats.pi.toFixed(2)}</span>
            </div>

            <button
              onClick={handleHarvestAllReady}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 text-white font-extrabold px-3 py-1.5 rounded-xl border border-green-400 shadow transition active:scale-95 text-xs flex items-center gap-1 animate-pulse"
            >
              <span>🌾</span> {t('harvestAll')}
            </button>

            <button
              onClick={() => { playSound('click'); setShowMarketModal(true); }}
              className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 text-white font-extrabold px-3 py-1.5 rounded-xl border border-[#d4af37] shadow transition active:scale-95 text-xs flex items-center gap-1"
            >
              <span>⚖️</span> {t('market')}
            </button>

            <button
              onClick={() => { playSound('click'); setShowFactoryModal(true); }}
              className="bg-gradient-to-r from-blue-800 to-indigo-700 hover:from-blue-700 text-white font-extrabold px-3 py-1.5 rounded-xl border border-[#d4af37] shadow transition active:scale-95 text-xs flex items-center gap-1"
            >
              <span>🏭</span> {t('factory')}
            </button>

            <button
              onClick={() => { playSound('click'); setShowLeaderboardModal(true); }}
              className="bg-gradient-to-r from-yellow-700 to-amber-700 hover:from-yellow-600 text-white font-extrabold px-3 py-1.5 rounded-xl border border-[#d4af37] shadow transition active:scale-95 text-xs flex items-center gap-1"
            >
              <span>🏆</span> {t('leaderboard')}
            </button>

            <button
              onClick={() => { playSound('click'); setShowQuestsModal(true); }}
              className="bg-gradient-to-r from-emerald-800 to-green-700 hover:from-emerald-700 text-white font-extrabold px-3 py-1.5 rounded-xl border border-[#d4af37] shadow transition active:scale-95 text-xs flex items-center gap-1"
            >
              <span>📜</span> {t('quests')}
            </button>

            <button
              onClick={() => { playSound('click'); setShowInventoryModal(true); }}
              className="bg-gradient-to-r from-amber-800 to-amber-700 hover:from-amber-700 text-white font-extrabold px-3 py-1.5 rounded-xl border border-[#d4af37] shadow transition active:scale-95 text-xs flex items-center gap-1"
            >
              <span>🎒</span> {t('inventory')}
            </button>

            <button
              onClick={() => { playSound('click'); logout(); }}
              className="bg-gradient-to-r from-red-800 to-red-700 hover:from-red-600 text-white font-extrabold px-3 py-1.5 rounded-xl border border-red-400 shadow transition active:scale-95 text-xs flex items-center gap-1"
              title={t('logout')}
            >
              <span>🚪</span> {t('logout')}
            </button>
          </div>
        </header>

        <main className="flex-1 flex relative overflow-hidden">
         
          <aside className={`absolute left-0 top-4 z-30 transition-all duration-300 flex items-start ${isSidebarOpen ? 'translate-x-0' : '-translate-x-[calc(100%-44px)]'}`}>
            <div className="bg-black/90 border-r-4 border-y-2 border-[#d4af37] rounded-r-2xl p-4 w-72 shadow-[0_0_30px_rgba(212,175,55,0.2)] backdrop-blur-md flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-amber-800/60 pb-2">
                <span className="font-extrabold text-[#d4af37] text-xs flex items-center gap-1">
                  <span>🏭</span> {t('factoriesStatus')}
                </span>
                <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-700">{t('integrated')}</span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {factoryRecipes.map((recipe: ProductionRecipe) => (
                  <div key={recipe.id} className="bg-gradient-to-r from-blue-950/60 to-black/80 border border-blue-700/50 p-2.5 rounded-xl text-xs flex flex-col gap-1.5">
                    <div className="flex justify-between items-center font-bold text-yellow-300">
                      <span>{recipe.outputName}</span>
                      <span className="text-blue-300">{t('level')} {recipe.requiredLevel}</span>
                    </div>
                    <div className="text-[10px] text-gray-300 flex justify-between">
                      <span>الوقت: {recipe.craftTimeSec}ث</span>
                      <span className="text-green-400">العائد: {recipe.outputGoldValue} 💰</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => { playSound('click'); setShowFactoryModal(true); }}
                className="w-full bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 text-white font-bold py-2 rounded-xl text-xs transition shadow-md"
              >
                {t('openFullFactory')}
              </button>
            </div>

            <button
              onClick={() => { playSound('click'); setIsSidebarOpen(!isSidebarOpen); }}
              className="bg-gradient-to-b from-[#d4af37] to-amber-700 hover:from-yellow-400 text-black font-black p-2.5 rounded-r-xl border-y-2 border-r-2 border-white shadow-lg transition flex items-center justify-center mt-4"
            >
              <span className="text-base">{isSidebarOpen ? '◀' : '▶'}</span>
            </button>
          </aside>

          <div className="absolute inset-0 pointer-events-none z-50 flex flex-col items-center justify-center">
            {floatingTexts.map((item: FloatingText, idx: number) => (
              <div
                key={item.id}
                className={`text-xl md:text-2xl font-black ${item.color} drop-shadow-[0_4px_4px_rgba(0,0,0,1)] animate-bounce transition-all duration-700`}
                style={{ transform: `translateY(-${(idx + 1) * 25}px)` }}
              >
                {item.text}
              </div>
            ))}
          </div>

          {harvestMessage && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-950 via-green-950 to-black border-2 border-green-400 text-green-300 font-extrabold px-6 py-3 rounded-2xl shadow-2xl animate-bounce text-sm text-center">
              {harvestMessage}
            </div>
          )}

          {selectedAssetToPlace && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-amber-500/95 text-black font-extrabold px-6 py-2 rounded-full border-2 border-white shadow-2xl animate-bounce text-sm">
              💡 اضغط على أي مربّع رملي في الأرض لوضع: ({selectedAssetToPlace.name}) (يكلف 10 طاقة ⚡)
            </div>
          )}

          {movingItemId && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-blue-600/95 text-white font-extrabold px-6 py-2 rounded-full border-2 border-white shadow-2xl animate-pulse text-sm">
              📍 اضغط على المربع الجديد لنقل الأصل إليه الآن!
            </div>
          )}

          {selectedGridItem && !movingItemId && (() => {
            const asset = allGameAssets[selectedGridItem.assetId];
            const isAnimal = selectedGridItem.type === 'animal';
            const requiredFeed = 'علف جاهز للإطعام';
            const playerHasFeed = (stats.inventory[requiredFeed] || 0) > 0;
            const assetAny = asset as any;
            const expectedQty = asset?.outputQuantity || assetAny?.yieldAmount || 1;
            const itemHealth = selectedGridItem.health !== undefined ? selectedGridItem.health : 100;
            const isWornOut = itemHealth < 40;

            const now = Date.now();
            const lastHarvest = typeof selectedGridItem.lastHarvestTime === 'number' ? selectedGridItem.lastHarvestTime : now;
            const elapsed = Math.floor((now - lastHarvest) / 1000);
            const totalTime = asset?.productionTimeSec || 0;
            const remaining = Math.max(0, totalTime - elapsed);
            const isReady = remaining <= 0;
            const progressPercent = totalTime > 0 ? Math.min(100, Math.floor((elapsed / totalTime) * 100)) : 100;

            return (
              <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-black/95 border-2 border-[#d4af37] shadow-[0_0_30px_rgba(212,175,55,0.4)] p-4 rounded-2xl flex flex-col gap-3 animate-fadeIn items-center w-80">
                <div className="flex justify-between items-center w-full border-b border-amber-800/60 pb-1.5">
                  <span className="font-bold text-amber-300 text-xs">
                    {isAnimal ? `🐾 إدارة الحيوان: ${asset?.name}` : `🌾 تحكم في الأصل: ${asset?.name}`}
                  </span>
                  <button
                    onClick={() => { playSound('click'); setSelectedItemUid(null); }}
                    className="text-gray-400 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded bg-gray-800"
                  >
                    ✕
                  </button>
                </div>

                <div className="w-full bg-amber-950/40 border border-amber-700/50 p-2.5 rounded-xl flex flex-col items-center gap-2">
                  <div className="w-full flex justify-between items-center text-[10px] text-amber-200">
                    <span>حالة الصيانة: {itemHealth}%</span>
                    {isWornOut && <span className="text-red-400 font-bold animate-pulse">⚠️ مهترئ يحتاج صيانة!</span>}
                  </div>

                  {isWornOut && (
                    <button
                      onClick={() => handleRepairItem(selectedGridItem)}
                      className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 text-black font-black py-1.5 rounded-lg text-xs shadow-md"
                    >
                      🛠️ إصلاح المبنى وتجديده (50 💰)
                    </button>
                  )}

                  {isAnimal && (
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px] text-gray-300">
                        {selectedGridItem.isFed ? '✨ شبعان وجاهز للإنتاج الحصادي!' : '🍖 جائع ولا بد من إطعامه أولاً!'}
                      </span>
                      <span className="text-[10px] text-amber-400">
                        المتوفر في الحقيبة: {requiredFeed} ({stats.inventory[requiredFeed] || 0})
                      </span>
                    </div>
                  )}

                  {totalTime > 0 && !isReady && (
                    <div className="w-full">
                      <div className="flex justify-between text-[10px] text-gray-300 mb-1">
                        <span>النمو: {progressPercent}%</span>
                        <span>متبقي: {remaining}s</span>
                      </div>
                      <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden border border-gray-700">
                        <div className="bg-gradient-to-r from-blue-500 to-green-400 h-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="w-full flex flex-col gap-1.5 mt-1">
                    {isAnimal && !selectedGridItem.isFed ? (
                      <button
                        onClick={() => {
                          if (!playerHasFeed) {
                            playSound('error');
                            alert(`عذراً، حقيبتك تخلو من (${requiredFeed}) للإطعام! قم بشرائه من المتجر.`);
                            return;
                          }
                          playSound('coin');
                          setStats((prev: PlayerStats) => ({
                            ...prev,
                            inventory: {
                              ...prev.inventory,
                              [requiredFeed]: prev.inventory[requiredFeed] - 1
                            }
                          }));
                          setPlacedItems((prev: PlacedItem[]) =>
                            prev.map((i: PlacedItem) => (i.uid === selectedGridItem.uid ? { ...i, isFed: true } : i))
                          );
                          triggerFloatingText('🍖 تم إطعام الحيوان بنجاح!', 'text-green-400');
                        }}
                        className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 text-white py-1.5 rounded-lg text-xs font-black shadow-lg"
                      >
                        إطعام بـ (1 {requiredFeed})
                      </button>
                    ) : totalTime ? (
                      isReady ? (
                        <button
                          onClick={() => handleHarvestItem(selectedGridItem)}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white py-1.5 rounded-lg text-xs font-black animate-bounce shadow-lg"
                        >
                          🌾 حصاد ({expectedQty}) (تستهلك 5 ⚡)
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (stats.energy < 15) {
                              playSound('error');
                              alert('⚡ تحتاج إلى 15 طاقة لري المحصول وتسريع نموه!');
                              return;
                            }
                            playSound('water');
                            setStats((prev: PlayerStats) => ({ ...prev, energy: Math.max(0, prev.energy - 15) }));
                            setPlacedItems((prev: PlacedItem[]) =>
                              prev.map((i: PlacedItem) =>
                                i.uid === selectedGridItem.uid
                                  ? { ...i, lastHarvestTime: (i.lastHarvestTime || Date.now()) - 60000 }
                                  : i
                              )
                            );
                            triggerFloatingText('💧 تم الري! تسريع 60 ثانية', 'text-blue-400');
                          }}
                          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-1.5 rounded-lg text-xs font-black shadow-lg flex items-center justify-center gap-1"
                        >
                          <span>💧</span> ري وتسريع النمو (-60s) [15 ⚡]
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => handleHarvestItem(selectedGridItem)}
                        className="w-full bg-green-600 hover:bg-green-500 text-white py-1.5 rounded-lg text-xs font-black shadow-lg"
                      >
                        🌾 حصاد الإنتاج ({expectedQty})
                      </button>
                    )}
                  </div>
                </div>

                <div className="w-full bg-black/60 border border-blue-900/50 p-2.5 rounded-xl flex flex-col items-center gap-2">
                  <span className="text-[11px] font-bold text-blue-300">📍 قسم النقل والإدارة</span>
                  <div className="w-full flex gap-2 justify-center">
                    <button
                      onClick={() => {
                        playSound('click');
                        setMovingItemId(selectedGridItem.uid);
                        setSelectedItemUid(null);
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-1.5 rounded-lg text-xs font-black shadow"
                    >
                      📍 نقل لمكان آخر
                    </button>
                    <button
                      onClick={() => handleRemoveItem(selectedGridItem)}
                      className="flex-1 bg-red-700 hover:bg-red-600 text-white py-1.5 rounded-lg text-xs font-black shadow"
                    >
                      🗑️ إزالة واسترداد
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="w-full flex-1 flex justify-center items-center">
            <div className="w-full max-w-6xl">
              <FarmGrid
                items={placedItems}
                onSelectItem={(item: PlacedItem) => {
                  playSound('click');
                  setSelectedItemUid(item.uid);
                }}
                onPlaceTileClick={handlePlaceTileClick}
                onUpdateItem={handleUpdateItem}
              />
            </div>
          </div>
        </main>

        <section className="px-4 py-2">
          <LandRentalSystem />
        </section>

        <section className="px-4 py-2 mb-4">
          <MarketplaceArchitecture />
        </section>

        <footer className="bg-gradient-to-t from-[#1f0f06] to-[#3a1d0d] border-t-4 border-[#d4af37] p-4 z-50 shadow-[0_0_25px_rgba(212,175,55,0.2)]">
          <div className="flex justify-center gap-2 mb-3 flex-wrap">
            {[
              { id: 'building', label: t('buildingTab') },
              { id: 'factory', label: t('factoryTab') },
              { id: 'animal', label: t('animalTab') },
              { id: 'crop', label: t('cropTab') },
              { id: 'equipment', label: t('equipmentTab') },
              { id: 'decoration', label: t('decorationTab') }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  playSound('click');
                  setSelectedCategory(tab.id);
                  setSelectedAssetToPlace(null);
                }}
                className={`px-4 py-1.5 rounded-t-2xl font-black text-xs md:text-sm transition-all duration-200 border-t-2 border-x-2 ${
                  selectedCategory === tab.id
                    ? 'bg-[#d4af37] text-black border-white shadow-[0_0_15px_rgba(212,175,55,0.5)] scale-105 z-10'
                    : 'bg-black/60 text-amber-200/70 border-amber-800/40 hover:bg-black/80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 pt-1 px-4 max-w-7xl mx-auto scrollbar-thin scrollbar-thumb-[#d4af37]">
            {filteredAssets.map((asset: any) => {
              const isSelected = selectedAssetToPlace?.id === asset.id;
              const assetAny = asset as any;
              const requiredLvl = assetAny.requiredLevel || 1;
              const isLocked = stats.level < requiredLvl;

              return (
                <div
                  key={asset.id}
                  onClick={() => {
                    if (isLocked) {
                      playSound('error');
                      return;
                    }
                    playSound('click');
                    setSelectedAssetToPlace(isSelected ? null : asset);
                    setSelectedItemUid(null);
                    setMovingItemId(null);
                  }}
                  className={`min-w-[130px] w-[130px] bg-gradient-to-b from-amber-950/80 to-black/90 rounded-2xl border-2 p-2.5 flex flex-col items-center justify-between transition-all duration-150 relative group ${
                    isLocked
                      ? 'border-gray-700 opacity-60 grayscale cursor-not-allowed'
                      : isSelected
                        ? 'border-green-400 bg-green-950/40 -translate-y-2 shadow-[0_0_20px_rgba(74,222,128,0.4)] cursor-pointer'
                        : 'border-[#d4af37]/60 hover:border-[#d4af37] hover:-translate-y-1 cursor-pointer'
                  }`}
                >
                  {isLocked && (
                    <div className="absolute inset-0 bg-black/70 rounded-2xl flex flex-col items-center justify-center z-20">
                      <span className="text-3xl drop-shadow-md">🔒</span>
                      <span className="text-[10px] font-black text-red-400 mt-1 bg-black/80 px-2 py-0.5 rounded border border-red-900">{t('level')} {requiredLvl}</span>
                    </div>
                  )}

                  <div className="h-16 w-full flex items-center justify-center relative my-1">
                    <img
                      src={asset.image}
                      alt={asset.name}
                      className="max-h-full max-w-full object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-200"
                    />
                  </div>
                 
                  <div className="text-center w-full">
                    <h4 className="text-[11px] font-extrabold text-[#f9e8a2] truncate w-full">{asset.name}</h4>
                    <p className="text-[9px] text-gray-400 mb-2">{asset.productName || 'إنتاج عام'}</p>
                  </div>

                  <div className="w-full py-1 bg-black/80 rounded-xl border border-amber-900/50 flex items-center justify-center gap-1 font-black text-xs">
                    {assetAny.buyPricePi ? (
                      <>
                        <span className="text-purple-400">💜</span>
                        <span className="text-purple-300">{assetAny.buyPricePi} Pi</span>
                      </>
                    ) : (
                      <>
                        <span className="text-yellow-400">💰</span>
                        <span className="text-yellow-400">{assetAny.buyPriceGold}</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </footer>
      </div>

      <BashaRescueModal
        animal={criticalAnimal}
        onClose={() => setCriticalAnimal(null)}
onRescueWithPi={(id: string, cost: number) => {
          handlePiPayment(
            cost,
            `إنعاش ${id || 'الحيوان'} بـ ${cost} Pi`,
            { action: "rescue_animal", animalId: id, cost },
            () => {
              setCriticalAnimal(null);
              AudioManagerAndCycle.playHarpSound(600);
              triggerFloatingText(`🐾 تم إنعاش الحيوان بمحفظة Pi!`, 'text-green-400');
            },
            (msg: string) => {
              alert(msg);
            }
          );
        }}
        onRescueWithAd={(id: string) => {
          alert("تمت مشاهدة الإعلان! زادت صحة الحيوان مؤقتاً.");
          setCriticalAnimal(null);
        }}
        onCallVet={(id: string) => {
          alert("وصل الطبيب البيطري الفرعوني وعالج الحيوان بالكامل!");
          setCriticalAnimal(null);
          AudioManagerAndCycle.playWaterSound();
        }}
      />

      {showLeaderboardModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#3a1d0d] to-[#1a0f07] border-4 border-[#d4af37] shadow-[0_0_35px_rgba(212,175,55,0.4)] rounded-3xl p-6 max-w-md w-full relative animate-fadeIn">
            <h3 className="text-xl font-black text-[#d4af37] text-center mb-1">🏆 لوحة المتصدرين العالمية</h3>
            <p className="text-xs text-center text-amber-200/80 mb-6">قائمة أفخم مزارعي وإمبراطوريات وادي النيل تنافسياً</p>

            <div className="space-y-2 mb-6 max-h-60 overflow-y-auto pr-1">
              {leaderboardData.map((player: LeaderboardPlayer) => (
                <div key={player.rank} className={`border rounded-2xl px-4 py-3 flex justify-between items-center ${player.rank === 1 ? 'bg-amber-950/80 border-[#d4af37]' : 'bg-black/60 border-amber-800/40'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`font-black text-sm w-6 text-center ${player.rank === 1 ? 'text-yellow-300' : 'text-gray-300'}`}>#{player.rank}</span>
                    <div>
                      <h4 className="font-bold text-sm text-white">{player.name}</h4>
                      <span className="text-[10px] text-amber-400">{t('level')} {player.level} • {player.xp} XP</span>
                    </div>
                  </div>
                  <span className="bg-black/80 border border-yellow-600/60 text-yellow-300 font-extrabold px-3 py-1 rounded-xl text-xs">
                    💰 {player.gold.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => { playSound('click'); setShowLeaderboardModal(false); }}
              className="w-full bg-amber-700 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-lg"
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}

      {showFactoryModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#1a2b3c] to-[#0a1017] border-4 border-blue-500 shadow-[0_0_35px_rgba(59,130,246,0.5)] rounded-3xl p-6 max-w-lg w-full relative animate-fadeIn">
            <h3 className="text-xl font-black text-blue-300 text-center mb-1">🏭 مصانع المملكة والتصنيع الذكي</h3>
            <p className="text-xs text-center text-blue-200/80 mb-6">قم بتحويل محاصيلك الخام إلى منتجات ملكية فاخرة</p>

            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-1">
              {factoryRecipes.map((recipe: ProductionRecipe) => (
                <div key={recipe.id} className="bg-black/60 border border-blue-700/50 rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-sm text-yellow-300">✨ منتج: {recipe.outputName}</h4>
                      <p className="text-[10px] text-gray-300 mt-0.5">يتطلب {t('level')} {recipe.requiredLevel} • يمنح +{recipe.xpGranted} خبرة</p>
                    </div>
                    <span className="text-xs bg-blue-950 border border-blue-600 text-blue-300 font-extrabold px-3 py-1 rounded-xl">
                      💰 {recipe.outputGoldValue} ذهب
                    </span>
                  </div>

                  <div className="bg-black/80 p-2.5 rounded-xl border border-blue-900/60 flex items-center justify-between text-xs">
                    <span className="text-gray-400">الخامات اللازمة:</span>
                    <div className="flex gap-2">
                      {recipe.inputs.map((input: any, idx: number) => {
                        const availableQty = stats.inventory[input.assetId] || 0;
                        const hasEnough = availableQty >= input.quantity;
                        return (
                          <span key={idx} className={`font-bold px-2 py-0.5 rounded border ${hasEnough ? 'bg-green-950/80 border-green-600 text-green-300' : 'bg-red-950/80 border-red-600 text-red-300'}`}>
                            {input.assetId}: {availableQty}/{input.quantity}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartCrafting(recipe)}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white font-black py-2 rounded-xl text-xs transition shadow-lg"
                  >
                    🛠️ بدء التصنيع وخصم الخامات
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => { playSound('click'); setShowFactoryModal(false); }}
              className="w-full bg-blue-800 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-lg"
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}

      {showInventoryModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#3a1d0d] to-[#1a0f07] border-4 border-[#d4af37] shadow-[0_0_35px_rgba(212,175,55,0.4)] rounded-3xl p-6 max-w-md w-full relative animate-fadeIn">
            <h3 className="text-xl font-black text-[#d4af37] text-center mb-1">🎒 حقيبة الموارد والمحاصيل</h3>
            <p className="text-xs text-center text-amber-200/80 mb-6">قائمة المحاصيل والسلع التي تم حصادها من أراضي المملكة</p>

            <div className="max-h-60 overflow-y-auto space-y-2 mb-6 pr-1">
              {stats.inventory && Object.keys(stats.inventory).length > 0 ? (
                Object.entries(stats.inventory).map(([itemName, quantity]: [string, any]) => (
                  <div key={itemName} className="bg-black/60 border border-amber-700/50 rounded-2xl px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📦</span>
                      <span className="font-bold text-sm text-white">{itemName}</span>
                    </div>
                    <span className="bg-amber-950 border border-amber-600 text-amber-300 font-extrabold px-3 py-1 rounded-xl text-xs">
                      الكمية: {quantity}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 text-xs font-bold">
                  الحقيبة فارغة تماماً! ابدأ بحصاد حقولك ومبنيك الآن.
                </div>
              )}
            </div>

            <button
              onClick={() => { playSound('click'); setShowInventoryModal(false); }}
              className="w-full bg-amber-700 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-lg"
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}

      {showQuestsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#3a1d0d] to-[#1a0f07] border-4 border-[#d4af37] shadow-[0_0_35px_rgba(212,175,55,0.4)] rounded-3xl p-6 max-w-lg w-full relative animate-fadeIn">
            <h3 className="text-xl font-black text-[#d4af37] text-center mb-1">📜 ديوان المهام الملكية</h3>
            <p className="text-xs text-center text-amber-200/80 mb-6">أجز المهام اليومية واحصل على مكافآت ذهبية وعملات Pi</p>

            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-1">
              {quests.map((q: RoyalQuest) => (
                <div key={q.id} className="bg-black/60 border border-amber-700/50 rounded-2xl p-4 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-sm text-amber-300">{q.title}</h4>
                    <p className="text-[11px] text-gray-300 mt-0.5">{q.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs font-bold">
                      <span className="text-yellow-400">💰 +{q.rewardGold}</span>
                      <span className="text-purple-300">💜 +{q.rewardPi} Pi</span>
                      <span className="text-blue-300">⭐ +{q.rewardXp} XP</span>
                    </div>
                  </div>
                  <button
                    disabled={q.completed}
                    onClick={() => {
                      playSound('coin');
                      setStats((prev: PlayerStats) => ({
                        ...prev,
                        gold: prev.gold + q.rewardGold,
                        pi: Number((prev.pi + q.rewardPi).toFixed(2)),
                        xp: prev.xp + q.rewardXp
                      }));
                      setQuests((prev: RoyalQuest[]) => prev.map((item: RoyalQuest) => item.id === q.id ? { ...item, completed: true } : item));
                      triggerFloatingText(`+${q.rewardPi} Pi ومكافأة المهام!`, 'text-purple-300');
                    }}
                    className={`font-black px-4 py-2 rounded-xl text-xs transition ${
                      q.completed
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 text-white shadow-lg'
                    }`}
                  >
                    {q.completed ? '✨ تم الاستلام' : '🎁 استلام المكافأة'}
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => { playSound('click'); setShowQuestsModal(false); }}
              className="w-full bg-amber-700 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-lg"
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}

      {showLandModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#3a1d0d] to-[#1a0f07] border-4 border-[#d4af37] shadow-[0_0_35px_rgba(212,175,55,0.4)] rounded-3xl p-6 max-w-lg w-full relative animate-fadeIn">
            <h3 className="text-xl font-black text-[#d4af37] text-center mb-1">📜 ديوان الأراضي والعقود الملكية</h3>
            <p className="text-xs text-center text-amber-200/80 mb-6">قم بشراء مساحات شاسعة لتوسيع إمبراطوريتك باستخدام عملة Pi</p>

            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-1">
              {(() => {
                const contractsList = Array.isArray(LAND_CONTRACTS) ? LAND_CONTRACTS : Object.values(LAND_CONTRACTS || {});
                const displayList = contractsList.length > 0 ? contractsList : [
                  { id: 'land_1', name: 'أرض الوادي الخصيب', description: 'توسعة إضافية لزيادة المحاصيل.', pricePi: 5.0 },
                  { id: 'land_2', name: 'واحة سيناء الملكية', description: 'أرض مباركة تسرّع نمو النخيل.', pricePi: 15.0 }
                ];

                return displayList.map((contract: any, index: number) => {
                  const contractPrice = contract?.pricePi ?? (index + 1) * 5;
                  return (
                    <div key={contract?.id || index} className="bg-black/60 border border-amber-700/50 rounded-2xl p-4 flex justify-between items-center hover:border-[#d4af37] transition">
                      <div>
                        <h4 className="font-bold text-sm text-amber-300">{contract?.name || `الأرض رقم ${index + 1}`}</h4>
                        <p className="text-[11px] text-gray-300 mt-0.5">{contract?.description || 'توسعة زراعية جديدة'}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs font-bold">
                          <span className="text-purple-300">💜 {contractPrice} Pi</span>
                        </div>
                      </div>
<button
                        onClick={() => {
                          handlePiPayment(
                            contractPrice,
                            `استحواذ على ${contract?.name || 'أرض ملكية'} بـ ${contractPrice} Pi`,
                            { action: "land_purchase", landId: contract?.id || `${index}`, pricePi: contractPrice },
                            () => {
                              playSound('coin');
                              setStats((prev: PlayerStats) => ({
                                ...prev,
                                gold: prev.gold + 500
                              }));
                              triggerFloatingText(`+500 💰 مكافأة الأرض الجديدة!`, 'text-yellow-300');
                              setShowLandModal(false);
                            },
                            (msg: string) => {
                              playSound('error');
                              alert(msg);
                            }
                          );
                        }}
                        className="bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 text-white font-black px-4 py-2 rounded-xl text-xs transition shadow-lg"
                      >
                        استحواذ
                      </button>
                    </div>
                  );
                });
              })()}
            </div>

            <button
              onClick={() => { playSound('click'); setShowLandModal(false); }}
              className="w-full bg-amber-700 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-lg"
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}

      <RoyalMarketModal
        isOpen={showMarketModal}
        onClose={() => { playSound('click'); setShowMarketModal(false); }}
        inventory={stats.inventory}
        onSellItem={handleSellMarketItem}
      />
    </main>
  );
}
