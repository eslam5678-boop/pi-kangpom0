import React, { useState, useEffect } from 'react';

export default function PiKingdomMasterPatch() {
  // 1. حالات النظام العامة
  const [currentScreen, setCurrentScreen] = useState<'splash' | 'game'>('splash');
  const [isNight, setIsNight] = useState<boolean>(false);
  const [piBalance, setPiBalance] = useState<number>(150.50);
  const [goldBalance, setGoldBalance] = useState<number>(5000);
  const [activeTab, setActiveTab] = useState<'farm' | 'lands' | 'market'>('farm');

  // 2. نظام الحيوانات والصحة (Mortality & Neglect System)
  const [animals, setAnimals] = useState([
    { id: 1, name: 'بقرة حتحور الملكية', health: 85, hunger: 70, status: 'حية', timeToDeath: 36 },
    { id: 2, name: 'نعامة الصحراء الذهبية', health: 20, hunger: 15, status: 'خطر الموت ⚠️', timeToDeath: 2 },
    { id: 3, name: 'غزال النيل الأبرق', health: 95, hunger: 90, status: 'حية', timeToDeath: 44 }
  ]);

  // 3. ديوان الأراضي وعقود الإيجار (Land Rental Architecture)
  const [lands, setLands] = useState([
    { id: 'free', name: 'الحيز البلدي المجاني', rentPi: 0, status: 'مملوك (دائم)', expireIn: 'دائم' },
    { id: 'farmer', name: 'عزبة المزارع', rentPi: 5, status: 'مؤجر', expireIn: '6 أيام' },
    { id: 'pasha', name: 'المزرعة البشواتية', rentPi: 25, status: 'غير متاح', expireIn: 'منتهي' },
    { id: 'royal', name: 'المحمية الملكية الكبرى', rentPi: 100, status: 'غير متاح', expireIn: 'منتهي' }
  ]);

  // 4. السوق المزدوج (Marketplace: System Shop & P2P)
  const [p2pListings, setP2pListings] = useState([
    { id: 1, item: 'عقد لؤلؤ ملكي', seller: 'فرعون العصور', pricePi: 12.5, escrow: 'مؤمن' },
    { id: 2, item: 'جبن جاموسي عتيق', seller: 'معلم إبراهيم', pricePi: 3.0, escrow: 'مؤمن' }
  ]);

  // دورة الليل والنهار التلقائية
  useEffect(() => {
    const timer = setInterval(() => {
      setIsNight((prev) => !prev);
    }, 60000); // تبديل كل دقيقة تجريبياً
    return () => clearInterval(timer);
  }, []);

  // نظام الإنقاذ البشواتي للحيوانات الشارفة على الموت
  const rescueAnimal = (id: number, method: 'pi' | 'ad') => {
    setAnimals(prev => prev.map(anim => {
      if (anim.id === id) {
        if (method === 'pi' && piBalance >= 2) {
          setPiBalance(b => b - 2);
          return { ...anim, health: 100, hunger: 100, status: 'حية', timeToDeath: 48 };
        } else if (method === 'ad') {
          alert("تم مشاهدة الإعلان بنجاح! تم إنقاذ الحيوان واستعادة صحته بنسبة 100%.");
          return { ...anim, health: 100, hunger: 100, status: 'حية', timeToDeath: 48 };
        }
      }
      return anim;
    }));
  };

  // البيع الفوري في البورصة الرسمية
  const handleSystemSell = (item: string, goldYield: number) => {
    setGoldBalance(g => g + goldYield);
    alert(`تم بيع ${item} فوراً للبورصة الملكية مقابل ${goldYield} قطعة ذهبية!`);
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-700 ${isNight ? 'bg-indigo-950 text-amber-100' : 'bg-purple-900 text-amber-200'}`} dir="rtl">
      
      {/* شاشة البداية الملكية (Splash Screen) */}
      {currentScreen === 'splash' ? (
        <div className="flex flex-col items-center justify-center h-screen p-6 text-center bg-gradient-to-b from-purple-950 via-indigo-900 to-black">
          <div className="border-4 border-amber-400 p-8 rounded-3xl shadow-2xl bg-black/40 backdrop-blur-md max-w-lg w-full">
            <h1 className="text-4xl font-extrabold text-amber-400 mb-2 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
              Pi Kingdom Farm
            </h1>
            <p className="text-sm text-amber-200/80 mb-6 tracking-widest uppercase">Digital Economy Platform • Web3 NFTs</p>
            
            <div className="my-6 p-4 border border-amber-500/40 rounded-xl bg-amber-500/10">
              <p className="text-xs text-amber-300 leading-relaxed">
                مرحباً بك أيها الفرعون البشواتي في منصة الاقتصاد الرقمي الزراعي. تم تفعيل نظام الإدارة الكاملة، عقود الأراضي، وسوق Pi الحقيقي.
              </p>
            </div>

            <button 
              onClick={() => setCurrentScreen('game')}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-black text-xl rounded-xl shadow-lg transform active:scale-95 transition-all"
            >
              دخول العرش والمملكة 🏛️
            </button>
          </div>
        </div>
      ) : (
        /* الواجهة الرئيسية للعبة بعد الدخول */
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          
          {/* شريط الحالة العلوي */}
          <header className="flex flex-wrap justify-between items-center bg-black/40 border border-amber-500/30 p-4 rounded-2xl mb-6 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <span className="text-2xl">🏛️</span>
              <div>
                <h2 className="font-bold text-amber-400">مملكة فرعون الزراعية</h2>
                <span className="text-xs text-amber-300/75">
                  {isNight ? '🌙 ليل مشاعل الذهب (هادئ)' : '☀️ شروق الشمس الملكي'}
                </span>
              </div>
            </div>

            <div className="flex gap-4 items-center mt-2 md:mt-0">
              <div className="bg-amber-950/60 border border-amber-500/50 px-4 py-1.5 rounded-full text-sm font-bold text-amber-300">
                🪙 ذهب: {goldBalance}
              </div>
              <div className="bg-amber-950/60 border border-amber-500/50 px-4 py-1.5 rounded-full text-sm font-bold text-amber-300">
                π عملة Pi: {piBalance.toFixed(2)}
              </div>
            </div>
          </header>

          {/* تبويبات التنقل */}
          <nav className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { id: 'farm', label: 'حظائر الحيوانات والموت 🐄' },
              { id: 'lands', label: 'ديوان الأراضي والإيجار 📜' },
              { id: 'market', label: 'السوق المزدوج (البورصة و P2P) ⚖️' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'farm' | 'lands' | 'market')}
                className={`px-5 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-amber-500 text-black shadow-lg' : 'bg-black/30 border border-amber-500/30 text-amber-200 hover:bg-amber-500/10'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* المحتوى حسب التبويب */}
          <main className="space-y-6">
            
            {/* 1. قسم الحيوانات ونظام الإهمال والموت */}
            {activeTab === 'farm' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {animals.map(animal => (
                  <div key={animal.id} className="bg-black/40 border border-amber-500/30 p-5 rounded-2xl flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-amber-300 text-lg">{animal.name}</h3>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${animal.health < 30 ? 'bg-red-950 text-red-400 border border-red-600' : 'bg-emerald-950 text-emerald-400'}`}>
                          {animal.status}
                        </span>
                      </div>
                      
                      {/* مؤشرات الصحة والجوع */}
                      <div className="space-y-2 mb-4">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>الصحة</span>
                            <span>{animal.health}%</span>
                          </div>
                          <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden border border-amber-500/20">
                            <div className={`h-full ${animal.health < 30 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${animal.health}%` }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>مستوى الجوع</span>
                            <span>{animal.hunger}%</span>
                          </div>
                          <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden border border-amber-500/20">
                            <div className="h-full bg-amber-500" style={{ width: `${animal.hunger}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* زر الإنقاذ البشواتي في حالة الخطر */}
                    {animal.health < 30 ? (
                      <div className="flex gap-2 mt-2">
                        <button 
                          onClick={() => rescueAnimal(animal.id, 'pi')}
                          className="flex-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold py-2 rounded-lg transition-all"
                        >
                          علاج بـ 2 Pi 🩺
                        </button>
                        <button 
                          onClick={() => rescueAnimal(animal.id, 'ad')}
                          className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2 rounded-lg transition-all"
                        >
                          إعلان مجاني 📺
                        </button>
                      </div>
                    ) : (
                      <div className="text-center text-xs text-amber-300/60 py-2 bg-amber-500/5 rounded-lg border border-amber-500/10">
                        الحيوان في قمة نشاطه وصحته الملكية
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 2. قسم ديوان الأراضي وعقود الإيجار */}
            {activeTab === 'lands' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lands.map(land => (
                  <div key={land.id} className="bg-black/40 border border-amber-500/30 p-5 rounded-2xl flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-amber-300 text-lg mb-1">{land.name}</h3>
                      <p className="text-xs text-amber-200/70">الإيجار الدوري: <span className="text-amber-400 font-bold">{land.rentPi} Pi</span></p>
                      <p className="text-xs text-amber-200/70 mt-1">حالة العقد: <span className="font-semibold">{land.status}</span> ({land.expireIn})</p>
                    </div>
                    <button 
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${land.rentPi === 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-default' : 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg'}`}
                    >
                      {land.rentPi === 0 ? 'ملك حر' : 'تجديد العقد ✍️'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 3. السوق المزدوج (البورصة وسوق P2P) */}
            {activeTab === 'market' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* البورصة الرسمية للبيع الفوري */}
                <div className="bg-black/40 border border-amber-500/30 p-5 rounded-2xl">
                  <h3 className="font-bold text-amber-400 text-lg mb-3 border-b border-amber-500/20 pb-2">البورصة الرسمية (System Shop)</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-amber-950/40 p-3 rounded-xl border border-amber-500/20">
                      <div>
                        <span className="font-bold block text-sm">محصول القمح الخام</span>
                        <span className="text-xs text-amber-300/70">سعر ثابت للعبة</span>
                      </div>
                      <button 
                        onClick={() => handleSystemSell('القمح الخام', 150)}
                        className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-1.5 rounded-lg text-xs font-bold"
                      >
                        بيع فوري (+150 ذهب)
                      </button>
                    </div>

                    <div className="flex justify-between items-center bg-amber-950/40 p-3 rounded-xl border border-amber-500/20">
                      <div>
                        <span className="font-bold block text-sm">ألبان الأبقار الخام</span>
                        <span className="text-xs text-amber-300/70">سعر ثابت للعبة</span>
                      </div>
                      <button 
                        onClick={() => handleSystemSell('الألبان الخام', 250)}
                        className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-1.5 rounded-lg text-xs font-bold"
                      >
                        بيع فوري (+250 ذهب)
                      </button>
                    </div>
                  </div>
                </div>

                {/* سوق P2P المفتوح مع نظام الضمان المالي Escrow */}
                <div className="bg-black/40 border border-amber-500/30 p-5 rounded-2xl">
                  <h3 className="font-bold text-amber-400 text-lg mb-3 border-b border-amber-500/20 pb-2">سوق P2P المفتوح (Web3 Escrow)</h3>
                  <div className="space-y-3">
                    {p2pListings.map(item => (
                      <div key={item.id} className="flex justify-between items-center bg-amber-950/40 p-3 rounded-xl border border-amber-500/20">
                        <div>
                          <span className="font-bold block text-sm">{item.item}</span>
                          <span className="text-xs text-amber-300/70">البائع: {item.seller} • <span className="text-emerald-400">{item.escrow}</span></span>
                        </div>
                        <button 
                          onClick={() => alert(`تم شراء ${item.item} عبر محفظة Pi بنجاح بخصم عمولة المطور 2%!`)}
                          className="bg-gradient-to-r from-amber-500 to-yellow-600 text-black px-4 py-1.5 rounded-lg text-xs font-bold shadow"
                        >
                          شراء بـ {item.pricePi} Pi
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </main>
        </div>
      )}
    </div>
  );
}
