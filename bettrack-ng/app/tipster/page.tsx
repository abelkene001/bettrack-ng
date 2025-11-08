"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Profile = {
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
  | { ok: true; user: { id: string; telegram_id: string }; profile: Profile }
  | { ok: false; error: string };

export default function TipsterProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile>(null);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch("/api/profile/me", { cache: "no-store" });

        if (res.status === 401) {
          setErr("Open this page from your Telegram bot so we can verify you.");
          setLoading(false);
          return;
        }

        const ctype = res.headers.get("content-type") || "";
        if (!ctype.includes("application/json")) {
          const txt = await res.text();
          setErr(`Server returned non-JSON (status ${res.status}).`);
          setLoading(false);
          return;
        }

        const json = (await res.json()) as MeResponse;
        if (!json.ok) {
          setErr(json.error || "Failed to load profile");
        } else {
          setProfile(json.profile ?? null);
          setDisplayName(json.profile?.display_name ?? "");
          setBio(json.profile?.bio ?? "");
          setPhotoUrl(json.profile?.profile_photo_url ?? "");
        }
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function saveProfile() {
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch("/api/profile/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          bio,
          profile_photo_url: photoUrl || null,
        }),
      });

      if (res.status === 401) {
        setErr("Please open from your Telegram bot so we can verify you.");
        setSaving(false);
        return;
      }

      const ctype = res.headers.get("content-type") || "";
      if (!ctype.includes("application/json")) {
        const txt = await res.text();
        setErr(`Server returned non-JSON (status ${res.status}).`);
        setSaving(false);
        return;
      }

      const json = await res.json();
      if (!json.ok) {
        setErr(json.error || "Save failed");
      } else {
        setProfile(json.profile);
        alert(json.created ? "Profile created ✅" : "Profile updated ✅");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex flex-col gap-4">
      <header className="rounded-2xl bg-white/5 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Tipster Profile</h1>
        </div>
      </header>

      {loading ? (
        <div className="rounded-2xl bg-white/5 p-4">Loading…</div>
      ) : (
        <>
          {err && (
            <div className="rounded-2xl bg-red-500/20 p-4 text-sm text-red-200">
              {err}
            </div>
          )}

          <section className="rounded-2xl bg-white/5 p-4 shadow-sm">
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
              onClick={saveProfile}
              disabled={saving}
              className="w-full rounded-xl bg-white text-[#0b0f10] py-3 text-sm font-semibold"
            >
              {saving
                ? "Saving…"
                : profile
                ? "Update Profile"
                : "Create Profile"}
            </button>
          </section>

          {profile && (
            <section className="rounded-2xl bg-white/5 p-4 shadow-sm">
              <h2 className="mb-3 text-base font-semibold">Public Preview</h2>
              <div className="flex items-center gap-3">
                {profile.profile_photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.profile_photo_url}
                    alt="Profile"
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-white/10" />
                )}
                <div>
                  <div className="font-semibold">{profile.display_name}</div>
                  <div className="text-xs text-white/60">
                    Followers: {profile.total_followers ?? 0} • Tickets:{" "}
                    {profile.total_tickets_posted ?? 0} • Sold:{" "}
                    {profile.total_tickets_sold ?? 0}
                  </div>
                </div>
              </div>
              {profile.bio && (
                <p className="mt-3 text-sm text-white/80">{profile.bio}</p>
              )}
            </section>
          )}
        </>
      )}
    </main>
  );
}
