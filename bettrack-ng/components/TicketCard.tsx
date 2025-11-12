// components/TicketCard.tsx
"use client";

import Image from "next/image";
import { useMemo } from "react";

export type Bookmaker =
  | "bet9ja"
  | "sportybet"
  | "1xbet"
  | "betking"
  | "other"
  | null;
export type TicketStatus = "pending" | "won" | "lost";
export type TicketType = "free" | "premium";

export type TipsterBrief = {
  display_name: string;
  profile_photo_url: string | null;
  is_verified: boolean;
};

export type TicketCardModel = {
  id: string;
  type: TicketType;
  title: string;
  description: string | null;
  total_odds: number | null;
  bookmaker: Bookmaker;
  confidence_level: number | null;
  status: TicketStatus;
  posted_at: string;
  tipster?: TipsterBrief | null;
  /** optional: sometimes caller doesn’t have it */
  tipster_id?: string;
  /** optional: kobo for premium tickets */
  price?: number | null;
};

export default function TicketCard({
  t,
  onClick, // legacy single-click handler (optional)
  onOpenTicket, // new: open /t/:id
  onOpenTipster, // new: open /u/:tipsterId
}: {
  t: TicketCardModel;
  onClick?: () => void;
  onOpenTicket?: (id: string) => void;
  onOpenTipster?: (uid: string) => void;
}) {
  const tag = useMemo(() => {
    if (t.status === "won") return "Won";
    if (t.status === "lost") return "Lost";
    return "Pending";
  }, [t.status]);

  const tagCls = useMemo(() => {
    if (t.status === "won")
      return "bg-green-600/15 text-green-500 ring-1 ring-green-600/30";
    if (t.status === "lost")
      return "bg-red-600/15 text-red-400 ring-1 ring-red-600/30";
    return "bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/30";
  }, [t.status]);

  const isPremium = t.type === "premium";

  const handleCardClick = () => {
    if (onOpenTicket) return onOpenTicket(t.id);
    if (onClick) return onClick();
  };

  const handleTipsterClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation(); // don’t trigger card click
    if (t.tipster_id && onOpenTipster) {
      onOpenTipster(t.tipster_id);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCardClick}
      className="w-full text-left rounded-2xl border border-white/5 bg-white/2.5 hover:bg-white/5 transition-colors p-4"
    >
      {/* Header: tipster */}
      <div className="flex items-center gap-3">
        {/* Avatar + name are a mini-button to open tipster page */}
        <div
          role="button"
          onClick={handleTipsterClick}
          className="flex items-center gap-3 cursor-pointer"
          aria-label="Open tipster profile"
        >
          <div className="h-9 w-9 overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10">
            {t?.tipster?.profile_photo_url ? (
              <Image
                src={t.tipster.profile_photo_url}
                alt={t.tipster.display_name}
                width={36}
                height={36}
                className="h-9 w-9 object-cover"
              />
            ) : (
              <div className="h-9 w-9 grid place-items-center text-xs text-white/60">
                👤
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-1 text-sm font-medium">
              <span>{t?.tipster?.display_name ?? "Tipster"}</span>
              {t?.tipster?.is_verified && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-white/10">
                  ✔
                </span>
              )}
            </div>
            <div className="text-xs text-white/50">
              {new Date(t.posted_at).toLocaleString()}
            </div>
          </div>
        </div>

        <span className={`text-xs px-2 py-0.5 rounded-full ${tagCls}`}>
          {tag}
        </span>
      </div>

      {/* Title / odds */}
      <div className="mt-3">
        <div className="text-base font-semibold">
          {t.title}
          {isPremium && (
            <span className="ml-2 text-xs rounded px-1.5 py-0.5 bg-fuchsia-500/20 text-fuchsia-300 ring-1 ring-fuchsia-500/30">
              Premium
            </span>
          )}
        </div>
        {t.description ? (
          <p className="mt-1 text-sm text-white/70 line-clamp-2">
            {t.description}
          </p>
        ) : null}
      </div>

      {/* Meta row */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
        <div className="rounded-xl bg-white/3 ring-1 ring-white/10 px-3 py-1.5">
          <div className="text-[11px] uppercase tracking-wide text-white/60">
            Odds
          </div>
          <div className="font-medium">{t.total_odds ?? "-"}</div>
        </div>
        <div className="rounded-xl bg-white/3 ring-1 ring-white/10 px-3 py-1.5">
          <div className="text-[11px] uppercase tracking-wide text-white/60">
            Bookmaker
          </div>
          <div className="font-medium">{t.bookmaker ?? "-"}</div>
        </div>
        <div className="rounded-xl bg-white/3 ring-1 ring-white/10 px-3 py-1.5">
          <div className="text-[11px] uppercase tracking-wide text-white/60">
            Confidence
          </div>
          <div className="font-medium">{t.confidence_level ?? "-"}/10</div>
        </div>
      </div>

      {/* Premium price (if present) */}
      {isPremium && typeof t.price === "number" ? (
        <div className="mt-3 text-sm">
          <span className="text-white/60">Price:</span>{" "}
          <span className="font-semibold">
            ₦{Math.floor(t.price / 100).toLocaleString()}
          </span>
        </div>
      ) : null}
    </button>
  );
}
