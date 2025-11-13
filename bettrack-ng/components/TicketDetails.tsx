// components/TicketDetails.tsx
"use client";

import Link from "next/link";

type Bookmaker = "bet9ja" | "sportybet" | "1xbet" | "betking" | "other";
type Status = "pending" | "won" | "lost";
type TicketType = "free" | "premium";

export type TicketDetailsModel = {
  id: string;
  tipster_id: string;
  type: TicketType;
  title: string;
  description: string;
  price: number | null; // kobo
  total_odds: number;
  bookmaker: Bookmaker;
  confidence_level: number;
  match_details: Array<{ match?: string; pick?: string; [k: string]: unknown }>;
  booking_code: string | null;
  status: Status;
  posted_at: string;
  settled_at: string | null;
  times_purchased: number;
};

export type TipsterMini = {
  user_id: string;
  display_name: string;
  bio: string;
  profile_photo_url: string | null;
  average_rating: number;
  total_followers: number;
  is_verified: boolean;
} | null;

export default function TicketDetails({
  ticket,
  tipster,
  onBuy,
}: {
  ticket: TicketDetailsModel;
  tipster: TipsterMini;
  onBuy?: () => void;
}) {
  const priceNaira =
    ticket.price != null
      ? `₦${(ticket.price / 100).toLocaleString()}`
      : undefined;

  return (
    <div className="space-y-4 pb-24">
      {/* Tipster header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-white/10 overflow-hidden">
          {tipster?.profile_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tipster.profile_photo_url}
              alt="avatar"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-sm text-white/60">
              👤
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <Link
              href={`/u/${tipster?.user_id ?? ticket.tipster_id}`}
              className="font-semibold hover:underline"
            >
              {tipster?.display_name ?? "Tipster"}
            </Link>
            {tipster?.is_verified && (
              <span className="ml-1 rounded bg-emerald-600/20 text-emerald-300 text-[10px] px-1.5 py-0.5">
                ✓ verified
              </span>
            )}
          </div>
          <div className="text-xs text-white/60">
            {tipster
              ? `${(tipster.average_rating || 0).toFixed(1)}★ · ${
                  tipster.total_followers
                } followers`
              : "—"}
          </div>
        </div>
        <span className="text-xs text-white/60">
          {new Date(ticket.posted_at).toLocaleString()}
        </span>
      </div>

      {/* Core card */}
      <div className="rounded-2xl border border-white/10 bg-white/3 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">{ticket.title}</div>
          <span className="rounded-lg bg-white/5 px-2 py-1 text-xs">
            {ticket.type === "premium" ? "Premium" : "Free"}
          </span>
        </div>

        <p className="text-white/80 text-sm leading-relaxed">
          {ticket.description}
        </p>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <Info label="Total Odds" value={ticket.total_odds.toFixed(2)} />
          <Info label="Bookmaker" value={ticket.bookmaker} />
          <Info label="Confidence" value={`${ticket.confidence_level}/10`} />
        </div>

        {/* Matches */}
        <div className="mt-2">
          <div className="text-sm text-white/70 mb-1">Matches</div>
          {ticket.type === "premium" && ticket.match_details.length === 0 ? (
            <div className="rounded-xl border border-fuchsia-400/30 bg-fuchsia-600/10 p-3 text-sm">
              This is a premium ticket. Buy to unlock match details and booking
              code.
            </div>
          ) : (
            <ul className="space-y-2">
              {ticket.match_details.map((m, idx) => (
                <li
                  key={idx}
                  className="rounded-lg bg-white/5 px-3 py-2 text-sm"
                >
                  <div className="font-medium">{m.match ?? "Match"}</div>
                  {"pick" in m && (
                    <div className="text-white/70">
                      Pick: {(m as { pick: string }).pick}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Booking code */}
        <div className="mt-1">
          <div className="text-sm text-white/70 mb-1">Booking Code</div>
          {ticket.booking_code ? (
            <div className="rounded-lg bg-white/5 px-3 py-2 font-mono">
              {ticket.booking_code}
            </div>
          ) : (
            <div className="rounded-lg bg-white/5 px-3 py-2 text-white/50">
              Locked
            </div>
          )}
        </div>

        {/* Status row */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <Info label="Status" value={ticket.status} />
          <Info label="Sales" value={ticket.times_purchased.toString()} />
          {priceNaira && <Info label="Price" value={priceNaira} />}
        </div>

        {/* Action */}
        {ticket.type === "premium" && (
          <button
            onClick={onBuy}
            className="mt-2 w-full rounded-xl px-4 py-3 font-semibold bg-fuchsia-600 hover:bg-fuchsia-500"
          >
            Buy to Unlock
          </button>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/5 px-3 py-2">
      <div className="text-[11px] text-white/60">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}
