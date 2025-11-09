// app/t/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Bookmaker = "bet9ja" | "sportybet" | "1xbet" | "betking" | "other";
type Status = "pending" | "won" | "lost";

type MatchRow = { home: string; away: string; pick: string; odds: number };

type TicketDetail = {
  id: string;
  type: "free" | "premium";
  title: string;
  description: string | null;
  total_odds: number | null;
  bookmaker: Bookmaker | null;
  confidence_level: number | null;
  status: Status;
  posted_at: string;
  match_details: MatchRow[] | null;
  booking_code: string | null;
  tipster: {
    display_name: string;
    profile_photo_url: string | null;
    is_verified: boolean;
  } | null;
  purchased: boolean;
};

type DetailResponse =
  | { ok: true; ticket: TicketDetail }
  | { ok: false; error: string };

export default function TicketDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [t, setT] = useState<TicketDetail | null>(null);

  const router = useRouter();

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`/api/tickets/${id}`, { cache: "no-store" });
        const ctype = res.headers.get("content-type") || "";
        if (!ctype.includes("application/json")) {
          setErr(`Server returned non-JSON (${res.status})`);
          setLoading(false);
          return;
        }
        const json: DetailResponse = await res.json();
        if (!json.ok) setErr(json.error || "Failed to load");
        else setT(json.ticket);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Load failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <main className="flex flex-col gap-4 p-4 pb-20">
      <header className="rounded-2xl bg-white/5 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="rounded-lg bg-white/10 px-3 py-2 text-xs"
          >
            ← Back
          </button>
          <div className="text-sm font-semibold">Ticket</div>
          <div className="w-16" />
        </div>
      </header>

      {loading && <div className="rounded-2xl bg-white/5 p-4">Loading…</div>}
      {err && (
        <div className="rounded-2xl bg-red-500/20 p-3 text-sm text-red-200">
          {err}
        </div>
      )}

      {t && (
        <section className="space-y-3">
          <article className="rounded-2xl bg-white/5 p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              {t.tipster?.profile_photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={t.tipster.profile_photo_url}
                  alt="Tipster"
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-white/10" />
              )}
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">
                  {t.tipster?.display_name || "Tipster"}
                  {t.tipster?.is_verified && (
                    <span className="ml-2 rounded bg-white/10 px-2 py-0.5 text-[10px]">
                      Verified
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-white/60">
                  {new Date(t.posted_at).toLocaleString()}
                </div>
              </div>
              <div className="ml-auto text-[11px]">
                <span className="rounded bg-white/10 px-2 py-0.5">
                  {t.type === "free" ? "FREE" : "PREMIUM"}
                </span>
              </div>
            </div>

            <h1 className="mb-1 text-base font-semibold">{t.title}</h1>
            {t.description && (
              <p className="mb-3 text-sm text-white/80">{t.description}</p>
            )}

            <div className="mb-3 grid grid-cols-3 gap-2 text-center text-[12px]">
              <div className="rounded-xl bg-white/10 p-2">
                <div className="text-white/60">Bookmaker</div>
                <div className="font-semibold">{t.bookmaker || "-"}</div>
              </div>
              <div className="rounded-xl bg-white/10 p-2">
                <div className="text-white/60">Total Odds</div>
                <div className="font-semibold">{t.total_odds ?? "-"}</div>
              </div>
              <div className="rounded-xl bg-white/10 p-2">
                <div className="text-white/60">Confidence</div>
                <div className="font-semibold">
                  {t.confidence_level ?? "-"}
                  {t.confidence_level !== null ? "/10" : ""}
                </div>
              </div>
            </div>

            {/* FREE tickets show full details */}
            {t.type === "free" && t.match_details && (
              <div className="mb-3 rounded-xl bg-white/5 p-3">
                <div className="mb-2 text-sm font-semibold">Matches</div>
                <ul className="list-inside list-disc text-sm text-white/80">
                  {t.match_details.map((m: MatchRow, i: number) => (
                    <li key={i}>
                      {m.home} vs {m.away} — pick: {m.pick} — odds: {m.odds}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {t.type === "free" && t.booking_code && (
              <div className="rounded-xl bg-white/10 p-3 text-center text-sm">
                <div className="text-white/60">Booking Code</div>
                <div className="text-lg font-semibold tracking-wide">
                  {t.booking_code}
                </div>
              </div>
            )}

            {/* Premium lock logic */}
            {t.type === "premium" && (
              <div className="rounded-2xl bg-white/10 p-3 text-center text-sm">
                {t.purchased ? (
                  <>
                    {t.match_details && (
                      <div className="mb-3 text-left">
                        <div className="mb-2 text-sm font-semibold">
                          Matches
                        </div>
                        <ul className="list-inside list-disc text-sm text-white/80">
                          {t.match_details.map((m: MatchRow, i: number) => (
                            <li key={i}>
                              {m.home} vs {m.away} — pick: {m.pick} — odds:{" "}
                              {m.odds}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {t.booking_code && (
                      <div>
                        <div className="text-white/60">Booking Code</div>
                        <div className="text-lg font-semibold tracking-wide">
                          {t.booking_code}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="mb-2">This is a PREMIUM ticket.</div>
                    <button
                      onClick={() => alert("Buy flow coming soon")}
                      className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#0b0f10]"
                    >
                      Buy to Unlock
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="mt-3 text-right text-[12px] text-white/60">
              Status: {t.status}
            </div>
          </article>
        </section>
      )}
    </main>
  );
}
