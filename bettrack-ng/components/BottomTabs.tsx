// components/BottomTabs.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Home", emoji: "🏠" },
  { href: "/browse", label: "Browse", emoji: "🔎" },
  { href: "/tickets", label: "Tickets", emoji: "🎫" },
  { href: "/profile", label: "Profile", emoji: "👤" },
];

export default function BottomTabs() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0b0f10]/90 backdrop-blur">
      <ul className="mx-auto flex max-w-md items-center justify-between px-3 py-2">
        {tabs.map((t) => {
          const active = pathname === t.href;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={`flex flex-col items-center text-[11px] ${
                  active ? "text-white" : "text-white/60"
                }`}
              >
                <span className="text-lg leading-none">{t.emoji}</span>
                <span className="mt-1">{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
