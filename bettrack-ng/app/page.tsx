"use client";

import { useContext, useEffect } from "react";
import { TelegramContext } from "@/components/TelegramProvider";

export default function HomePage() {
  const { webApp, userName, colorScheme } = useContext(TelegramContext);

  // Configure Telegram MainButton
  useEffect(() => {
    if (!webApp) return;

    webApp.MainButton.setText("Get Started");
    webApp.MainButton.show();
    webApp.MainButton.onClick(() => {
      webApp.hapticFeedback?.impactOccurred("light");
      alert("Mini App is connected. We will set up Supabase & data next.");
    });
  }, [webApp]);

  const insideTelegram = Boolean(webApp);

  return (
    <main className="flex min-h-[80vh] flex-col gap-4">
      <header className="card">
        <h1 className="text-2xl font-bold">BetTrack NG</h1>
        <p className="text-white/70">
          Telegram Mini App • Next.js • Tailwind • Supabase
        </p>
      </header>

      <section className="card">
        <div className="text-sm text-white/60">Theme</div>
        <div className="text-lg font-semibold capitalize">{colorScheme}</div>
      </section>

      <section className="card">
        <div className="text-sm text-white/60">Welcome</div>
        <div className="text-lg font-semibold">
          {insideTelegram ? userName : "Guest"}
        </div>
        {!insideTelegram && (
          <p className="mt-2 text-sm text-white/60">
            Telegram SDK not detected. Open this app from your Telegram bot to
            see your name & use the MainButton.
          </p>
        )}
      </section>

      <section className="card">
        <h2 className="mb-2 text-xl font-semibold">Status</h2>
        <ul className="list-inside list-disc text-white/80">
          <li>Next.js + Tailwind running</li>
          <li>Telegram SDK loaded {insideTelegram ? "✅" : "❌"}</li>
          <li>Supabase client wired (RLS setup comes later)</li>
        </ul>
      </section>

      <footer className="text-center text-xs text-white/40">
        © {new Date().getFullYear()} BetTrack NG
      </footer>
    </main>
  );
}
