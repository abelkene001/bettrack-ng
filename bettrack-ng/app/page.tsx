// app/page.tsx
"use client";

import { useContext, useEffect, useState } from "react";
import TicketCard from "../components/TicketCard";
import HeaderBar from "../components/HeaderBar";
import SidebarDrawer from "../components/SidebarDrawer";
import { TelegramContext } from "../components/TelegramProvider";

type Role = "tipster" | "bettor" | "both";
type Bookmaker = "bet9ja" | "sportybet" | "1xbet" | "betking" | "other";

type TicketRow = {
  id: string;
  type: "free" | "premium";
  title: string;
  description: string | null;
  total_odds: number | null;
  bookmaker: Bookmaker | null;
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

export default function HomePage() {
  const { userName } = useContext(TelegramContext);

  const [open, setOpen] = useState(false);
  const [feed, setFeed] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // compute tipster status locally (instead of using context.role)
  const [role, setRole] = useState<Role>("bettor");
  const isTipster = role === "tipster" || role === "both";

  // 1) Load role from server
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/profile/me", { cache: "no-store" });
        const ctype = res.headers.get("content-type") || "";
        if (ctype.includes("application/json")) {
          const json = (await res.json()) as
            | { ok: true; user: { role?: Role }; profile?: unknown }
            | { ok: false; error: string };
          if ("ok" in json && json.ok && json.user?.role) {
            setRole(json.user.role);
          } else {
            // default stays "bettor" if not available
          }
        }
      } catch {
        // ignore; keep default "bettor"
      }
    })();
  }, []);

  // 2) Load public feed
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch("/api/tickets/recent?limit=30", {
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
        if (!json.ok || !json.items) setErr(json.error || "Failed to load");
        else setFeed(json.items);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Load failed");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="flex flex-col pb-20">
      <HeaderBar
        titleLeft={userName || "Guest"}
        onOpenMenu={() => setOpen(true)}
        onBellClick={() => {
          /* notifications later */
        }}
      />

      <SidebarDrawer
        open={open}
        onClose={() => setOpen(false)}
        isTipster={isTipster}
      />

      <div className="p-4 space-y-3">
        {loading && <div className="rounded-2xl bg-white/5 p-4">Loading…</div>}
        {err && (
          <div className="rounded-2xl bg-red-500/20 p-3 text-sm text-red-200">
            {err}
          </div>
        )}

        {!loading && feed.length === 0 && (
          <div className="rounded-2xl bg-white/5 p-4 text-sm text-white/70">
            No tickets yet. Use the menu to post a FREE ticket.
          </div>
        )}

        {feed.map((t) => (
          <TicketCard key={t.id} t={t} />
        ))}
      </div>
    </main>
  );
}
