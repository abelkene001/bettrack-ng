// app/page.tsx
"use client";
import { useContext, useEffect } from "react";
import Link from "next/link";
import { TelegramContext } from "../components/TelegramProvider";

export default function HomePage() {
  const { webApp } = useContext(TelegramContext);

  useEffect(() => {
    if (!webApp) return;
    webApp.MainButton.setText("Become a Tipster");
    webApp.MainButton.show();
    webApp.MainButton.onClick(() => {
      webApp.hapticFeedback?.impactOccurred("light");
      window.location.href = "/tipster";
    });
  }, [webApp]);

  return (
    <main className="flex flex-col gap-4">
      <header className="card">
        <h1 className="text-2xl font-bold">BetTrack NG</h1>
        <p className="text-white/70 text-sm">
          Buy & sell premium betting tickets inside Telegram.
        </p>
      </header>

      <section className="card">
        <h2 className="mb-2 text-xl font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-3">
          <Link href="/tipster" className="btn-primary text-center">
            🎯 Create / Edit Tipster Profile
          </Link>
          <Link href="/browse" className="btn-secondary text-center">
            🔎 Browse Tipsters
          </Link>
          <Link href="/tickets" className="btn-secondary text-center">
            🎫 My Tickets
          </Link>
        </div>
        <p className="mt-3 text-xs text-white/60">
          Tip: In Telegram, tap the blue main button at the bottom to jump to
          Tipster Profile.
        </p>
      </section>
    </main>
  );
}
