"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { PI_NETWORK_CONFIG } from "@/lib/system-config";
import { setPiSdk, setCachedPiUid } from "@/lib/pi-direct-payment";
import type {
  Product,
  SDKLiteInstance,
  UserPurchaseBalance,
} from "@/lib/sdklite-types";

const COMMUNICATION_REQUEST_TYPE = '@pi:app:sdk:communication_information_request';

function isInIframe(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    return window.self !== window.top;
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === 'SecurityError' || error.code === DOMException.SECURITY_ERR || error.code === 18)
    ) {
      return true;
    }
    if (error instanceof Error && /Permission denied/i.test(error.message)) {
      return true;
    }

    console.error("[v0] Error checking iframe status:", error);
    return false;
  }
}

function parseJsonSafely(value: any): any {
  try {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (parseError) {
        console.error("[v0] Error parsing JSON:", parseError);
        return null;
      }
    }
    return typeof value === 'object' && value !== null ? value : null;
  } catch (error) {
    console.error("[v0] Error in parseJsonSafely:", error);
    return null;
  }
}

/**
 * Clear any locally cached Pi auth/session state from localStorage.
 *
 * The Pi Network SDK caches auth server-side, which can cause Pi.authenticate()
 * to skip the permissions screen and leave the session without the "payments"
 * scope (→ "Cannot create a payment without payments scope").
 *
 * Removing Pi-related keys forces the SDK to re-run the permissions prompt
 * so the user can consent to the requested scopes again.
 */
function clearPiAuthState(): void {
  try {
    if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
      return;
    }
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      const lower = key.toLowerCase();
      // Match any key that looks Pi/session/auth related without being too broad.
      if (
        lower.includes("pi") ||
        lower.includes("minepi") ||
        lower.includes("auth") ||
        lower.includes("session") ||
        lower.includes("accesstoken") ||
        lower.includes("access_token")
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => window.localStorage.removeItem(key));
    if (keysToRemove.length > 0) {
      console.log("[PiAuth] Cleared Pi-related localStorage keys:", keysToRemove);
    } else {
      console.log("[PiAuth] No Pi-related localStorage keys to clear");
    }
  } catch (e) {
    console.error("[PiAuth] Failed to clear Pi auth state:", e);
  }
}

function requestParentCredentials(): Promise<{ accessToken: string; appId: string | null } | null> {
  try {
    if (!isInIframe()) {
      return Promise.resolve(null);
    }

    const requestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const timeoutMs = 1500;

    return new Promise((resolve) => {
      try {
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        const cleanup = (listener: (event: MessageEvent) => void) => {
          try {
            window.removeEventListener('message', listener);
            if (timeoutId !== null) {
              clearTimeout(timeoutId);
            }
          } catch (cleanupError) {
            console.error("[v0] Error in cleanup:", cleanupError);
          }
        };

        const messageListener = (event: MessageEvent) => {
          try {
            if (event.source !== window.parent) {
              return;
            }

            const data = parseJsonSafely(event.data);
            if (!data || data.type !== COMMUNICATION_REQUEST_TYPE || data.id !== requestId) {
              return;
            }

            cleanup(messageListener);

            const payload = typeof data.payload === 'object' && data.payload !== null ? data.payload : {};
            const accessToken = typeof payload.accessToken === 'string' ? payload.accessToken : null;
            const appId = typeof payload.appId === 'string' ? payload.appId : null;

            resolve(accessToken ? { accessToken, appId } : null);
          } catch (listenerError) {
            console.error("[v0] Error in messageListener:", listenerError);
            cleanup(messageListener);
            resolve(null);
          }
        };

        timeoutId = setTimeout(() => {
          try {
            cleanup(messageListener);
            resolve(null);
          } catch (timeoutError) {
            console.error("[v0] Error in timeout handler:", timeoutError);
            resolve(null);
          }
        }, timeoutMs);

        window.addEventListener('message', messageListener);

        window.parent.postMessage(
          JSON.stringify({
            type: COMMUNICATION_REQUEST_TYPE,
            id: requestId
          }),
          '*'
        );
      } catch (err) {
        console.error("[v0] Error in promise setup:", err);
        resolve(null);
      }
    });
  } catch (e) {
    console.error("[v0] Error in requestParentCredentials:", e);
    return Promise.resolve(null);
  }
}

