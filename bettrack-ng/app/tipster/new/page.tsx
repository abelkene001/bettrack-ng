// app/tipster/new/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

type Bookmaker = "bet9ja" | "sportybet" | "1xbet" | "betking" | "other";

type ApiResult = { ok: true; id: string } | { ok: false; error: string };

type MatchRow = { home: string; away: string; pick: string; odds: number };

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
}

function toBookmaker(value: string): Bookmaker {
  if (
    value === "bet9ja" ||
    value === "sportybet" ||
    value === "1xbet" ||
    value === "betking" ||
    value === "other"
  ) {
    return value;
  }
  return "other";
}

export default function NewTicketPage() {
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bookmaker, setBookmaker] = useState<Bookmaker>("bet9ja");
  const [totalOdds, setTotalOdds] = useState<string>("");
  const [confidence, setConfidence] = useState<string>("");
  const [bookingCode, setBookingCode] = useState("");
  const [matches, setMatches] = useState<MatchRow[]>([
    { home: "", away: "", pick: "", odds: 1.0 },
  ]);

  function addMatch() {
    setMatches((m) => [...m, { home: "", away: "", pick: "", odds: 1.0 }]);
  }
  function updateMatch<K extends keyof MatchRow>(
    i: number,
    key: K,
    value: MatchRow[K] | string
  ) {
    setMatches((m) => {
      const copy = [...m];
      const row = { ...copy[i] };
      if (key === "odds") {
        row.odds = typeof value === "number" ? value : Number(value);
      } else {
        row[key] = String(value) as MatchRow[K];
      }
      copy[i] = row;
      return copy;
    });
  }
  function removeMatch(i: number) {
    setMatches((m) => m.filter((_, idx) => idx !== i));
  }

  async function submit() {
    setSaving(true);
    setErr(null);
    try {
      const payload = {
        type: "free" as const,
        title: title.trim(),
        description: description.trim() || null,
        bookmaker,
        total_odds: totalOdds ? Number(totalOdds) : null,
        confidence_level: confidence ? Number(confidence) : null,
        match_details: matches.map((m) => ({
          home: m.home.trim(),
          away: m.away.trim(),
          pick: m.pick.trim(),
          odds: Number(m.odds),
        })),
        booking_code: bookingCode.trim() || null,
      };

      const res = await fetch("/api/tickets/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        setErr("Open from your Telegram bot so we can verify you.");
        setSaving(false);
        return;
      }

      const ctype = res.headers.get("content-type") || "";
      if (!ctype.includes("application/json")) {
        setErr(`Server returned non-JSON (status ${res.status}).`);
        setSaving(false);
        return;
      }

      const json: ApiResult = await res.json();
      if (!json.ok) {
        setErr(json.error || "Failed to create ticket");
      } else {
        alert("Ticket posted ✅");
        window.location.href = "/tickets";
      }
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex flex-col gap-4">
      <header className="rounded-2xl bg-white/5 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Post FREE Ticket</h1>
          <div className="flex gap-3">
            <Link href="/tipster" className="text-xs underline">
              Tipster
            </Link>
            <Link href="/tickets" className="text-xs underline">
              Feed
            </Link>
          </div>
        </div>
        <p className="mt-2 text-xs text-white/60">
          Free tickets show full match details & booking code to everyone.
        </p>
      </header>

      {err && (
        <div className="rounded-2xl bg-red-500/20 p-3 text-sm text-red-200">
          {err}
        </div>
      )}

      <section className="rounded-2xl bg-white/5 p-4 shadow-sm">
        <div className="mb-3">
          <label className="mb-1 block text-xs text-white/60">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl bg-white/10 p-3 text-sm outline-none"
            placeholder="e.g. 3-game accumulator (EPL)"
          />
        </div>

        <div className="mb-3">
          <label className="mb-1 block text-xs text-white/60">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl bg-white/10 p-3 text-sm outline-none"
            placeholder="Short summary of your angle."
            rows={3}
          />
        </div>

        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-white/60">
              Bookmaker
            </label>
            <select
              value={bookmaker}
              onChange={(e) => setBookmaker(toBookmaker(e.target.value))}
              className="w-full rounded-xl bg-white/10 p-3 text-sm outline-none"
            >
              <option value="bet9ja">Bet9ja</option>
              <option value="sportybet">SportyBet</option>
              <option value="1xbet">1xBet</option>
              <option value="betking">BetKing</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/60">
              Total Odds
            </label>
            <input
              value={totalOdds}
              onChange={(e) => setTotalOdds(e.target.value)}
              className="w-full rounded-xl bg-white/10 p-3 text-sm outline-none"
              placeholder="e.g. 12.5"
              inputMode="decimal"
            />
          </div>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-white/60">
              Confidence (1–10)
            </label>
            <input
              value={confidence}
              onChange={(e) => setConfidence(e.target.value)}
              className="w-full rounded-xl bg-white/10 p-3 text-sm outline-none"
              placeholder="e.g. 7"
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/60">
              Booking Code (optional)
            </label>
            <input
              value={bookingCode}
              onChange={(e) => setBookingCode(e.target.value)}
              className="w-full rounded-xl bg-white/10 p-3 text-sm outline-none"
              placeholder="e.g. 5GHJ2S"
            />
          </div>
        </div>

        <div className="mb-2 text-sm font-semibold">Matches</div>

        <div className="mb-3 space-y-3">
          {matches.map((m, i) => (
            <div key={`match-${i}`} className="rounded-xl bg-white/10 p-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={m.home}
                  onChange={(e) => updateMatch(i, "home", e.target.value)}
                  className="rounded-lg bg-white/10 p-2 text-sm outline-none"
                  placeholder="Home team"
                />
                <input
                  value={m.away}
                  onChange={(e) => updateMatch(i, "away", e.target.value)}
                  className="rounded-lg bg-white/10 p-2 text-sm outline-none"
                  placeholder="Away team"
                />
                <input
                  value={m.pick}
                  onChange={(e) => updateMatch(i, "pick", e.target.value)}
                  className="rounded-lg bg-white/10 p-2 text-sm outline-none"
                  placeholder="Pick (e.g. Home Win)"
                />
                <input
                  value={String(m.odds)}
                  onChange={(e) => updateMatch(i, "odds", e.target.value)}
                  className="rounded-lg bg-white/10 p-2 text-sm outline-none"
                  placeholder="Odds (e.g. 1.75)"
                  inputMode="decimal"
                />
              </div>
              <div className="mt-2 text-right">
                {matches.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMatch(i)}
                    className="rounded-lg bg-white/10 px-3 py-2 text-xs"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addMatch}
          className="mb-4 w-full rounded-xl bg-white/10 py-2 text-sm"
        >
          + Add Match
        </button>

        <button
          onClick={submit}
          disabled={saving}
          className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-[#0b0f10] disabled:opacity-70"
        >
          {saving ? "Posting…" : "Post FREE Ticket"}
        </button>
      </section>

      <div className="pb-20" />
    </main>
  );
}
