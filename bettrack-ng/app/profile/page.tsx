"use client";
import { useContext } from "react";
import { TelegramContext } from "../../components/TelegramProvider";

export default function ProfilePage() {
  const { userName } = useContext(TelegramContext);

  return (
    <main className="flex flex-col gap-4">
      <header className="rounded-2xl bg-white/5 p-4 shadow-sm">
        <h1 className="text-lg font-semibold">Profile</h1>
        <p className="text-xs text-white/60">
          Signed in as {userName || "Guest"}
        </p>
      </header>

      <section className="rounded-2xl bg-white/5 p-4 shadow-sm">
        <h2 className="mb-2 text-base font-semibold">Following</h2>
        <p className="text-sm text-white/60">
          You’re not following anyone yet.
        </p>
      </section>

      <section className="rounded-2xl bg-white/5 p-4 shadow-sm">
        <h2 className="mb-2 text-base font-semibold">Followers</h2>
        <p className="text-sm text-white/60">No followers yet.</p>
      </section>

      <section className="rounded-2xl bg-white/5 p-4 shadow-sm">
        <h2 className="mb-2 text-base font-semibold">My Tickets</h2>
        <p className="text-sm text-white/60">
          You haven’t posted any tickets yet.
        </p>
      </section>
    </main>
  );
}