interface PiAuthContextType {
  isAuthenticated: boolean;
  authMessage: string;
  hasError: boolean;
  /** سجل خطوات التهيئة — يظهر في لوحة التشخيص لمعرفة أي طبقة علّقت/فشلت */
  diag: string[];
  sdk: SDKLiteInstance | null;
  products: Product[] | null;
  restoredPurchases: UserPurchaseBalance[] | null;
  reinitialize: () => Promise<void>;
  isLoading: boolean;
  user: { username: string; id: string; roles?: string[] } | null;
  login: () => Promise<void>;
  logout: () => void;
}

const PiAuthContext = createContext<PiAuthContextType | undefined>(undefined);

const loadPiSDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }
    if (typeof (window as any).Pi !== "undefined") {
      resolve();
      return;
    }

    const script = document.createElement("script");
    if (!PI_NETWORK_CONFIG.SDK_URL) {
      reject(new Error("SDK URL is not set"));
      return;
    }
    script.src = PI_NETWORK_CONFIG.SDK_URL;
    script.async = true;

    script.onload = () => {
      console.log("Pi SDK script loaded successfully");
      resolve();
    };

    script.onerror = () => {
      console.error("Failed to load Pi SDK script");
      reject(new Error("Failed to load Pi SDK script"));
    };

    document.head.appendChild(script);
  });
};

const loadSDKLite = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }
    if (typeof (window as any).SDKLite !== "undefined") {
      resolve();
      return;
    }

    const script = document.createElement("script");
    if (!PI_NETWORK_CONFIG.SDK_LITE_URL) {
      reject(new Error("SDKLite URL is not set"));
      return;
    }
    script.src = PI_NETWORK_CONFIG.SDK_LITE_URL;
    script.async = true;

    script.onload = () => {
      console.log("SDKLite script loaded successfully");
      resolve();
    };

    script.onerror = () => {
      console.error("Failed to load SDKLite script");
      reject(new Error("Failed to load SDKLite script"));
    };

    document.head.appendChild(script);
  });
};

export function PiAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMessage, setAuthMessage] = useState("Initializing Pi Network...");
  const [hasError, setHasError] = useState(false);
  const [sdk, setSdk] = useState<SDKLiteInstance | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [restoredPurchases, setRestoredPurchases] = useState<UserPurchaseBalance[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ username: string; id: string; roles?: string[] } | null>(null);
  const [diag, setDiag] = useState<string[]>([]);
  const pushDiag = (line: string) => {
    const stamp = new Date().toLocaleTimeString();
    setDiag((prev) => [...prev.slice(-40), `[${stamp}] ${line}`]);
  };

