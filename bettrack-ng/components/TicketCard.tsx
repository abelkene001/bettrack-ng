// components/TicketCard.tsx
"use client";

import { useRouter } from "next/navigation";

type Bookmaker = "bet9ja" | "sportybet" | "1xbet" | "betking" | "other";
type Status = "pending" | "won" | "lost";
type TicketType = "free" | "premium";

/** Minimal shape the card needs to render */
export type TicketCardData = {
  id: string;
  tipster: {
    id: string;
    name: string;
    photo: string | null;
    verified: boolean;
  };
  postedAt: string; // ISO
  status: Status;
  type: TicketType;
  title: string;
  description: string | null;
  odds: number | null;
  bookmaker: Bookmaker | null;
  confidence: number;
  /** free only */
  bookingCode?: string | null;
  /** premium only (in naira) */
  priceNGN?: number | null;
};

/**
 * Support BOTH historical usages:
 * - <TicketCard item={...} />
 * - <TicketCard t={...} />
 */
type TicketCardProps =
  | { item: TicketCardData; onClick?: () => void }
  | { t: TicketCardData; onClick?: () => void };

function clsStatus(s: Status): string {
  if (s === "won") return "bg-green-500/20 text-green-300";
  if (s === "lost") return "bg-red-500/20 text-red-300";
  return "bg-yellow-500/20 text-yellow-300";
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

export default function TicketCard(props: TicketCardProps) {
  const router = useRouter();

  // Normalize props: support either {t} or {item}
  const data: TicketCardData = "t" in props ? props.t : props.item;
  const onClick = props.onClick;

  const handleOpen = () => {
    if (onClick) return onClick();
    router.push(`/t/${data.id}`);
  };

  const bottomLabel =
    data.type === "premium" && typeof data.priceNGN === "number"
      ? formatPriceNGN(data.priceNGN)
      : data.bookingCode ?? "—";

  // Character limits
  const title = data.title.length > 28 ? data.title.slice(0, 28) + "…" : data.title;
  const desc =
    data.description && data.description.length > 56
      ? data.description.slice(0, 56) + "…"
      : data.description ?? "";

  return (
    <div className="rounded-3xl bg-[#1A171C] p-4 text-white shadow-sm">
      {/* Top row */}
      <div className="mb-3 flex items-center gap-3">
        <button
          onClick={() => router.push(`/tipster/${data.tipster.id}`)}
          className="h-9 w-9 overflow-hidden rounded-full bg-white/10"
          aria-label="Open tipster"
        >
          {data.tipster.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.tipster.photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-white/70">
              {data.tipster.name.slice(0, 1).toUpperCase()}
            </div>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <button
            onClick={() => router.push(`/tipster/${data.tipster.id}`)}
            className="truncate text-[13px] font-semibold hover:underline"
            title={data.tipster.name}
          >
            {data.tipster.name}
          </button>
          <div className="text-[11px] text-white/60">{formatDDMMYYHHmm(data.postedAt)}</div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-1 text-[10px] ${clsStatus(data.status)}`}>
            {data.status[0].toUpperCase() + data.status.slice(1)}
          </span>
          <span
            className={`rounded-full px-2 py-1 text-[10px] ${
              data.type === "premium" ? "bg-purple-500/20 text-purple-300" : "bg-blue-500/20 text-blue-300"
            }`}
          >
            {data.type === "premium" ? "Premium" : "Free"}
          </span>
        </div>
      </div>

      {/* Title / description */}
      <button onClick={handleOpen} className="block w-full text-left">
        <div className="mb-1 text-sm font-semibold">{title}</div>
        <div className="mb-3 text-[11px] text-white/70">{desc || " "}</div>

        {/* Pills */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white/10 px-2 py-2 text-center text-[11px]">
            <div className="text-[10px] uppercase text-white/60">Odds</div>
            <div className="font-semibold">{data.odds ?? "—"}</div>
          </div>
          <div className="rounded-xl bg-white/10 px-2 py-2 text-center text-[11px]">
            <div className="text-[10px] uppercase text-white/60">Bookmaker</div>
            <div className="font-semibold">{data.bookmaker ?? "—"}</div>
          </div>
          <div className="rounded-xl bg-white/10 px-2 py-2 text-center text-[11px]">
            <div className="text-[10px] uppercase text-white/60">Confidence</div>
            <div className="font-semibold">{data.confidence}</div>
          </div>
        </div>
      </button>

      {/* Bottom bar: premium → price; free → booking code */}
      <div className="w-full rounded-2xl bg-[#6A673E] px-3 py-3 text-center text-[12px] font-semibold text-black">
        {bottomLabel}
      </div>
    </div>
  );
}
