// components/Navigation.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";

export default function Navigation() {
    const pathname = usePathname();
    const router = useRouter();

    const navItems = [
        {
            name: "Home",
            path: "/",
            icon: (active: boolean) => (
                <svg
                    className={`w-6 h-6 ${active ? "text-purple-400" : "text-white/60"}`}
                    fill={active ? "currentColor" : "none"}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                </svg>
            ),
        },
        {
            name: "Studio",
            path: "/studio",
            icon: (active: boolean) => (
                <svg
                    className={`w-6 h-6 ${active ? "text-purple-400" : "text-white/60"}`}
                    fill={active ? "currentColor" : "none"}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                    />
                </svg>
            ),
        },
        {
            name: "Profile",
            path: "/profile",
            icon: (active: boolean) => (
                <svg
                    className={`w-6 h-6 ${active ? "text-purple-400" : "text-white/60"}`}
                    fill={active ? "currentColor" : "none"}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                </svg>
            ),
        },
    ];

    // Don't show navigation on ticket detail pages
    if (pathname.startsWith("/t/")) {
        return null;
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#14141f]/95 backdrop-blur-lg border-t border-white/10">
            <div className="max-w-md mx-auto px-4">
                <div className="flex items-center justify-around h-16">
                    {navItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <button
                                key={item.path}
                                onClick={() => router.push(item.path)}
                                className="flex flex-col items-center justify-center gap-1 min-w-[60px] transition-all duration-200 active:scale-95"
                            >
                                {item.icon(isActive)}
                                <span
                                    className={`text-xs font-medium ${isActive ? "text-purple-400" : "text-white/60"
                                        }`}
                                >
                                    {item.name}
                                </span>
                                {isActive && (
                                    <div className="absolute bottom-0 w-12 h-1 bg-purple-500 rounded-t-full" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
