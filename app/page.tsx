// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import TicketCard from "@/components/TicketCard";
import LoadingSpinner, { LoadingSkeleton } from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";
import type { TicketCardData, ApiResponse } from "@/types";

export default function HomePage() {
  const [tickets, setTickets] = useState<TicketCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get Telegram initData
      const initData = window.Telegram?.WebApp?.initData || "";

      const response = await fetch("/api/tickets/recent", {
        headers: {
          "x-telegram-init-data": initData,
        },
        cache: "no-store",
      });

      const data: ApiResponse<TicketCardData[]> = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to load tickets");
      }

      setTickets(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initialize Telegram WebApp
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }

    fetchTickets();
  }, []);

  return (
    <main className="container mx-auto px-4 py-6 max-w-md">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">
          Premium Tips
        </h1>
        <p className="text-white/60 text-sm">
          Verified betting tips from expert tipsters
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <LoadingSkeleton key={i} className="h-64" />
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <ErrorMessage message={error} onRetry={fetchTickets} />
      )}

      {/* Empty State */}
      {!loading && !error && tickets.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="w-16 h-16 mx-auto text-white/20 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="text-lg font-semibold text-white mb-2">
            No tickets yet
          </h3>
          <p className="text-white/60 text-sm">
            Check back later for premium tips
          </p>
        </div>
      )}

      {/* Tickets List */}
      {!loading && !error && tickets.length > 0 && (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </main>
  );
}
