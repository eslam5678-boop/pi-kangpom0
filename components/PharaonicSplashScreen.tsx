"use client";

import React, { useEffect, useState } from "react";

interface SplashScreenProps {
  onLoadingComplete: () => void;
}

export default function PharaonicSplashScreen({ onLoadingComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // محاكاة تدفق الرمال الذهبية لتحميل أصول الخريطة الإيزومترية
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 100) {
          clearInterval(timer);
          setIsFading(true);
          setTimeout(() => {
            onLoadingComplete();
          }, 800); // وقت التأثير البصري للاختفاء
          return 100;
        }
        // زيادة تدريجية تحاكي تحميل الملفات
        return oldProgress + Math.floor(Math.random() * 15) + 5;
      });
    }, 250);

    return () => clearInterval(timer);
  }, [onLoadingComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-8 transition-opacity duration-700 ${
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{
        backgroundImage: `linear-gradient(rgba(30, 10, 40, 0.65), rgba(15, 5, 20, 0.85)), url('/kingdom-farm (1)_4.jpg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#1a0826", // خلفية أرجوانية ملكية احتياطية
      }}
    >
      {/* الجزء العلوي: الشعار الملكي ومفتاح الحياة */}
      <div className="flex flex-col items-center mt-10 animate-pulse">
        <div className="text-6xl mb-2 text-yellow-400 drop-shadow-[0_0_15px_rgba(255,215,0,0.8)]">
          ☥
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-500 to-yellow-200 tracking-wider drop-shadow-lg text-center">
          Pi Kingdom Farm
        </h1>
        <p className="text-amber-200 text-sm md:text-base mt-2 font-semibold tracking-widest uppercase">
          البوابة الملكية لإدارة الأراضي والمواشي
        </p>
      </div>

      {/* الجزء الأوسط: أجنحة الذهب والرمز */}
      <div className="flex items-center justify-center my-auto">
        <div className="relative flex items-center justify-center w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-amber-500/50 bg-black/40 backdrop-blur-sm shadow-[0_0_30px_rgba(245,158,11,0.4)]">
          <span className="text-5xl md:text-7xl text-amber-400 drop-shadow-[0_0_10px_#f59e0b]">
            𓅃
          </span>
        </div>
      </div>

      {/* الجزء السفلي: شريط الرمال الذهبية */}
      <div className="w-full max-w-md flex flex-col items-center mb-10">
        <div className="w-full flex justify-between text-amber-300 text-xs md:text-sm font-bold mb-2 px-1">
          <span>جاري تحميل الخريطة الإيزومترية...</span>
          <span>{Math.min(progress, 100)}%</span>
        </div>
        <div className="w-full h-4 bg-purple-950/80 rounded-full overflow-hidden border-2 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.3)] p-0.5">
          <div
            className="h-full bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-200 rounded-full transition-all duration-300 relative overflow-hidden"
            style={{ width: `${Math.min(progress, 100)}%` }}
          >
            {/* تأثير لمعان الرمال */}
            <div className="absolute inset-0 bg-white/20 animate-[pulse_1s_infinite]"></div>
          </div>
        </div>
        <p className="text-gray-300 text-xs mt-3 text-center opacity-80">
          مدعوم باقتصاد Web3 وشبكة Pi Network
        </p>
      </div>
    </div>
  );
}