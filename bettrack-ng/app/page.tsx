// app/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import TicketCard, { TicketCardModel } from "../components/TicketCard";

export default function HomePage() {
  const router = useRouter();
  const [feed, setFeed] = useState<TicketCardModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/tickets/recent");
        const json = await res.json();
        if (json?.ok && Array.isArray(json.items)) {
          setFeed(json.items);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <AppShell title="Home" showPostButton={true}>
      {loading ? (
        <div className="text-white/70">Loading…</div>
      ) : feed.length === 0 ? (
        <div className="text-white/70">No tickets yet.</div>
      ) : (
        <div className="space-y-3">
          {feed.map((t) => (
            <TicketCard
              key={t.id}
              t={t}
              onOpenTicket={(id) => router.push(`/t/${id}`)}
              onOpenTipster={(uid) => router.push(`/u/${uid}`)}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
