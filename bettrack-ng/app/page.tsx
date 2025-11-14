// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import TicketCard, { type TicketCardData } from "@/components/TicketCard";

type FeedResponse =
  | { ok: true; items: TicketCardData[] }
  | { ok: false; error: string };

export default function HomePage() {
  const [items, setItems] = useState<TicketCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch("/api/tickets/recent", { cache: "no-store" });
        const json = (await res.json()) as FeedResponse;
        if (!json.ok) throw new Error(json.error);
        if (!cancelled) setItems(json.items);
      } catch (e) {
        if (!cancelled) setErr((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#0b0f10] px-4 py-4">
      <header className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold">Home</div>
        {/* Put your SVG bell icon here if you want */}
      </header>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-3xl bg-white/10" />
          ))}
        </div>
      )}

      {!loading && err && <div className="rounded-xl bg-red-500/15 p-3 text-red-200">{err}</div>}

      {!loading && !err && (
        <div className="space-y-4">
          {items.map((item) => (
            <TicketCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </main>
  );
}
