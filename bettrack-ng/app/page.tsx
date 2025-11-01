"use client";
import { useContext, useEffect, useState } from "react";
import { TelegramContext } from "../components/TelegramProvider";

export default function HomePage() {
  const { webApp, userName, colorScheme, sessionReady } = useContext(TelegramContext);
  const [simMsg, setSimMsg] = useState("");
  const insideTelegram = Boolean(webApp);

  useEffect(() => {
    if (!webApp) return;
    webApp.MainButton.setText("Get Started");
    webApp.MainButton.show();
    webApp.MainButton.onClick(() => {
      webApp.hapticFeedback?.impactOccurred("light");
      alert(`Session ready: ${sessionReady ? "YES" : "NO"}`);
    });
  }, [webApp, sessionReady]);

  async function simulateDevLogin() {
    const res = await fetch("/api/telegram/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ devUser: { id: 999001, name: "Local Dev", username: "dev_local" } }),
    });
    const data = await res.json();
    setSimMsg(data?.ok ? "✅ Simulated login OK. Refresh the page." : `❌ ${data?.error || "unknown"}`);
  }

  return (
    <main className="flex min-h-[80vh] flex-col gap-4">
      <header className="card">
        <h1 className="text-2xl font-bold">BetTrack NG</h1>
        <p className="text-white/70">Telegram Mini App • Next.js • Tailwind • Supabase</p>
      </header>

      <section className="card">
        <div className="text-sm text-white/60">Theme</div>
        <div className="text-lg font-semibold capitalize">{colorScheme}</div>
      </section>

      <section className="card">
        <div className="text-sm text-white/60">Welcome</div>
        <div className="text-lg font-semibold">{insideTelegram ? userName : "Guest"}</div>
      </section>

      {!insideTelegram && (
        <section className="card">
          <button onClick={simulateDevLogin} className="btn-primary">Simulate Telegram Login (Dev)</button>
          {simMsg && <p className="mt-2 text-sm text-white/80">{simMsg}</p>}
        </section>
      )}

      <section className="card">
        <h2 className="mb-2 text-xl font-semibold">Status</h2>
        <ul className="list-inside list-disc text-white/80">
          <li>Next.js + Tailwind running</li>
          <li>Telegram SDK loaded {insideTelegram ? "✅" : "❌"}</li>
          <li>App session (cookie) set {sessionReady ? "✅" : "❌"}</li>
        </ul>
      </section>
    </main>
  );
}
