"use client";

import { useEffect, type ReactNode } from "react";
import { PiAuthProvider, usePiAuth } from "@/contexts/auth-context";
import { AuthLoadingScreen } from "./auth-loading-screen";

// Development mode disabled — always run real Pi Network authentication
const ENABLE_DEV_MODE = false;

function AppContent({ children }: { children: ReactNode }) {
  const { isLoading  } = usePiAuth();

  // إذا كان التطبيق ما زال يحمل بيانات Pi، اعرض شاشة التحميل
  if (isLoading ) {
    return <AuthLoadingScreen />;
  }

  // بعد انتهاء التحميل، اعرض اللعبة بشكل طبيعي
  return <>{children}</>;
}

export function AppWrapper({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Dev mode is disabled — never set the global flag
    if (ENABLE_DEV_MODE) {
      (window as any).__DEV_MODE__ = true;
      console.log("[v0] Development mode enabled");
    }
  }, []);

  return (
    <PiAuthProvider>
      <AppContent>{children}</AppContent>
    </PiAuthProvider>
  );
}