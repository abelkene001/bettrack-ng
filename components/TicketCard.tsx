// components/TicketCard.tsx
"use client";

import { useRouter } from "next/navigation";
import type { TicketCardData } from "@/types";
import Card from "./ui/Card";
import { formatNGN } from "@/lib/paystack";

interface TicketCardProps {
  ticket: TicketCardData;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear().toString().slice(-2)}`;
}

export default function TicketCard({ ticket }: TicketCardProps) {
  const router = useRouter();

  return (
    <Card
      hover
      onClick={() => router.push(`/t/${ticket.id}`)}
      className="animate-slide-up"
    >
      {/* Header - Tipster Info */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center overflow-hidden">
            {ticket.tipster.photo ? (
              <img
                src={ticket.tipster.photo}
                alt={ticket.tipster.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-semibold text-sm">
                {ticket.tipster.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          {ticket.tipster.verified && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center border-2 border-[#14141f]">
              <svg
                className="w-2.5 h-2.5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white text-sm truncate">
              {ticket.tipster.name}
            </h3>
          </div>
          <p className="text-xs text-white/50">{formatDate(ticket.postedAt)}</p>
        </div>
        <div className="px-2.5 py-1 bg-purple-500/20 rounded-full">
          <span className="text-xs font-semibold text-purple-300">Premium</span>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <h4 className="font-bold text-white text-base mb-1.5 line-clamp-2">
          {ticket.title}
        </h4>
        {ticket.description && (
          <p className="text-sm text-white/70 line-clamp-2">
            {ticket.description}
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white/5 rounded-lg p-2.5 text-center">
          <p className="text-[10px] uppercase text-white/50 font-medium mb-0.5">
            Odds
          </p>
          <p className="text-sm font-bold text-white">{ticket.odds.toFixed(2)}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-2.5 text-center">
          <p className="text-[10px] uppercase text-white/50 font-medium mb-0.5">
            Bookmaker
          </p>
          <p className="text-sm font-bold text-white capitalize">
            {ticket.bookmaker}
          </p>
        </div>
        <div className="bg-white/5 rounded-lg p-2.5 text-center">
          <p className="text-[10px] uppercase text-white/50 font-medium mb-0.5">
            Confidence
          </p>
          <p className="text-sm font-bold text-white">{ticket.confidence}/10</p>
        </div>
      </div>

      {/* Price */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-3 text-center">
        <p className="text-sm font-bold text-black">
          {formatNGN(ticket.priceNGN)}
        </p>
      </div>
    </Card>
  );
}
