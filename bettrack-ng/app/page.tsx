"use client";
import { useContext } from "react";
import Link from "next/link";
import { TelegramContext } from "../components/TelegramProvider";

export default function HomePage() {
  const { userName } = useContext(TelegramContext);

  return (
    <main className="flex flex-col gap-4">
      <header className="card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">BetTrack NG</h1>
            <p className="text-white/60 text-sm">
              Welcome, {userName || "Guest"}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-1 text-xs">
            Mini App
          </div>
        </div>
      </header>
    </main>
  );
}