const fetchProducts = async (sdkInstance: SDKLiteInstance): Promise<void> => {
    try {
      const { products } = await sdkInstance.state.products();
      setProducts(products);
    } catch (e) {
      console.error("Failed to load products:", e);
      setProducts([]);
    }
  };

  const initialize = async () => {
    console.log("[PiAuth] Initialize called");
    pushDiag("بدء تهيئة باي...");
    setIsLoading(true);
    setHasError(false);
    setRestoredPurchases(null);
    
    try {
      console.log("[PiAuth] Probing for parent credentials");
      const parentCredentials = await requestParentCredentials();
      if (parentCredentials) {
        console.log("[PiAuth] Parent credentials found");
        pushDiag("وصلت بيانات الأب (App Studio) ✅");
      } else {
        console.log("[PiAuth] No parent credentials, attempting Pi SDK");
        pushDiag("لا توجد بيانات من الأب — بيئة مستقلة");
      }

      // ------------------------------------------------------------
      // PRIMARY — SDKLite (Pi App Studio). SDKLite owns auth and the
      // payment UI in App Studio, so it is initialized first and
      // registered with payWithPi() for sdk.makePurchase(productSlug).
      // ------------------------------------------------------------
      let sdkInstance: any = null;
      try {
        setAuthMessage("Loading SDKLite...");
        await loadSDKLite();
        setAuthMessage("Initializing SDKLite...");
        sdkInstance = await (window as any).SDKLite.init();
        setPiSdk(sdkInstance);
        setSdk(sdkInstance);
        console.log("[PiAuth] SDKLite initialized");
        pushDiag("SDKLite.init نجح — مسار App Studio جاهز ✅");
      } catch (sdkErr: any) {
        console.warn("[PiAuth] SDKLite init failed (non-fatal in Pi Browser mode):", sdkErr);
        pushDiag(`SDKLite.init فشل ❌: ${sdkErr?.message || String(sdkErr)}`);
      }

      // ------------------------------------------------------------
      // SECONDARY — Legacy Pi SDK v2 (Pi Browser classic apps).
      // Authentication happens HERE at app entry — never at click time —
      // so the permissions screen is granted once and Pi.createPayment()
      // opens the wallet immediately inside the click handler.
      // ------------------------------------------------------------
      let legacyAuthOk = false;
      try {
        setAuthMessage("Loading Pi SDK...");
        await loadPiSDK();
        setAuthMessage("Initializing Pi Network...");
        const piInstance = (window as any).Pi;
        console.log("[PiAuth] Pi.init() config:", {
          version: "2.0",
          sandbox: PI_NETWORK_CONFIG.SANDBOX,
          appId: PI_NETWORK_CONFIG.APP_ID,
          origin: typeof window !== "undefined" ? window.location.origin : "server",
          piAppId: typeof window !== "undefined" ? (piInstance as any)?.getAppId?.() : "N/A",
        });
        if (piInstance && typeof piInstance.init === "function") {
          await piInstance.init({
            version: "2.0",
            sandbox: PI_NETWORK_CONFIG.SANDBOX,
            appId: PI_NETWORK_CONFIG.APP_ID,
          });
          console.log("[PiAuth] Pi.init() succeeded, appId:", (piInstance as any)?.getAppId?.() ?? "N/A");
          pushDiag("Pi.init نجح ✅ (window.Pi متاح)");
        }
        if (piInstance && typeof piInstance.authenticate === "function") {
          // Strictly request the scopes required by Pi.createPayment().
          const piScopes: string[] = ["username", "payments"];
          const onIncompletePayment = (payment: any) => {
            console.log("Incomplete payment found, recovering via backend:", payment);
            const paymentId = payment?.payment?.id || payment?.paymentId;
            const txid = payment?.transaction?.txid || payment?.txid;
            if (paymentId) {
              (async () => {
                try {
                  await fetch("/api/auth/pi", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: "complete",
                      paymentId,
                      txid: txid || "",
                    }),
                  });
                  console.log("[PiAuth] Incomplete payment completed via backend:", paymentId);
                } catch (e) {
                  console.error("[PiAuth] Incomplete payment recovery failed:", e);
                }
              })();
            }
          };

          // Keep a valid session that already granted the "payments" scope.
          // Only reset a STALE session that lacks it, so the permissions
          // screen can re-appear and grant the missing scope.
          const scopesOk =
            piInstance.authenticated === true &&
            Array.isArray(piInstance.consentedScopes) &&
            piInstance.consentedScopes.includes(piScopes[1]);

          if (scopesOk) {
            legacyAuthOk = true;
            console.log("[PiAuth] Valid Pi session present (payments scope granted)");
            pushDiag("جلسة Pi موجودة بها صلاحية payments ✅");
          } else {
            if (piInstance.authenticated && typeof piInstance.signOut === "function") {
              try {
                const signOutResult = piInstance.signOut();
                if (signOutResult && typeof signOutResult.then === "function") {
                  await signOutResult;
                }
                console.log("[PiAuth] Stale session reset via Pi.signOut()");
              } catch (signOutError) {
                console.error("[PiAuth] Pi.signOut() failed (non-fatal):", signOutError);
              }
            }
            setAuthMessage("Authenticating with Pi Network...");
            const authResult = await piInstance.authenticate(piScopes, onIncompletePayment);
            if (!authResult?.accessToken) {
              throw new Error("Pi Network authentication failed - no access token returned");
            }
            legacyAuthOk = true;
            console.log("[PiAuth] Pi.authenticate() succeeded with scopes:", piScopes);
            pushDiag("Pi.authenticate نجح ✅ — تم منح صلاحية الدفع");

            // Backend session validation with /api/auth/pi as required by Pi App Studio.
            try {
              await fetch("/api/auth/pi", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "auth", accessToken: authResult.accessToken }),
              });
            } catch (backendError) {
              console.warn("[PiAuth] Backend token verification failed:", backendError);
            }
          }

          // Cache the uid synchronously so payWithPi() never awaits it in a click.
          if (typeof piInstance.user?.getMe === "function") {
            try {
              const userInfo = await piInstance.user.getMe();
              if (userInfo?.uid) setCachedPiUid(userInfo.uid);
              if (userInfo?.username) {
                setUser({
                  username: userInfo.username,
                  id: userInfo.uid || "pi-user-" + Math.random().toString(36).slice(2, 9),
                });
              }
            } catch (userInfoError) {
              console.error("[PiAuth] Failed to get user info:", userInfoError);
            }
          }
        }
      } catch (legacyErr: any) {
        console.warn("[PiAuth] Legacy Pi v2 init/authenticate failed (non-fatal):", legacyErr);
        pushDiag(`Pi v2 (Pi Browser) فشل ❌: ${legacyErr?.message || String(legacyErr)}`);
      }

      if (!sdkInstance && !legacyAuthOk) {
        pushDiag("لا توجد أي طبقة دفع متاحة ❌");
        throw new Error("Pi authentication unavailable — open the app inside Pi App Studio or the Pi Browser");
      }

      setIsAuthenticated(true);
      pushDiag(sdkInstance ? "تم الدخول — الدفع جاهز عبر App Studio/SDKLite ✅" : "تم الدخول — الدفع جاهز عبر Pi v2 ✅");
      console.log("[PiAuth] Authentication successful:", {
        sdkLite: !!sdkInstance,
        legacyV2: legacyAuthOk,
        appId: PI_NETWORK_CONFIG.APP_ID,
        origin: typeof window !== "undefined" ? window.location.origin : "N/A",
      });

      if (sdkInstance) {
        try {
          await fetchProducts(sdkInstance);
        } catch (productsError) {
          console.error("[PiAuth] Failed to load products:", productsError);
        }
        try {
          const { purchases } = await sdkInstance.state.restore();
          setRestoredPurchases(purchases);
          console.log("[PiAuth] Purchases restored", purchases);
        } catch (e) {
          console.error("[PiAuth] Failed to restore purchases:", e);
          setRestoredPurchases([]);
        }
      }
    } catch (err) {
      const piInstance = (window as any).Pi;
      console.error("[PiAuth] SDKLite initialization failed:", err);
      
      const errorDetails = {
        appId: PI_NETWORK_CONFIG.APP_ID,
        origin: typeof window !== "undefined" ? window.location.origin : "N/A",
        sandbox: PI_NETWORK_CONFIG.SANDBOX,
        callbackUrl: PI_NETWORK_CONFIG.CALLBACK_URL,
        piAvailable: typeof window !== "undefined" && !!(window as any).Pi,
        sdkLiteAvailable: typeof window !== "undefined" && !!(window as any).SDKLite,
        errorType: err instanceof Error ? err.name : typeof err,
        errorMessage: err instanceof Error ? err.message : String(err),
        errorStack: err instanceof Error ? err.stack : "N/A",
        pi_getAppId: typeof window !== "undefined" && (piInstance as any)?.getAppId ? (piInstance as any).getAppId() : "N/A",
      };
      
      console.error("[PiAuth] Full Error Debug Info:", errorDetails);

      if (PI_NETWORK_CONFIG.ENABLE_MOCK_MODE) {
        console.warn("[PiAuth] Enabling Mock Mode - game will run with demo data");
        setIsAuthenticated(true);
        setAuthMessage("Running in Mock Mode (Demo)");
        setUser({
          username: "Demo User",
          id: "mock-user-demo",
        });
        setIsLoading(false);
        return;
      }

      setHasError(true);
      setAuthMessage(
        err instanceof Error
          ? err.message
          : "Authentication failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("[PiAuth] Provider mounted - initializing in background");
    
    const initPromise = initialize();
    
    const timeout = setTimeout(() => {
      console.log("[PiAuth] Auth initialization timeout (30s) - continuing with guest mode");
      setIsLoading(false);
    }, 130000);
    
    initPromise.finally(() => {
      clearTimeout(timeout);
      console.log("[PiAuth] Auth initialization completed");
    });
  }, []);

  const logout = () => {
    console.log("[PiAuth] Logging out...");
    try {
      if (typeof window !== "undefined") {
        const clearPiKeys = (storage: Storage) => {
          const keysToRemove: string[] = [];
          for (let i = 0; i < storage.length; i += 1) {
            const key = storage.key(i);
            if (!key) continue;
            const lower = key.toLowerCase();
            if (
              lower.includes("pi") ||
              lower.includes("minepi") ||
              lower.includes("auth") ||
              lower.includes("session") ||
              lower.includes("accesstoken") ||
              lower.includes("access_token") ||
              lower.includes("sdk")
            ) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach((k) => storage.removeItem(k));
          if (keysToRemove.length > 0) {
            console.log("[PiAuth] Cleared storage keys:", keysToRemove);
          }
        };
        clearPiKeys(window.localStorage);
        try {
          clearPiKeys(window.sessionStorage);
        } catch (sessionErr) {
          console.error("[PiAuth] Failed to clear sessionStorage:", sessionErr);
        }
      }

      setIsAuthenticated(false);
      setUser(null);
      setSdk(null);
      setProducts(null);
      setRestoredPurchases(null);
      setHasError(false);
      setAuthMessage("Signed out");

      const piInstance = (window as any)?.Pi;
      if (piInstance && typeof piInstance.signOut === "function") {
        try {
          const signOutResult = piInstance.signOut();
          if (signOutResult && typeof signOutResult.then === "function") {
            signOutResult.then(
              () => console.log("[PiAuth] Pi.signOut() succeeded"),
              (signOutErr: unknown) =>
                console.error("[PiAuth] Pi.signOut() failed:", signOutErr)
            );
          } else {
            console.log("[PiAuth] Pi.signOut() called synchronously");
          }
        } catch (signOutError) {
          console.error("[PiAuth] Pi.signOut() threw:", signOutError);
        }
      } else {
        console.log("[PiAuth] window.Pi.signOut not available");
      }

      setTimeout(() => {
        window.location.reload();
      }, 0);
    } catch (logoutError) {
      console.error("[PiAuth] Logout failed:", logoutError);
      window.location.reload();
    }
  };

  const value: PiAuthContextType = {
    isAuthenticated,
    authMessage,
    hasError,
    diag,
    sdk,
    products,
    restoredPurchases,
    reinitialize: initialize,
    isLoading,
    user: user || {
      username: "مرحبا بك",
      id: "guest-" + Math.random().toString(36).slice(2, 9)
    },
    login: initialize,
    logout,
  };

  return (
    <PiAuthContext.Provider value={value}>{children}</PiAuthContext.Provider>
  );
}

export function usePiAuth() {
  const context = useContext(PiAuthContext);
  if (context === undefined) {
    throw new Error("usePiAuth must be used within a PiAuthProvider");
  }
  return context;
}