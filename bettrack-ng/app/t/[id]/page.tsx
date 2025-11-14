// app/t/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type Bookmaker = "bet9ja" | "sportybet" | "1xbet" | "betking" | "other";
type TicketResponse =
  | {
      ok: true;
      ticket: {
        id: string;
        title: string;
        description: string | null;
        postedAt: string;
        odds: number | null;
        bookmaker: Bookmaker | null;
        confidence: number;
        priceNGN: number;
        bookingCode: string | null;
        tipster: { id: string; name: string; photo: string | null; verified: boolean };
      };
    }
  | { ok: false; error: string };

function formatNGN(n: number): string {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
}
function formatDDMMYYHHmm(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  const hh = String(d.getHours()).padStart(2, "0");
  const mn = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yy} ${hh}:${mn}`;
}

declare global {
  interface Window {
    PaystackPop?: {
      setup(opts: {
        key: string;
        email: string;
        amount: number; // kobo
        ref: string;
        callback: () => void;
        onClose: () => void;
      }): { openIframe: () => void };
    };
  }
}

export default function TicketPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [ticket, setTicket] = useState<TicketResponse extends { ok: true } ? never : any>(null);
  const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

  useEffect(() => {
    // load Paystack inline script
    const s = document.createElement("script");
    s.src = "https://js.paystack.co/v1/inline.js";
    s.async = true;
    document.body.appendChild(s);
    return () => {
      document.body.removeChild(s);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`/api/tickets/${id}`, { cache: "no-store" });
        const json = (await res.json()) as TicketResponse;
        if (!json.ok) throw new Error(json.error);
        if (!cancelled) setTicket(json.ticket);
      } catch (e) {
        if (!cancelled) setErr((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const unlocked = useMemo(() => Boolean(ticket?.bookingCode), [ticket]);

  async function beginPay() {
    try {
      const res = await fetch("/api/purchases/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ticket_id: id, method: "paystack" }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);

      if (!window.PaystackPop) throw new Error("Paystack loader failed");

      const popup = window.PaystackPop.setup({
        key: String(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY),
        email: json.email, // from server
        amount: json.amount_kobo, // kobo
        ref: json.reference,
        callback: async () => {
          // verify server-side
          const vr = await fetch("/api/paystack/verify", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ reference: json.reference }),
          });
          const vj = await vr.json();
          if (!vj.ok) {
            alert(vj.error || "Verification failed");
            return;
          }
          // reload ticket (should now include booking code)
          const r2 = await fetch(`/api/tickets/${id}`, { cache: "no-store" });
          const j2 = (await r2.json()) as TicketResponse;
          if (!j2.ok) {
            alert(j2.error || "Reload failed");
            return;
          }
          setTicket(j2.ticket);
          alert("Payment confirmed. Ticket unlocked.");
        },
        onClose: () => {
          // user closed payment popup
        },
      });
      popup.openIframe();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#0b0f10] px-4 py-4">
      {loading && <div className="h-40 animate-pulse rounded-3xl bg-white/10" />}
      {!loading && err && <div className="rounded-xl bg-red-500/15 p-3 text-red-200">{err}</div>}
      {!loading && !err && ticket && (
        <div className="space-y-4">
          <div className="rounded-3xl bg-[#1A171C] p-4">
            <div className="mb-3 text-xs text-white/60">{formatDDMMYYHHmm(ticket.postedAt)}</div>
            <div className="mb-1 text-base font-semibold">{ticket.title}</div>
            <div className="mb-3 text-[12px] text-white/70">{ticket.description ?? " "}</div>

            <div className="mb-4 grid grid-cols-3 gap-2 text-center text-[11px]">
              <div className="rounded-xl bg-white/10 px-2 py-2">
                <div className="text-[10px] uppercase text-white/60">Odds</div>
                <div className="font-semibold">{ticket.odds ?? "—"}</div>
              </div>
              <div className="rounded-xl bg-white/10 px-2 py-2">
                <div className="text-[10px] uppercase text-white/60">Bookmaker</div>
                <div className="font-semibold">{ticket.bookmaker ?? "—"}</div>
              </div>
              <div className="rounded-xl bg-white/10 px-2 py-2">
                <div className="text-[10px] uppercase text-white/60">Confidence</div>
                <div className="font-semibold">{ticket.confidence}</div>
              </div>
            </div>

            {!unlocked ? (
              <button
                onClick={beginPay}
                className="w-full rounded-2xl bg-[#6A673E] px-3 py-3 text-center text-[12px] font-semibold text-black"
              >
                Pay {formatNGN(ticket.priceNGN)} with Paystack
              </button>
            ) : (
              <div className="rounded-2xl bg-white/5 p-3 text-center text-[12px]">
                <div className="mb-1 text-white/80">Booking Code</div>
                <div className="text-sm font-semibold tracking-wide">{ticket.bookingCode}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
