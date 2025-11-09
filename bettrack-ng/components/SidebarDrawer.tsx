// components/SidebarDrawer.tsx
"use client";

import { useRouter } from "next/navigation";

type SidebarDrawerProps = {
  open: boolean;
  onClose: () => void;
  isTipster?: boolean;
};

export default function SidebarDrawer({
  open,
  onClose,
  isTipster,
}: SidebarDrawerProps) {
  const router = useRouter();

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={`fixed bottom-0 left-0 top-0 z-50 w-72 transform bg-[#0b0f10] shadow-xl transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="text-sm font-semibold">Menu</div>
          <button
            onClick={onClose}
            className="rounded bg-white/10 px-2 py-1 text-xs"
          >
            Close
          </button>
        </div>

        <nav className="p-3 space-y-2">
          <button
            onClick={() => {
              router.push("/tipster/new");
              onClose();
            }}
            className="w-full rounded-xl bg-white px-3 py-3 text-sm font-semibold text-[#0b0f10]"
          >
            ➕ Post FREE Ticket
          </button>

          <button
            onClick={() => {
              router.push("/tickets");
              onClose();
            }}
            className="w-full rounded-xl bg-white/10 px-3 py-3 text-sm text-left"
          >
            🧾 My Tickets
          </button>

          {isTipster && (
            <button
              onClick={() => {
                router.push("/profile#studio");
                onClose();
              }}
              className="w-full rounded-xl bg-white/10 px-3 py-3 text-sm text-left"
            >
              🎯 Tipster Studio
            </button>
          )}

          <button
            onClick={() => {
              /* TODO: settings page later */ onClose();
            }}
            className="w-full rounded-xl bg-white/10 px-3 py-3 text-sm text-left"
          >
            ⚙️ Settings
          </button>

          <button
            onClick={() => {
              /* TODO: help page later */ onClose();
            }}
            className="w-full rounded-xl bg-white/10 px-3 py-3 text-sm text-left"
          >
            ❓ Help
          </button>
        </nav>
      </aside>
    </>
  );
}
