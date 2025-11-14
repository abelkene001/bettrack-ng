// app/studio/page.tsx
"use client";

import { useEffect, useState } from "react";

type CreateResponse = { ok: true; id: string } | { ok: false; error: string };

type Bookmaker = "bet9ja" | "sportybet" | "1xbet" | "betking" | "other";

export default function StudioPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // check permission
  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch("/api/studio/allowed", { cache: "no-store" });
        const j = (await res.json()) as { ok: boolean; reason?: string };
        if (!cancelled) {
          if (j.ok) setAllowed(true);
          else {
            setAllowed(false);
            setErr(j.reason || "Not allowed");
          }
        }
      } catch (e) {
        if (!cancelled) {
          setAllowed(false);
          setErr((e as Error).message);
        }
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const [title, setTitle] = useState("");
  const [description, setDesc] = useState("");
  const [odds, setOdds] = useState("");
  const [bookmaker, setBookmaker] = useState<Bookmaker>("bet9ja");
  const [confidence, setConfidence] = useState(7);
  const [price, setPrice] = useState("");
  const [booking, setBooking] = useState("");

  async function submit() {
    try {
      if (!title || !odds || !bookmaker || !confidence || !price || !booking) {
        alert("All fields are required.");
        return;
      }
      const payload = {
        title,
        description,
        total_odds: Number(odds),
        bookmaker,
        confidence: Number(confidence),
        priceNGN: Number(price),
        booking_code: booking,
      };
      const res = await fetch("/api/tickets/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = (await res.json()) as CreateResponse;
      if (!j.ok) {
        alert(j.error);
        return;
      }
      alert("Ticket posted.");
      setTitle("");
      setDesc("");
      setOdds("");
      setBookmaker("bet9ja");
      setConfidence(7);
      setPrice("");
      setBooking("");
    } catch (e) {
      alert((e as Error).message);
    }
  }

  if (allowed === null)
    return <main className="mx-auto min-h-screen max-w-md px-4 py-4">Loading…</main>;

  if (!allowed)
    return (
      <main className="mx-auto min-h-screen max-w-md px-4 py-4">
        <div className="rounded-xl bg-red-500/15 p-3 text-red-200">Access denied: {err}</div>
      </main>
    );

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#0b0f10] px-4 py-4">
      <div className="rounded-3xl bg-[#1A171C] p-4">
        <div className="mb-3 text-sm font-semibold">Post Premium Ticket</div>
        <div className="space-y-3">
          <input
            className="w-full rounded-xl bg-white/10 p-3 text-sm outline-none"
            placeholder="Title (≤ 28 chars)"
            maxLength={28}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="w-full rounded-xl bg-white/10 p-3 text-sm outline-none"
            placeholder="Description (≤ 56 chars)"
            maxLength={56}
            value={description}
            onChange={(e) => setDesc(e.target.value)}
          />
          <input
            className="w-full rounded-xl bg-white/10 p-3 text-sm outline-none"
            placeholder="Total odds"
            inputMode="decimal"
            value={odds}
            onChange={(e) => setOdds(e.target.value)}
          />
          <select
            className="w-full rounded-xl bg-white/10 p-3 text-sm outline-none"
            value={bookmaker}
            onChange={(e) => setBookmaker(e.target.value as Bookmaker)}
          >
            <option value="bet9ja">Bet9ja</option>
            <option value="sportybet">SportyBet</option>
            <option value="1xbet">1xBet</option>
            <option value="betking">BetKing</option>
            <option value="other">Other</option>
          </select>
          <input
            className="w-full rounded-xl bg-white/10 p-3 text-sm outline-none"
            placeholder="Confidence (1–10)"
            inputMode="numeric"
            value={confidence}
            onChange={(e) => setConfidence(Number(e.target.value))}
          />
          <input
            className="w-full rounded-xl bg-white/10 p-3 text-sm outline-none"
            placeholder="Price (₦)"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <input
            className="w-full rounded-xl bg-white/10 p-3 text-sm outline-none"
            placeholder="Booking code"
            value={booking}
            onChange={(e) => setBooking(e.target.value)}
          />

          <button
            onClick={submit}
            className="w-full rounded-2xl bg-[#6A673E] px-3 py-3 text-center text-[12px] font-semibold text-black"
          >
            Publish Ticket
          </button>
        </div>
      </div>
    </main>
  );
}
