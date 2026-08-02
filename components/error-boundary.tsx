// components/error-boundary.tsx
"use client"; // تحديد أن هذا المكون يعمل بالكامل لدى العميل فقط لضمان عمل useEffect والوصول لكائن window

import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("[v0] Global Error:", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        timestamp: new Date().toISOString()
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("[v0] Unhandled Promise Rejection:", {
        reason: event.reason,
        promise: event.promise,
        timestamp: new Date().toISOString()
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return <>{children}</>;
}