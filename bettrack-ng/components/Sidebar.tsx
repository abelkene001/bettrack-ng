// components/Sidebar.tsx
"use client";

import Link from "next/link";

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 transition-opacity ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />
      {/* Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-72 bg-[#0e1416] border-r border-white/10 transform transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="font-semibold">Menu</div>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 bg-white/5 hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        <nav className="px-2 py-2 space-y-1">
          <Link
            href="/"
            className="block rounded-lg px-3 py-2 hover:bg-white/5"
          >
            🏠 Home
          </Link>
          <Link
            href="/browse"
            className="block rounded-lg px-3 py-2 hover:bg-white/5"
          >
            🔎 Browse Tipsters
          </Link>
          <Link
            href="/tickets"
            className="block rounded-lg px-3 py-2 hover:bg-white/5"
          >
            🎫 My Tickets
          </Link>
          <Link
            href="/profile"
            className="block rounded-lg px-3 py-2 hover:bg-white/5"
          >
            👤 Profile
          </Link>

          <div className="my-2 h-px bg-white/10" />

          <Link
            href="/tipster/new"
            className="block rounded-lg px-3 py-2 bg-fuchsia-600/20 text-fuchsia-300 hover:bg-fuchsia-600/30"
          >
            ➕ Post Ticket
          </Link>

          <div className="my-2 h-px bg-white/10" />

          {/* Future: wallet, withdrawals, notifications */}
          <button
            disabled
            className="block w-full text-left rounded-lg px-3 py-2 text-white/40 bg-white/5 cursor-not-allowed"
          >
            💳 Wallet (soon)
          </button>
          <button
            disabled
            className="block w-full text-left rounded-lg px-3 py-2 text-white/40 bg-white/5 cursor-not-allowed"
          >
            🔔 Notifications (soon)
          </button>
        </nav>
      </aside>
    </>
  );
}
