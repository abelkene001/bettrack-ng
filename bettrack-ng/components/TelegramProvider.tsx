"use client";

import Script from "next/script";
import React, { createContext, useMemo, useState } from "react";

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

  const onScriptReady = () => {
    // @ts-expect-error - Telegram WebApp is loaded from external script
    const tg: TG | undefined = globalThis?.Telegram?.WebApp;
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

    if (tg.initData) {
      // Don't await - fire and forget
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

  const value = useMemo(
    () => ({ webApp, userName, colorScheme, sessionReady }),
    [webApp, userName, colorScheme, sessionReady]
  );

  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="afterInteractive"
        onReady={onScriptReady}
      />
      <TelegramContext.Provider value={value}>
        {children}
      </TelegramContext.Provider>
    </>
  );
}
