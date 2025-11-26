// app/t/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { formatNGN, initializePaystackPopup } from "@/lib/paystack";
import type { TicketDetailData, ApiResponse, CreatePurchaseResponse } from "@/types";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return d.toLocaleDateString("en-GB", options);
}

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const fetchTicket = async () => {
    setLoading(true);
    setError(null);

    try {
      const initData = window.Telegram?.WebApp?.initData || "";

      const response = await fetch(`/api/tickets/${params.id}`, {
        headers: {
          "x-telegram-init-data": initData,
        },
        cache: "no-store",
      });

      const data: ApiResponse<TicketDetailData> = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to load ticket");
      }

      setTicket(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!ticket) return;

    setPurchasing(true);

    try {
      const initData = window.Telegram?.WebApp?.initData || "";

      // Create purchase
      const response = await fetch("/api/purchases/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-init-data": initData,
        },
        body: JSON.stringify({
          ticket_id: ticket.id,
          method: "paystack",
        }),
      });

      const data: CreatePurchaseResponse = await response.json();

      if (!data.ok) {
        throw new Error("error" in data ? data.error : "Failed to create purchase");
      }

      // Initialize Paystack
      initializePaystackPopup({
        email: data.email,
        amount: data.amount_kobo,
        reference: data.reference,
        onSuccess: async () => {
          // Verify payment
          const verifyResponse = await fetch("/api/paystack/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-telegram-init-data": initData,
            },
            body: JSON.stringify({ reference: data.reference }),
          });

          const verifyData = await verifyResponse.json();

          if (!verifyData.ok) {
            alert("Payment verification failed. Please contact support.");
            return;
          }

          // Reload ticket to show booking code
          await fetchTicket();

          if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
          }
        },
        onClose: () => {
          setPurchasing(false);
        },
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Purchase failed");
      setPurchasing(false);
    }
  };

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.BackButton.show();
      window.Telegram.WebApp.BackButton.onClick(() => router.push("/"));
    }

    fetchTicket();

    return () => {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.BackButton.hide();
      }
    };
  }, [params.id]);

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-6 max-w-md">
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </main>
    );
  }

  if (error || !ticket) {
    return (
      <main className="container mx-auto px-4 py-6 max-w-md">
        <ErrorMessage message={error || "Ticket not found"} onRetry={fetchTicket} />
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6 max-w-md">
      <Card className="mb-4">
        {/* Tipster Info */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center overflow-hidden">
              {ticket.tipster.photo ? (
                <img
                  src={ticket.tipster.photo}
                  alt={ticket.tipster.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold">
                  {ticket.tipster.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {ticket.tipster.verified && (
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-[#14141f]">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">{ticket.tipster.name}</h3>
            <p className="text-xs text-white/50">{formatDate(ticket.postedAt)}</p>
          </div>
          <div className="px-3 py-1.5 bg-purple-500/20 rounded-full">
            <span className="text-xs font-semibold text-purple-300">Premium</span>
          </div>
        </div>

        {/* Title & Description */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-white mb-2">{ticket.title}</h1>
          {ticket.description && (
            <p className="text-white/70 text-sm leading-relaxed">{ticket.description}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <p className="text-xs uppercase text-white/50 font-medium mb-1">Odds</p>
            <p className="text-lg font-bold text-white">{ticket.odds.toFixed(2)}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <p className="text-xs uppercase text-white/50 font-medium mb-1">Bookmaker</p>
            <p className="text-lg font-bold text-white capitalize">{ticket.bookmaker}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <p className="text-xs uppercase text-white/50 font-medium mb-1">Confidence</p>
            <p className="text-lg font-bold text-white">{ticket.confidence}/10</p>
          </div>
        </div>

        {/* Booking Code or Purchase Button */}
        {ticket.isPurchased && ticket.bookingCode ? (
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4">
            <p className="text-xs uppercase text-green-300 font-medium mb-2 text-center">
              Booking Code
            </p>
            <p className="text-2xl font-bold text-white text-center tracking-wider font-mono">
              {ticket.bookingCode}
            </p>
            <p className="text-xs text-white/60 text-center mt-2">
              Use this code on {ticket.bookmaker}
            </p>
          </div>
        ) : (
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handlePurchase}
            isLoading={purchasing}
          >
            Purchase for {formatNGN(ticket.priceNGN)}
          </Button>
        )}
      </Card>

      {/* Status Badge */}
      {ticket.status !== "pending" && (
        <Card className="text-center">
          <p className="text-sm text-white/70">
            Status:{" "}
            <span
              className={`font-semibold ${ticket.status === "won"
                  ? "text-green-400"
                  : ticket.status === "lost"
                    ? "text-red-400"
                    : "text-yellow-400"
                }`}
            >
              {ticket.status.toUpperCase()}
            </span>
          </p>
        </Card>
      )}
    </main>
  );
}
