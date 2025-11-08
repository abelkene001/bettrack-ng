// components/TicketCard.tsx
"use client";

type Bookmaker = "bet9ja" | "sportybet" | "1xbet" | "betking" | "other";

type MatchRow = {
  home: string;
  away: string;
  pick: string;
  odds: number;
};

type Ticket = {
  id: string;
  type: "free" | "premium";
  title: string;
  description: string | null;
  total_odds: number | null;
  bookmaker: Bookmaker | null;
  confidence_level: number | null;
  match_details: unknown; // stored as jsonb in DB
  booking_code: string | null;
  status: "pending" | "won" | "lost";
  posted_at: string;
  tipster?: {
    display_name: string;
    profile_photo_url: string | null;
    is_verified: boolean;
  } | null;
};

/** Type guard to make sure match_details is a MatchRow[] */
function isMatchRowArray(val: unknown): val is MatchRow[] {
  if (!Array.isArray(val)) return false;
  return val.every((item) => {
    if (typeof item !== "object" || item === null) return false;
    const obj = item as Record<string, unknown>;
    return (
      typeof obj.home === "string" &&
      typeof obj.away === "string" &&
      typeof obj.pick === "string" &&
      (typeof obj.odds === "number" || typeof obj.odds === "string")
    );
  });
}

export default function TicketCard({ t }: { t: Ticket }) {
  const details: MatchRow[] | null = isMatchRowArray(t.match_details)
    ? (t.match_details as MatchRow[]).map((m) => ({
        home: m.home,
        away: m.away,
        pick: m.pick,
        odds: typeof m.odds === "string" ? Number(m.odds) : m.odds,
      }))
    : null;

  return (
    <article className="rounded-2xl bg-white/5 p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        {t.tipster?.profile_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={t.tipster.profile_photo_url}
            alt="Tipster"
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-white/10" />
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

      <h3 className="mb-1 text-base font-semibold">{t.title}</h3>
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
      {t.type === "free" && (
        <>
          {details && details.length > 0 && (
            <div className="mb-3 rounded-xl bg-white/5 p-3">
              <div className="mb-2 text-sm font-semibold">Matches</div>
              <ul className="list-inside list-disc text-sm text-white/80">
                {details.map((m, i) => (
                  <li key={i}>
                    {m.home} vs {m.away} — pick: {m.pick} — odds: {m.odds}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {t.booking_code && (
            <div className="rounded-xl bg-white/10 p-3 text-center text-sm">
              <div className="text-white/60">Booking Code</div>
              <div className="text-lg font-semibold tracking-wide">
                {t.booking_code}
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-3 text-right text-[12px] text-white/60">
        Status: {t.status}
      </div>
    </article>
  );
}
