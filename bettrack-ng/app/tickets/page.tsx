// app/tickets/page.tsx
"use client";

import { useEffect, useState } from "react";
import TicketCard from "../../components/TicketCard";

type TicketRow = {
  id: string;
  type: "free" | "premium";
  title: string;
  description: string | null;
  total_odds: number | null;
  bookmaker: "bet9ja" | "sportybet" | "1xbet" | "betking" | "other" | null;
  confidence_level: number | null;
  match_details: unknown;
  booking_code: string | null;
  status: "pending" | "won" | "lost";
  posted_at: string;
  tipster: {
    display_name: string;
    profile_photo_url: string | null;
    is_verified: boolean;
  } | null;
};

export default function TicketsPage() {
  const [items, setItems] = useState<TicketRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch("/api/tickets/recent?limit=20", {
          cache: "no-store",
        });
        if (!res.ok) {
          setErr(`Failed to load (${res.status})`);
          setLoading(false);
          return;
        }
        const json = (await res.json()) as {
          ok: boolean;
          items?: TicketRow[];
          error?: string;
        };
        if (!json.ok || !json.items) {
          setErr(json.error || "Failed to load");
        } else {
          setItems(json.items);
        }
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Load failed");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="flex flex-col gap-4">
      <header className="rounded-2xl bg-white/5 p-4 shadow-sm">
        <h1 className="text-lg font-semibold">Recent Tickets</h1>
        <p className="text-xs text-white/60">FREE tickets show full details.</p>
      </header>

      {loading && <div className="rounded-2xl bg-white/5 p-4">Loading…</div>}
      {err && (
        <div className="rounded-2xl bg-red-500/20 p-3 text-sm text-red-200">
          {err}
        </div>
      )}

      <section className="space-y-3">
        {items.map((t) => (
          <TicketCard key={t.id} t={t} />
        ))}
        {!loading && items.length === 0 && (
          <div className="rounded-2xl bg-white/5 p-4 text-sm text-white/70">
            No tickets yet.
          </div>
        )}
      </section>

      <div className="pb-20" />
    </main>
  );
}
