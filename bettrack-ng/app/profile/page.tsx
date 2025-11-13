// app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import ProfileHeader from "../../components/ProfileHeader";
import TicketCard from "../../components/FeedCard";
import { useRouter } from "next/navigation";

type Role = "tipster" | "bettor" | "both";
type TipsterProfile = {
  display_name: string;
  bio: string | null;
  profile_photo_url: string | null;
  total_followers: number;
  total_tickets_posted: number;
  total_tickets_sold: number;
  average_rating: number | null;
};
type TicketBrief = {
  id: string;
  type: "free" | "premium";
  title: string;
  description: string | null;
  total_odds: number | null;
  bookmaker: "bet9ja" | "sportybet" | "1xbet" | "betking" | "other" | null;
  confidence_level: number | null;
  match_details: unknown;
  booking_code: string | null;
  status: "pending" | "won" | "lost";
  posted_at: string;
  tipster: {
    display_name: string;
    profile_photo_url: string | null;
    is_verified: boolean;
  } | null;
};

export default function MyProfilePage() {
  const router = useRouter();

  const [role, setRole] = useState<Role>("bettor");
  const [profile, setProfile] = useState<TipsterProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editPhoto, setEditPhoto] = useState("");

  const [posts, setPosts] = useState<TicketBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // load user + tipster profile + my posts
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const ures = await fetch("/api/profile/me", { cache: "no-store" });
        const ujson = await ures.json();
        if (!ujson.ok) throw new Error(ujson.error || "profile load failed");
        const r: Role = ujson.user?.role ?? "bettor";
        setRole(r);

        if (r === "tipster" || r === "both") {
          const pres = await fetch("/api/profile/me?with=tipster", {
            cache: "no-store",
          });
          const pjson = await pres.json();
          if (pjson?.profile) {
            const tp: TipsterProfile = pjson.profile as TipsterProfile;
            setProfile(tp);
            setEditName(tp.display_name);
            setEditBio(tp.bio ?? "");
            setEditPhoto(tp.profile_photo_url ?? "");
          }
          const tRes = await fetch(
            "/api/tickets/mine?mode=tipster&status=all&range=all",
            { cache: "no-store" }
          );
          const tJson = await tRes.json();
          if (tJson.ok) setPosts(tJson.items as TicketBrief[]);
        }
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Load failed");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    setErr(null);
    try {
      const payload = {
        display_name: editName.trim(),
        bio: editBio.trim() || null,
        profile_photo_url: editPhoto.trim() || null,
      };
      const res = await fetch("/api/profile/upsert", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "save failed");

      setProfile({
        display_name: payload.display_name,
        bio: payload.bio,
        profile_photo_url: payload.profile_photo_url,
        total_followers: profile?.total_followers ?? 0,
        total_tickets_posted: profile?.total_tickets_posted ?? 0,
        total_tickets_sold: profile?.total_tickets_sold ?? 0,
        average_rating: profile?.average_rating ?? null,
      });
      setIsEditing(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const headerName = profile?.display_name ?? "My Profile";

  // use the loading state (fixes "assigned but never used")
  if (loading) {
    return (
      <main className="p-4 pb-20">
        <div className="animate-pulse space-y-3">
          <div className="h-20 rounded-2xl bg-white/10" />
          <div className="h-24 rounded-2xl bg-white/10" />
          <div className="h-24 rounded-2xl bg-white/10" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-4 p-4 pb-20">
      <header className="rounded-2xl bg-white/5 p-4 shadow-sm">
        <div className="text-sm font-semibold">Profile</div>
      </header>

      {err && (
        <div className="rounded-2xl bg-red-500/20 p-3 text-sm text-red-200">
          {err}
        </div>
      )}

      {role === "tipster" || role === "both" ? (
        <>
          <ProfileHeader
            photoUrl={profile?.profile_photo_url ?? null}
            name={headerName}
            bio={profile?.bio ?? null}
            followers={profile?.total_followers ?? 0}
            following={0}
            posts={posts.length}
            rating={profile?.average_rating ?? null}
            isEditing={isEditing}
            onToggleEdit={() => setIsEditing((v) => !v)}
          />

          {isEditing && (
            <section className="rounded-2xl bg-white/5 p-4 space-y-3">
              <div>
                <div className="mb-1 text-sm">Display Name</div>
                <input
                  className="w-full rounded-xl bg-white/10 px-3 py-2 text-sm outline-none"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div>
                <div className="mb-1 text-sm">Bio</div>
                <textarea
                  className="w-full rounded-xl bg-white/10 px-3 py-2 text-sm outline-none"
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                />
              </div>
              <div>
                <div className="mb-1 text-sm">Profile Photo URL</div>
                <input
                  className="w-full rounded-xl bg-white/10 px-3 py-2 text-sm outline-none"
                  value={editPhoto}
                  onChange={(e) => setEditPhoto(e.target.value)}
                />
              </div>
              <button
                onClick={saveProfile}
                disabled={saving || !editName.trim()}
                className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold ${
                  saving || !editName.trim()
                    ? "bg-white/20 text-white/60"
                    : "bg-white text-[#0b0f10]"
                }`}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </section>
          )}

          <section className="space-y-3">
            {posts.map((t) => (
              <TicketCard
                key={t.id}
                item={t}
                onClick={() => router.push(`/t/${t.id}`)}
              />
            ))}
            {!posts.length && (
              <div className="rounded-2xl bg-white/5 p-4 text-sm text-white/70">
                No posts yet. Use the sidebar → Post FREE Ticket.
              </div>
            )}
          </section>
        </>
      ) : (
        <div className="rounded-2xl bg-white/5 p-4 text-sm text-white/80">
          You’re a Bettor. Go to Profile → “Become a Tipster” to create your
          tipster profile.
        </div>
      )}
    </main>
  );
}
