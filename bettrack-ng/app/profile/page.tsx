// app/profile/page.tsx
"use client";

import { useContext, useEffect, useState } from "react";
import { TelegramContext } from "../../components/TelegramProvider";

type Role = "tipster" | "bettor" | "both";

type ProfileRow = {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  profile_photo_url: string | null;
  total_followers: number;
  total_tickets_posted: number;
  total_tickets_sold: number;
  average_rating: number | null;
  is_verified: boolean;
  created_at: string;
} | null;

type MeResponse =
  | {
      ok: true;
      user: {
        id: string;
        role: Role;
        username?: string | null;
        first_name?: string | null;
      };
      profile: ProfileRow;
    }
  | { ok: false; error: string };

function getErr(e: unknown) {
  return e instanceof Error ? e.message : "Unknown error";
}

export default function ProfilePage() {
  const { userName } = useContext(TelegramContext);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [role, setRole] = useState<Role>("bettor");
  const [profile, setProfile] = useState<ProfileRow>(null);

  // form fields for tipster studio
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch("/api/profile/me", { cache: "no-store" });
        const ctype = res.headers.get("content-type") || "";
        if (!ctype.includes("application/json")) {
          setErr(`Server returned non-JSON (${res.status})`);
          setLoading(false);
          return;
        }
        const json: MeResponse = await res.json();
        if (!json.ok) {
          setErr(json.error || "Failed to load");
        } else {
          setRole(json.user.role || "bettor");
          setProfile(json.profile ?? null);
          setDisplayName(json.profile?.display_name ?? (userName || ""));
          setBio(json.profile?.bio ?? "");
          setPhotoUrl(json.profile?.profile_photo_url ?? "");
        }
      } catch (e) {
        setErr(getErr(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [userName]);

  async function becomeTipster() {
    setErr(null);
    try {
      const res = await fetch("/api/profile/become", { method: "POST" });
      const ctype = res.headers.get("content-type") || "";
      if (!ctype.includes("application/json")) {
        setErr(`Server returned non-JSON (${res.status})`);
        return;
      }
      const json: { ok: boolean; error?: string } = await res.json();
      if (!json.ok) {
        setErr(json.error || "Failed to become a tipster");
        return;
      }
      setRole("tipster");
      // create initial profile with Telegram name as default
      if (!displayName) setDisplayName(userName || "Tipster");
      alert("You are now a Tipster ✅");
      const el = document.getElementById("studio");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } catch (e) {
      setErr(getErr(e));
    }
  }

  async function saveStudio() {
    setErr(null);
    try {
      const res = await fetch("/api/profile/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName.trim(),
          bio: bio.trim(),
          profile_photo_url: photoUrl.trim() || null,
        }),
      });
      const ctype = res.headers.get("content-type") || "";
      if (!ctype.includes("application/json")) {
        setErr(`Server returned non-JSON (${res.status})`);
        return;
      }
      const json: {
        ok: boolean;
        profile?: NonNullable<ProfileRow>;
        error?: string;
      } = await res.json();
      if (!json.ok || !json.profile) {
        setErr(json.error || "Save failed");
      } else {
        setProfile(json.profile);
        alert("Saved ✅");
      }
    } catch (e) {
      setErr(getErr(e));
    }
  }

  return (
    <main className="flex flex-col gap-4 p-4 pb-20">
      <section className="rounded-2xl bg-white/5 p-4 shadow-sm">
        <h1 className="text-lg font-semibold">Profile</h1>
        <p className="text-xs text-white/60">
          Signed in as{" "}
          <span className="font-semibold">{userName || "Guest"}</span>
        </p>
      </section>

      {loading && <div className="rounded-2xl bg-white/5 p-4">Loading…</div>}
      {err && (
        <div className="rounded-2xl bg-red-500/20 p-3 text-sm text-red-200">
          {err}
        </div>
      )}

      {/* Bettor view */}
      <section className="rounded-2xl bg-white/5 p-4 shadow-sm">
        <div className="mb-2 text-sm font-semibold">Account Type</div>
        <div className="mb-3 text-sm">
          {role === "tipster" || role === "both" ? "Tipster" : "Bettor"}
        </div>

        {role === "bettor" && (
          <button
            onClick={becomeTipster}
            className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-[#0b0f10]"
          >
            Become a Tipster
          </button>
        )}
      </section>

      {/* Tipster Studio */}
      {(role === "tipster" || role === "both") && (
        <section
          id="studio"
          className="rounded-2xl bg-white/5 p-4 shadow-sm scroll-mt-16"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Tipster Studio</h2>
            <div className="text-xs text-white/60">
              Followers: {profile?.total_followers ?? 0} • Following: 0
            </div>
          </div>

          <div className="mb-3">
            <label className="mb-1 block text-xs text-white/60">
              Display Name
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl bg-white/10 p-3 text-sm outline-none"
              placeholder="e.g. Lagos Sure Odds"
            />
          </div>

          <div className="mb-3">
            <label className="mb-1 block text-xs text-white/60">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-xl bg-white/10 p-3 text-sm outline-none"
              placeholder="Your style, leagues, typical odds, etc."
              rows={4}
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-xs text-white/60">
              Profile Photo URL (optional)
            </label>
            <input
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="w-full rounded-xl bg-white/10 p-3 text-sm outline-none"
              placeholder="https://…"
            />
          </div>

          <button
            onClick={saveStudio}
            className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-[#0b0f10]"
          >
            Save
          </button>

          {/* Quick actions */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                window.location.href = "/tipster/new";
              }}
              className="rounded-xl bg-white/10 px-3 py-3 text-sm"
            >
              ➕ Post FREE Ticket
            </button>
            <button
              onClick={() => {
                window.location.href = "/tickets";
              }}
              className="rounded-xl bg-white/10 px-3 py-3 text-sm"
            >
              📋 My Tickets
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
