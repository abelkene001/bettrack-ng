// app/tipster/new/page.tsx
"use client";

import { useState } from "react";
import AppShell from "../../../components/AppShell";

type Bookmaker = "bet9ja" | "sportybet" | "1xbet" | "betking" | "other";
type TicketType = "free" | "premium";

export default function NewTicketPage() {
  const [type, setType] = useState<TicketType>("free");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [totalOdds, setTotalOdds] = useState("");
  const [bookmaker, setBookmaker] = useState<Bookmaker>("bet9ja");
  const [confidence, setConfidence] = useState("");
  const [price, setPrice] = useState(""); // in naira (we convert to kobo)
  const [matchDetails, setMatchDetails] = useState("");
  const [bookingCode, setBookingCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const isPremium = type === "premium";

  const canSubmit =
    title.trim().length > 2 &&
    description.trim().length > 2 &&
    totalOdds.trim() !== "" &&
    !Number.isNaN(Number(totalOdds)) &&
    confidence.trim() !== "" &&
    !Number.isNaN(Number(confidence)) &&
    bookmaker &&
    matchDetails.trim().length > 2 &&
    bookingCode.trim().length > 0 &&
    (!isPremium || (price.trim() !== "" && !Number.isNaN(Number(price))));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setMsg(null);

    try {
      const payload = {
        type,
        title,
        description,
        total_odds: Number(totalOdds),
        bookmaker,
        confidence_level: Number(confidence),
        price: isPremium ? Math.round(Number(price) * 100) : null, // kobo
        match_details: safeJsonParse(matchDetails),
        booking_code: bookingCode.trim(),
      };

      if (
        !Array.isArray(payload.match_details) ||
        payload.match_details.length === 0
      ) {
        setMsg(
          'Match details must be a JSON array like: [{"match":"Arsenal vs Chelsea","pick":"Home Win"}]'
        );
        setSubmitting(false);
        return;
      }

      const res = await fetch("/api/tickets/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json: { ok?: boolean; message?: string } = await res.json();
      if (!res.ok || !json?.ok) {
        setMsg(json?.message ?? "Failed to create ticket");
      } else {
        setMsg("Ticket created successfully!");
        setTitle("");
        setDescription("");
        setTotalOdds("");
        setConfidence("");
        setPrice("");
        setMatchDetails("");
        setBookingCode("");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create ticket";
      setMsg(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="Post Ticket" showPostButton={false}>
      <form onSubmit={onSubmit} className="space-y-4 pb-24">
        {/* type */}
        <div>
          <label className="text-sm text-white/70">Type</label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType("free")}
              className={`rounded-xl px-3 py-2 border ${
                type === "free"
                  ? "border-fuchsia-400 bg-fuchsia-500/10"
                  : "border-white/10 bg-white/5"
              }`}
            >
              Free
            </button>
            <button
              type="button"
              onClick={() => setType("premium")}
              className={`rounded-xl px-3 py-2 border ${
                type === "premium"
                  ? "border-fuchsia-400 bg-fuchsia-500/10"
                  : "border-white/10 bg-white/5"
              }`}
            >
              Premium
            </button>
          </div>
        </div>

        <Input
          label="Title"
          value={title}
          onValueChange={(v) => setTitle(v)}
          placeholder="e.g. 5-game accumulator"
        />
        <TextArea
          label="Description"
          value={description}
          onValueChange={(v) => setDescription(v)}
          placeholder="Short summary…"
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Total Odds"
            value={totalOdds}
            onValueChange={(v) => setTotalOdds(v)}
            placeholder="e.g. 25.4"
            type="number"
            min="1"
            step="0.01"
          />
          <Input
            label="Confidence (1-10)"
            value={confidence}
            onValueChange={(v) => setConfidence(v)}
            placeholder="e.g. 8"
            type="number"
            min="1"
            max="10"
          />
        </div>

        <div>
          <label className="text-sm text-white/70">Bookmaker</label>
          <select
            className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2"
            value={bookmaker}
            onChange={(e) => setBookmaker(e.target.value as Bookmaker)}
          >
            <option value="bet9ja">Bet9ja</option>
            <option value="sportybet">SportyBet</option>
            <option value="1xbet">1xBet</option>
            <option value="betking">BetKing</option>
            <option value="other">Other</option>
          </select>
        </div>

        {isPremium && (
          <Input
            label="Price (₦)"
            value={price}
            onValueChange={(v) => setPrice(v)}
            placeholder="e.g. 500"
            type="number"
            min="50"
            step="10"
          />
        )}

        <TextArea
          label="Match Details (JSON array)"
          value={matchDetails}
          onValueChange={(v) => setMatchDetails(v)}
          placeholder='[{"match":"Arsenal vs Chelsea","pick":"Home Win"},{"match":"Man City vs Spurs","pick":"Over 2.5"}]'
          rows={5}
        />

        <Input
          label="Booking Code"
          value={bookingCode}
          onValueChange={(v) => setBookingCode(v)}
          placeholder="e.g. 6ABCD1"
        />

        {msg && <div className="text-sm text-red-300">{msg}</div>}

        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className={`w-full rounded-xl px-4 py-3 font-semibold ${
            !canSubmit || submitting
              ? "bg-white/10 text-white/40 cursor-not-allowed"
              : "bg-fuchsia-600 hover:bg-fuchsia-500"
          }`}
        >
          {submitting ? "Posting…" : "Post Ticket"}
        </button>
      </form>
    </AppShell>
  );
}

function Input({
  label,
  value,
  onValueChange,
  placeholder,
  type = "text",
  ...rest
}: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  placeholder?: string;
  type?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <div>
      <label className="text-sm text-white/70">{label}</label>
      <input
        {...rest}
        type={type}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onValueChange,
  placeholder,
  rows = 3,
  ...rest
}: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
} & Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "onChange" | "value"
>) {
  return (
    <div>
      <label className="text-sm text-white/70">{label}</label>
      <textarea
        {...rest}
        rows={rows}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2"
      />
    </div>
  );
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
