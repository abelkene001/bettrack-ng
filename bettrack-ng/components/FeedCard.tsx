// components/FeedCard.tsx
"use client";

import { useRouter } from "next/navigation";
import { hapticImpact, hapticNotify } from "../lib/telegram";

type Bookmaker = "bet9ja" | "sportybet" | "1xbet" | "betking" | "other";
type Status = "pending" | "won" | "lost";
type TicketType = "free" | "premium";

export type FeedItem = {
  id: string;
  tipster: {
    id: string;
    name: string;
    photo: string | null;
    verified: boolean; // NOTE: add badge later
  };
  postedAt: string; // ISO
  status: Status;
  type: TicketType;
  title: string;
  description: string | null;
  odds: number | null;
  bookmaker: Bookmaker | null;
  confidence: number; // required
  bookingCode: string | null; // shown when type=free
  priceNGN: number | null; // shown when type=premium
};

function clsStatus(s: Status): string {
  if (s === "won") return "bg-green-500/20 text-green-300";
  if (s === "lost") return "bg-red-500/20 text-red-300";
  return "bg-yellow-500/20 text-yellow-300"; // pending
}

function formatPriceNGN(n: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
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

export default function FeedCard({ item }: { item: FeedItem }) {
  const router = useRouter();

  const onOpenTicket = () => router.push(`/t/${item.id}`);
  const onOpenTipster = () => router.push(`/tipster/${item.tipster.id}`);

  const bottomLabel =
    item.type === "premium" && typeof item.priceNGN === "number"
      ? formatPriceNGN(item.priceNGN)
      : item.bookingCode ?? "—";

  const onBottomPress = async () => {
    if (item.type === "premium") {
      // NOTE: purchase flow to be added later
      // Telegram haptic (light)
      hapticImpact("light");
      return;
    }
    if (item.bookingCode) {
      await navigator.clipboard.writeText(item.bookingCode);
      await navigator.clipboard.writeText(item.bookingCode);
      hapticNotify("success");
    }
  };

  // Truncate title/desc (character limits per your request)
  const title =
    item.title.length > 28 ? item.title.slice(0, 28) + "…" : item.title;
  const desc =
    item.description && item.description.length > 56
      ? item.description.slice(0, 56) + "…"
      : item.description ?? "";

  return (
    <div className="rounded-3xl bg-[#1A171C] p-4 text-white shadow-sm">
      {/* Top row: avatar, name/time, status + type */}
      <div className="mb-3 flex items-center gap-3">
        <button
          onClick={onOpenTipster}
          className="h-9 w-9 overflow-hidden rounded-full bg-white/10"
          aria-label="Open tipster"
        >
          {item.tipster.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.tipster.photo}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-white/70">
              {item.tipster.name.slice(0, 1).toUpperCase()}
            </div>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenTipster}
              className="truncate text-[13px] font-semibold hover:underline"
              title={item.tipster.name}
            >
              {item.tipster.name}
            </button>
            {/* NOTE: verified badge coming later when enabled */}
          </div>
          <div className="text-[11px] text-white/60">
            {formatDDMMYYHHmm(item.postedAt)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-1 text-[10px] ${clsStatus(
              item.status
            )}`}
          >
            {item.status[0].toUpperCase() + item.status.slice(1)}
          </span>
          <span
            className={`rounded-full px-2 py-1 text-[10px] ${
              item.type === "premium"
                ? "bg-purple-500/20 text-purple-300"
                : "bg-blue-500/20 text-blue-300"
            }`}
          >
            {item.type === "premium" ? "Premium" : "Free"}
          </span>
        </div>
      </div>

      {/* Title / description (tap anywhere to open ticket) */}
      <button onClick={onOpenTicket} className="block w-full text-left">
        <div className="mb-1 text-sm font-semibold">{title}</div>
        <div className="mb-3 text-[11px] text-white/70">{desc || " "}</div>

        {/* Pills row */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white/10 px-2 py-2 text-center text-[11px]">
            <div className="text-[10px] uppercase text-white/60">Odds</div>
            <div className="font-semibold">{item.odds ?? "—"}</div>
          </div>
          <div className="rounded-xl bg-white/10 px-2 py-2 text-center text-[11px]">
            <div className="text-[10px] uppercase text-white/60">Bookmaker</div>
            <div className="font-semibold">{item.bookmaker ?? "—"}</div>
          </div>
          <div className="rounded-xl bg-white/10 px-2 py-2 text-center text-[11px]">
            <div className="text-[10px] uppercase text-white/60">
              Confidence
            </div>
            <div className="font-semibold">{item.confidence}</div>
          </div>
        </div>
      </button>

      {/* Bottom bar: premium → price; free → booking code (copy) */}
      <button
        onClick={onBottomPress}
        className="w-full rounded-2xl bg-[#6A673E] px-3 py-3 text-center text-[12px] font-semibold text-black"
      >
        {bottomLabel}
      </button>
    </div>
  );
}
