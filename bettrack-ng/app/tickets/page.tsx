// app/tickets/page.tsx
"use client";

import { useEffect, useState } from "react";
import TopTabs from "../../components/TopTabs";
import TicketCard from "../../components/TicketCard";
import { useRouter } from "next/navigation";

type Role = "tipster" | "bettor" | "both";
type Status = "all" | "pending" | "won" | "lost";
type Range = "7" | "30" | "all";
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

export default function TicketsDashboard() {
  const [role, setRole] = useState<Role>("bettor");
  const [mode, setMode] = useState<"bettor" | "tipster">("bettor"); // which list we show
  const [status, setStatus] = useState<Status>("all");
  const [range, setRange] = useState<Range>("7");

  const [items, setItems] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const router = useRouter();

  // Load role on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/profile/me", { cache: "no-store" });
        const ctype = res.headers.get("content-type") || "";
        if (ctype.includes("application/json")) {
          const json = (await res.json()) as
            | { ok: true; user: { role?: Role } }
            | { ok: false; error: string };
          if ("ok" in json && json.ok && json.user?.role) {
            setRole(json.user.role);
            if (json.user.role === "tipster" || json.user.role === "both") {
              setMode("bettor"); // default still bettor view; user can switch
            }
          }
        }
      } catch {
        // keep default "bettor"
      }
    })();
  }, []);

  // Load list based on filters
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const params = new URLSearchParams();
        params.set("mode", mode);
        params.set("status", status);
        params.set("range", range);

        const res = await fetch(`/api/tickets/mine?${params.toString()}`, {
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
        else setItems(json.items);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Load failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [mode, status, range]);

  const canSwitch = role === "tipster" || role === "both";

  return (
    <main className="flex flex-col gap-4 p-4 pb-20">
      <TopTabs
        status={status}
        onStatusChange={setStatus}
        range={range}
        onRangeChange={setRange}
        showTipsterSwitch={canSwitch}
        mode={mode}
        onModeToggle={canSwitch ? setMode : undefined}
      />

      {loading && <div className="rounded-2xl bg-white/5 p-4">Loading…</div>}
      {err && (
        <div className="rounded-2xl bg-red-500/20 p-3 text-sm text-red-200">
          {err}
        </div>
      )}

      <section className="space-y-3">
        {items.map((t) => (
          <TicketCard
            key={t.id}
            t={t}
            onClick={() => router.push(`/t/${t.id}`)}
          />
        ))}

        {!loading && items.length === 0 && (
          <div className="rounded-2xl bg-white/5 p-4 text-sm text-white/70">
            Nothing here yet for this filter.
          </div>
        )}
      </section>
    </main>
  );
}
