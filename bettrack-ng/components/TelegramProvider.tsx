"use client";

import Script from "next/script";
import React, { createContext, useEffect, useMemo, useState } from "react";

type TG = {
  initData?: string;
  initDataUnsafe?: {
    user?: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
    };
    themeParams?: Record<string, string>;
  };
  colorScheme?: "light" | "dark";
  expand: () => void;
  ready: () => void;
  hapticFeedback?: {
    impactOccurred: (style: "light" | "medium" | "heavy") => void;
  };
  MainButton: {
    setText: (text: string) => void;
    onClick: (fn: () => void) => void;
    show: () => void;
    hide: () => void;
    isVisible: boolean;
  };
};

type TelegramCtx = {
  webApp: TG | null;
  userName: string;
  colorScheme: "light" | "dark";
  sessionReady: boolean;
  profile?: { name?: string; telegram_id?: string; subscription_tier?: string };
};

export const TelegramContext = createContext<TelegramCtx>({
  webApp: null,
  userName: "Guest",
  colorScheme: "dark",
  sessionReady: false,
});

export default function TelegramProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [webApp, setWebApp] = useState<TG | null>(null);
  const [userName, setUserName] = useState("Guest");
  const [colorScheme, setColorScheme] = useState<"light" | "dark">("dark");
  const [sessionReady, setSessionReady] = useState(false);
  const [profile, setProfile] = useState<TelegramCtx["profile"]>();

  const onScriptReady = () => {
    // ✅ Removed async
    // @ts-expect-error - Telegram WebApp loaded from external script
    const tg: TG | undefined = globalThis?.Telegram?.WebApp; // ✅ Removed (as any)
    if (!tg) {
      setWebApp(null);
      setSessionReady(false);
      return;
    }
    try {
      tg.ready();
      tg.expand();
    } catch {}

    const scheme = tg.colorScheme ?? "dark";
    setColorScheme(scheme);
    document.documentElement.style.setProperty(
      "--tg-bg",
      scheme === "dark" ? "#0b0f10" : "#f7f7f7"
    );
    document.documentElement.style.setProperty(
      "--tg-fg",
      scheme === "dark" ? "#ffffff" : "#0b0f10"
    );

    const first = tg.initDataUnsafe?.user?.first_name ?? "";
    const last = tg.initDataUnsafe?.user?.last_name ?? "";
    const fallback = tg.initDataUnsafe?.user?.username ?? "User";
    const name = first || last ? `${first} ${last}`.trim() : fallback;

    setUserName(name);
    setWebApp(tg);

    // ✅ Changed to .then() instead of await
    if (tg.initData) {
      fetch("/api/telegram/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initDataRaw: tg.initData }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.ok) setSessionReady(true);
        })
        .catch(() => {
          setSessionReady(false);
        });
    }
  };

  // Fetch user profile after session ready
  useEffect(() => {
    if (!sessionReady) return;
    (async () => {
      try {
        const res = await fetch("/api/me/sync");
        const json = await res.json();
        if (json?.ok && json.user) {
          setProfile({
            name: json.user.name,
            telegram_id: json.user.telegram_id,
            subscription_tier: json.user.subscription_tier,
          });
        }
      } catch {
        // ignore
      }
    })();
  }, [sessionReady]);

  const value = useMemo(
    () => ({ webApp, userName, colorScheme, sessionReady, profile }),
    [webApp, userName, colorScheme, sessionReady, profile]
  );

  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="afterInteractive" // ✅ Changed from beforeInteractive
        onReady={onScriptReady}
      />
      <TelegramContext.Provider value={value}>
        {children}
      </TelegramContext.Provider>
    </>
  );
}
