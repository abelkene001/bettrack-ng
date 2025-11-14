components// components/TicketCard.tsx
"use client";

import { useRouter } from "next/navigation";

type Bookmaker = "bet9ja" | "sportybet" | "1xbet" | "betking" | "other";

export type TicketCardData = {
  id: string;
  tipster: { id: string; name: string; photo: string | null };
  postedAt: string;
  title: string;
  description: string | null;
  odds: number | null;
  bookmaker: Bookmaker | null;
  confidence: number;
  priceNGN: number;
};

type Props = { item: TicketCardData; onClick?: () => void };

function formatDDMMYYHHmm(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  const hh = String(d.getHours()).padStart(2, "0");
  const mn = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yy} ${hh}:${mn}`;
}

function formatNGN(n: number): string {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
}

export default function TicketCard({ item, onClick }: Props) {
  const router = useRouter();
  const handleOpen = () => (onClick ? onClick() : router.push(`/t/${item.id}`));

  const title = item.title.length > 28 ? item.title.slice(0, 28) + "…" : item.title;
  const desc =
    item.description && item.description.length > 56 ? item.description.slice(0, 56) + "…" : item.description ?? "";

  return (
    <div className="rounded-3xl bg-[#1A171C] p-4 text-white shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <button
          onClick={() => router.push(`/tipster/${item.tipster.id}`)}
          className="h-9 w-9 overflow-hidden rounded-full bg-white/10"
          aria-label="Open tipster"
        >
          {item.tipster.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.tipster.photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-white/70">
              {item.tipster.name.slice(0, 1).toUpperCase()}
            </div>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold">{item.tipster.name}</div>
          <div className="text-[11px] text-white/60">{formatDDMMYYHHmm(item.postedAt)}</div>
        </div>
        <div className="rounded-full bg-purple-500/20 px-2 py-1 text-[10px] text-purple-300">Premium</div>
      </div>

      <button onClick={handleOpen} className="block w-full text-left">
        <div className="mb-1 text-sm font-semibold">{title}</div>
        <div className="mb-3 text-[11px] text-white/70">{desc || " "}</div>

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
            <div className="text-[10px] uppercase text-white/60">Confidence</div>
            <div className="font-semibold">{item.confidence}</div>
          </div>
        </div>
      </button>

      <div className="w-full rounded-2xl bg-[#6A673E] px-3 py-3 text-center text-[12px] font-semibold text-black">
        {formatNGN(item.priceNGN)}
      </div>
    </div>
  );
}
