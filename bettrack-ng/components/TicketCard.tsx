// components/TicketCard.tsx
"use client";

import { useRouter } from "next/navigation";

type Bookmaker = "bet9ja" | "sportybet" | "1xbet" | "betking" | "other";
type Status = "pending" | "won" | "lost";
type TicketType = "free" | "premium";

/**
 * Minimal, strict shape the card needs.
 * This is compatible with both "recent feed" items and "mine" items we built.
 */
export type TicketCardData = {
  id: string;
  tipster: {
    id: string;
    name: string;
    photo: string | null;
    verified: boolean; // NOTE: we’ll render a badge when you enable it
  };
  postedAt: string; // ISO
  status: Status;
  type: TicketType;
  title: string;
  description: string | null;
  odds: number | null;
  bookmaker: Bookmaker | null;
  confidence: number; // required
  /** free only */
  bookingCode?: string | null;
  /** premium only (in naira) */
  priceNGN?: number | null;
};

export type TicketCardProps = {
  /** Use `t={...}` from parents (matches your current usage) */
  t: TicketCardData;
  /** Optional click handler if parent wants to override navigate */
  onClick?: () => void;
};

function clsStatus(s: Status): string {
  if (s === "won") return "bg-green-500/20 text-green-300";
  if (s === "lost") return "bg-red-500/20 text-red-300";
  return "bg-yellow-500/20 text-yellow-300"; // pending
}

function formatDDMMYYHHmm(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yy} ${hh}:${min}`;
}

function formatPriceNGN(n: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function TicketCard({ t, onClick }: TicketCardProps) {
  const router = useRouter();

  const handleOpen = () => {
    if (onClick) return onClick();
    router.push(`/t/${t.id}`);
  };

  const bottomLabel =
    t.type === "premium" && typeof t.priceNGN === "number"
      ? formatPriceNGN(t.priceNGN)
      : t.bookingCode ?? "—";

  // Character limits per your rule
  const title = t.title.length > 28 ? t.title.slice(0, 28) + "…" : t.title;
  const desc =
    t.description && t.description.length > 56
      ? t.description.slice(0, 56) + "…"
      : t.description ?? "";

  return (
    <div className="rounded-3xl bg-[#1A171C] p-4 text-white shadow-sm">
      {/* Top row: avatar, name/time, status + type */}
      <div className="mb-3 flex items-center gap-3">
        <button
          onClick={() => router.push(`/tipster/${t.tipster.id}`)}
          className="h-9 w-9 overflow-hidden rounded-full bg-white/10"
          aria-label="Open tipster"
        >
          {t.tipster.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={t.tipster.photo}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-white/70">
              {t.tipster.name.slice(0, 1).toUpperCase()}
            </div>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <button
            onClick={() => router.push(`/tipster/${t.tipster.id}`)}
            className="truncate text-[13px] font-semibold hover:underline"
            title={t.tipster.name}
          >
            {t.tipster.name}
          </button>
          <div className="text-[11px] text-white/60">
            {formatDDMMYYHHmm(t.postedAt)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-1 text-[10px] ${clsStatus(
              t.status
            )}`}
          >
            {t.status[0].toUpperCase() + t.status.slice(1)}
          </span>
          <span
            className={`rounded-full px-2 py-1 text-[10px] ${
              t.type === "premium"
                ? "bg-purple-500/20 text-purple-300"
                : "bg-blue-500/20 text-blue-300"
            }`}
          >
            {t.type === "premium" ? "Premium" : "Free"}
          </span>
        </div>
      </div>

      {/* Title / description (tap anywhere to open ticket) */}
      <button onClick={handleOpen} className="block w-full text-left">
        <div className="mb-1 text-sm font-semibold">{title}</div>
        <div className="mb-3 text-[11px] text-white/70">{desc || " "}</div>

        {/* Pills row */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white/10 px-2 py-2 text-center text-[11px]">
            <div className="text-[10px] uppercase text-white/60">Odds</div>
            <div className="font-semibold">{t.odds ?? "—"}</div>
          </div>
          <div className="rounded-xl bg-white/10 px-2 py-2 text-center text-[11px]">
            <div className="text-[10px] uppercase text-white/60">Bookmaker</div>
            <div className="font-semibold">{t.bookmaker ?? "—"}</div>
          </div>
          <div className="rounded-xl bg-white/10 px-2 py-2 text-center text-[11px]">
            <div className="text-[10px] uppercase text-white/60">
              Confidence
            </div>
            <div className="font-semibold">{t.confidence}</div>
          </div>
        </div>
      </button>

      {/* Bottom bar: premium → price; free → booking code (copy handled by parent if needed) */}
      <div className="w-full rounded-2xl bg-[#6A673E] px-3 py-3 text-center text-[12px] font-semibold text-black">
        {bottomLabel}
      </div>
    </div>
  );
}
