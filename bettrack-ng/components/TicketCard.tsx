// components/TicketCard.tsx
"use client";

type Bookmaker = "bet9ja" | "sportybet" | "1xbet" | "betking" | "other";

export type TicketCardTipster = {
  display_name: string;
  profile_photo_url: string | null;
  is_verified: boolean;
};

export type TicketCardModel = {
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
  tipster_id: string; // <— we need this
  tipster: TicketCardTipster | null;
};

type Props = {
  t: TicketCardModel;
  onOpenTicket: (id: string) => void;
  onOpenTipster: (tipsterId: string) => void;
};

export default function TicketCard({ t, onOpenTicket, onOpenTipster }: Props) {
  const isPremium = t.type === "premium";

  return (
    <article className="rounded-2xl bg-white/5 p-3 shadow-sm">
      {/* Header: tipster avatar + name */}
      <div className="mb-2 flex items-center gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (t.tipster_id) onOpenTipster(t.tipster_id);
          }}
          className="flex items-center gap-3"
        >
          {t.tipster?.profile_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={t.tipster.profile_photo_url}
              alt="avatar"
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-white/10" />
          )}
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold">
              {t.tipster?.display_name ?? "Tipster"}
            </div>
            {t.tipster?.is_verified && (
              <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px]">
                Verified
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Body: whole card clickable to open ticket */}
      <button onClick={() => onOpenTicket(t.id)} className="w-full text-left">
        <div className="mb-1 text-sm font-semibold">{t.title}</div>

        <div className="mb-2 text-xs text-white/80">
          {isPremium ? "Premium ticket • locked details" : "Free ticket"}
        </div>

        <div className="mb-2 grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-xl bg-white/10 px-2 py-1">
            <div className="text-[10px] opacity-70">Bookmaker</div>
            <div className="font-semibold">{t.bookmaker ?? "-"}</div>
          </div>
          <div className="rounded-xl bg-white/10 px-2 py-1">
            <div className="text-[10px] opacity-70">Odds</div>
            <div className="font-semibold">{t.total_odds ?? "-"}</div>
          </div>
          <div className="rounded-xl bg-white/10 px-2 py-1">
            <div className="text-[10px] opacity-70">Confidence</div>
            <div className="font-semibold">{t.confidence_level ?? "-"}/10</div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase opacity-70">
            {t.status === "pending"
              ? "Pending"
              : t.status === "won"
              ? "Won"
              : "Lost"}
          </span>

          {isPremium ? (
            <span className="rounded-xl bg-white px-3 py-1 text-[11px] font-semibold text-[#0b0f10]">
              View / Buy
            </span>
          ) : (
            <span className="rounded-xl bg-white px-3 py-1 text-[11px] font-semibold text-[#0b0f10]">
              View
            </span>
          )}
        </div>
      </button>
    </article>
  );
}
