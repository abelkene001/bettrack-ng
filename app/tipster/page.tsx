// app/tipster/page.tsx
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

type MeResponse = {
  ok: boolean;
  user?: {
    // ✅ Fixed
    id: string;
    telegram_id: string;
    name?: string;
    subscription_tier?: string;
  };
  profile?: Profile;
  error?: string;
};

export default function TipsterProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile>(null);

  // form fields
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch("/api/profile/me");
        const json: MeResponse = await res.json();
        if (!json.ok) {
          setErr(json.error || "Failed to load profile");
        } else {
          setProfile(json.profile ?? null);
          setDisplayName(json.profile?.display_name ?? "");
          setBio(json.profile?.bio ?? "");
          setPhotoUrl(json.profile?.profile_photo_url ?? "");
        }
      } catch (e) {
        // ✅ Fixed - removed : any
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
      const json = await res.json();
      if (!json.ok) {
        setErr(json.error || "Save failed");
      } else {
        setProfile(json.profile);
        alert(json.created ? "Profile created ✅" : "Profile updated ✅");
      }
    } catch (e) {
      // ✅ Fixed - removed : any
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tipster Profile</h1>
        <Link href="/" className="text-sm underline">
          Home
        </Link>
      </header>

      {loading ? (
        <div className="card">Loading…</div>
      ) : (
        <>
          {err && <div className="card text-red-300">Error: {err}</div>}

          <section className="card">
            <label className="mb-2 block text-sm text-white/70">
              Display Name
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mb-3 w-full rounded-lg bg-white/10 p-3 outline-none"
              placeholder="e.g. Lagos Sure Odds"
            />

            <label className="mb-2 block text-sm text-white/70">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="mb-3 w-full rounded-lg bg-white/10 p-3 outline-none"
              placeholder="Tell bettors about your style, leagues, average odds, etc."
              rows={4}
            />

            <label className="mb-2 block text-sm text-white/70">
              Profile Photo URL (optional)
            </label>
            <input
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="mb-4 w-full rounded-lg bg-white/10 p-3 outline-none"
              placeholder="https://…"
            />

            <button
              onClick={saveProfile}
              disabled={saving}
              className="btn-primary"
            >
              {saving
                ? "Saving…"
                : profile
                ? "Update Profile"
                : "Create Profile"}
            </button>
          </section>

          {profile && (
            <section className="card">
              <h2 className="mb-2 text-xl font-semibold">Public Preview</h2>
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
