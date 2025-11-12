// app/tipster/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Bookmaker = "bet9ja" | "sportybet" | "1xbet" | "betking" | "other";
type TicketType = "free" | "premium";
type MatchRow = {
  home: string;
  away: string;
  pick: string;
  odds: number | string;
};

const BOOKMAKERS: { label: string; value: Bookmaker }[] = [
  { label: "Bet9ja", value: "bet9ja" },
  { label: "SportyBet", value: "sportybet" },
  { label: "1xBet", value: "1xbet" },
  { label: "BetKing", value: "betking" },
  { label: "Other", value: "other" },
];

export default function NewTicketPage() {
  const router = useRouter();

  const [type, setType] = useState<TicketType>("free");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bookmaker, setBookmaker] = useState<Bookmaker>("bet9ja");
  const [confidence, setConfidence] = useState<number>(7);
  const [totalOdds, setTotalOdds] = useState<string>("2.00");
  const [matches, setMatches] = useState<MatchRow[]>([
    { home: "", away: "", pick: "", odds: "" },
  ]);

  const [priceNaira, setPriceNaira] = useState<string>("500"); // for premium
  const [bookingCode, setBookingCode] = useState<string>(""); // for premium

  const [posting, setPosting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = (): boolean => {
    if (!title || title.trim().length < 3) return false;
    if (!bookmaker) return false;
    if (!confidence || confidence < 1 || confidence > 10) return false;
    const to = Number(totalOdds);
    if (!Number.isFinite(to) || to <= 1) return false;
    if (!matches.length) return false;
    for (const m of matches) {
      const o = Number(m.odds);
      if (!m.home || !m.away || !m.pick || !Number.isFinite(o) || o <= 1)
        return false;
    }
    if (type === "premium") {
      const kobo = Math.round(Number(priceNaira) * 100);
      if (!Number.isFinite(kobo) || kobo <= 0) return false;
      if (!bookingCode.trim()) return false;
    }
    return true;
  };

  const addMatch = () =>
    setMatches((prev) => [...prev, { home: "", away: "", pick: "", odds: "" }]);

  const updateMatch = (idx: number, patch: Partial<MatchRow>) =>
    setMatches((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, ...patch } : m))
    );

  const removeMatch = (idx: number) =>
    setMatches((prev) => prev.filter((_, i) => i !== idx));

  const submit = async () => {
    setErr(null);
    if (!canSubmit()) {
      setErr("Please fill all fields correctly.");
      return;
    }
    setPosting(true);
    try {
      const payload = {
        type,
        title: title.trim(),
        description: description.trim() || null,
        bookmaker,
        confidence_level: confidence,
        total_odds: Number(totalOdds),
        match_details: matches.map((m) => ({
          home: m.home.trim(),
          away: m.away.trim(),
          pick: m.pick.trim(),
          odds: Number(m.odds),
        })),
        ...(type === "premium"
          ? {
              price: Math.round(Number(priceNaira) * 100), // kobo
              booking_code: bookingCode.trim(),
            }
          : {}),
      };
      const res = await fetch("/api/tickets/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const ctype = res.headers.get("content-type") || "";
      if (!ctype.includes("application/json")) {
        setErr(`Server error (${res.status})`);
        setPosting(false);
        return;
      }
      const json = await res.json();
      if (!json.ok) {
        setErr(json.error || "Failed to post");
        setPosting(false);
        return;
      }
      // go to tickets dashboard
      router.push("/tickets");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setPosting(false);
    }
  };

  return (
    <main className="flex flex-col gap-4 p-4 pb-20">
      <header className="rounded-2xl bg-white/5 p-4 shadow-sm">
        <div className="text-sm font-semibold">Post a Ticket</div>
      </header>

      {err && (
        <div className="rounded-2xl bg-red-500/20 p-3 text-sm text-red-200">
          {err}
        </div>
      )}

      <section className="space-y-3">
        {/* type */}
        <div className="rounded-2xl bg-white/5 p-4">
          <div className="mb-2 text-sm font-semibold">Type</div>
          <div className="flex gap-2">
            <button
              onClick={() => setType("free")}
              className={`rounded-xl px-3 py-2 text-xs ${
                type === "free"
                  ? "bg-white text-[#0b0f10] font-semibold"
                  : "bg-white/10 text-white"
              }`}
            >
              FREE
            </button>
            <button
              onClick={() => setType("premium")}
              className={`rounded-xl px-3 py-2 text-xs ${
                type === "premium"
                  ? "bg-white text-[#0b0f10] font-semibold"
                  : "bg-white/10 text-white"
              }`}
            >
              PREMIUM
            </button>
          </div>
        </div>

        {/* main fields */}
        <div className="rounded-2xl bg-white/5 p-4 space-y-3">
          <div>
            <div className="mb-1 text-sm">Title</div>
            <input
              className="w-full rounded-xl bg-white/10 px-3 py-2 text-sm outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., 5-game ACCA | 25.40 odds"
            />
          </div>

          <div>
            <div className="mb-1 text-sm">Description (optional)</div>
            <textarea
              className="w-full rounded-xl bg-white/10 px-3 py-2 text-sm outline-none"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="League focus, risk level, etc."
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="mb-1 text-sm">Bookmaker</div>
              <select
                className="w-full rounded-xl bg-white/10 px-3 py-2 text-sm outline-none"
                value={bookmaker}
                onChange={(e) => setBookmaker(e.target.value as Bookmaker)}
              >
                {BOOKMAKERS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="mb-1 text-sm">Confidence (1–10)</div>
              <input
                type="number"
                min={1}
                max={10}
                className="w-full rounded-xl bg-white/10 px-3 py-2 text-sm outline-none"
                value={confidence}
                onChange={(e) => setConfidence(Number(e.target.value))}
              />
            </div>
            <div>
              <div className="mb-1 text-sm">Total Odds</div>
              <input
                className="w-full rounded-xl bg-white/10 px-3 py-2 text-sm outline-none"
                value={totalOdds}
                onChange={(e) => setTotalOdds(e.target.value)}
                placeholder="e.g., 2.30"
              />
            </div>
          </div>
        </div>

        {/* matches */}
        <div className="rounded-2xl bg-white/5 p-4 space-y-3">
          <div className="mb-2 text-sm font-semibold">Matches</div>
          {matches.map((m, i) => (
            <div key={i} className="grid grid-cols-4 gap-2">
              <input
                className="rounded-xl bg-white/10 px-2 py-2 text-xs outline-none"
                placeholder="Home"
                value={m.home}
                onChange={(e) => updateMatch(i, { home: e.target.value })}
              />
              <input
                className="rounded-xl bg-white/10 px-2 py-2 text-xs outline-none"
                placeholder="Away"
                value={m.away}
                onChange={(e) => updateMatch(i, { away: e.target.value })}
              />
              <input
                className="rounded-xl bg-white/10 px-2 py-2 text-xs outline-none"
                placeholder="Pick"
                value={m.pick}
                onChange={(e) => updateMatch(i, { pick: e.target.value })}
              />
              <input
                className="rounded-xl bg-white/10 px-2 py-2 text-xs outline-none"
                placeholder="Odds"
                value={m.odds}
                onChange={(e) => updateMatch(i, { odds: e.target.value })}
              />
              {matches.length > 1 && (
                <button
                  onClick={() => removeMatch(i)}
                  className="col-span-4 rounded-xl bg-red-500/20 px-3 py-1 text-xs"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addMatch}
            className="rounded-xl bg-white/10 px-3 py-2 text-xs"
          >
            + Add Match
          </button>
        </div>

        {/* Premium fields */}
        {type === "premium" && (
          <div className="rounded-2xl bg-white/5 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="mb-1 text-sm">Price (₦)</div>
                <input
                  className="w-full rounded-xl bg-white/10 px-3 py-2 text-sm outline-none"
                  value={priceNaira}
                  onChange={(e) => setPriceNaira(e.target.value)}
                  placeholder="e.g., 500"
                />
              </div>
              <div>
                <div className="mb-1 text-sm">Booking Code</div>
                <input
                  className="w-full rounded-xl bg-white/10 px-3 py-2 text-sm outline-none"
                  value={bookingCode}
                  onChange={(e) => setBookingCode(e.target.value)}
                  placeholder="e.g., XK2J9"
                />
              </div>
            </div>
            <div className="text-[11px] text-white/70">
              Premium tickets stay locked until a buyer pays. After purchase,
              the buyer sees matches and booking code.
            </div>
          </div>
        )}

        <button
          onClick={submit}
          disabled={posting || !canSubmit()}
          className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold ${
            posting || !canSubmit()
              ? "bg-white/20 text-white/60"
              : "bg-white text-[#0b0f10]"
          }`}
        >
          {posting ? "Posting..." : "Post Ticket"}
        </button>
      </section>
    </main>
  );
}
