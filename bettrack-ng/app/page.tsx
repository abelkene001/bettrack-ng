// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TicketCard, { TicketCardModel } from "../components/TicketCard";

export default function HomePage() {
  const router = useRouter();
  const [items, setItems] = useState<TicketCardModel[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch("/api/tickets/recent", { cache: "no-store" });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || "failed");
        setItems(json.items as TicketCardModel[]);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Load failed");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <main className="p-4 pb-20">
        <div className="animate-pulse space-y-3">
          <div className="h-12 rounded-2xl bg-white/10" />
          <div className="h-24 rounded-2xl bg-white/10" />
          <div className="h-24 rounded-2xl bg-white/10" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-3 p-4 pb-20">
      {err && (
        <div className="rounded-2xl bg-red-500/20 p-3 text-sm text-red-200">
          {err}
        </div>
      )}

      {items.map((t) => (
        <TicketCard
          key={t.id}
          t={t}
          onOpenTicket={(id) => router.push(`/t/${id}`)}
          onOpenTipster={(uid) => router.push(`/u/${uid}`)}
        />
      ))}

      {!items.length && !err && (
        <div className="rounded-2xl bg-white/5 p-4 text-sm text-white/70">
          No tickets yet. Ask tipsters to post!
        </div>
      )}
    </main>
  );
}
