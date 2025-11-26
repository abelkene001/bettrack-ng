// app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { formatNGN } from "@/lib/paystack";
import type { ApiResponse, PurchaseHistoryItem } from "@/types";

interface UserProfile {
    user: {
        id: string;
        username: string | null;
        first_name: string | null;
        last_name: string | null;
        role: string;
    };
    stats: {
        purchases: number;
    };
    tipster: {
        display_name: string;
        is_approved: boolean;
        is_verified: boolean;
        total_tickets: number;
        success_rate: number | null;
    } | null;
}

export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [purchases, setPurchases] = useState<PurchaseHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"overview" | "purchases">("overview");

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            const initData = window.Telegram?.WebApp?.initData || "";

            // Fetch profile
            const profileResponse = await fetch("/api/user/profile", {
                headers: {
                    "x-telegram-init-data": initData,
                },
                cache: "no-store",
            });

            const profileData: ApiResponse<UserProfile> = await profileResponse.json();

            if (!profileData.ok) {
                throw new Error(profileData.error || "Failed to load profile");
            }

            setProfile(profileData.data);

            // Fetch purchases
            const purchasesResponse = await fetch("/api/user/purchases", {
                headers: {
                    "x-telegram-init-data": initData,
                },
                cache: "no-store",
            });

            const purchasesData: ApiResponse<PurchaseHistoryItem[]> =
                await purchasesResponse.json();

            if (purchasesData.ok) {
                setPurchases(purchasesData.data);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.ready();
            window.Telegram.WebApp.expand();
        }

        fetchData();
    }, []);

    if (loading) {
        return (
            <main className="container mx-auto px-4 py-6 max-w-md">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <LoadingSpinner size="lg" />
                </div>
            </main>
        );
    }

    if (error || !profile) {
        return (
            <main className="container mx-auto px-4 py-6 max-w-md">
                <ErrorMessage message={error || "Failed to load profile"} onRetry={fetchData} />
            </main>
        );
    }

    const displayName =
        profile.tipster?.display_name ||
        profile.user.first_name ||
        profile.user.username ||
        "User";

    return (
        <main className="container mx-auto px-4 py-6 max-w-md">
            {/* Profile Header */}
            <Card className="mb-4">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">
                            {displayName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-white">{displayName}</h1>
                        <p className="text-sm text-white/60">
                            {profile.user.role === "tipster" ? "Tipster" : "User"}
                            {profile.user.username && ` • @${profile.user.username}`}
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-white">{profile.stats.purchases}</p>
                        <p className="text-xs text-white/60">Purchases</p>
                    </div>
                    {profile.tipster && (
                        <div className="bg-white/5 rounded-xl p-3 text-center">
                            <p className="text-2xl font-bold text-white">
                                {profile.tipster.total_tickets}
                            </p>
                            <p className="text-xs text-white/60">Tickets Posted</p>
                        </div>
                    )}
                </div>

                {/* Tipster Status */}
                {profile.tipster && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-white/70">Tipster Status</span>
                            <span
                                className={`text-sm font-semibold ${profile.tipster.is_approved ? "text-green-400" : "text-yellow-400"
                                    }`}
                            >
                                {profile.tipster.is_approved ? "Approved" : "Pending"}
                            </span>
                        </div>
                        {profile.tipster.is_verified && (
                            <div className="flex items-center gap-2 mt-2">
                                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span className="text-sm text-blue-400">Verified Tipster</span>
                            </div>
                        )}
                    </div>
                )}
            </Card>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setActiveTab("overview")}
                    className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${activeTab === "overview"
                            ? "bg-purple-500 text-white"
                            : "bg-white/5 text-white/60 hover:bg-white/10"
                        }`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab("purchases")}
                    className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${activeTab === "purchases"
                            ? "bg-purple-500 text-white"
                            : "bg-white/5 text-white/60 hover:bg-white/10"
                        }`}
                >
                    Purchases
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
                <div className="space-y-4">
                    {profile.user.role === "tipster" && profile.tipster?.is_approved && (
                        <Button
                            variant="primary"
                            size="lg"
                            className="w-full"
                            onClick={() => router.push("/studio")}
                        >
                            Go to Studio
                        </Button>
                    )}

                    <Card>
                        <h3 className="font-semibold text-white mb-3">Account Info</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-white/60">Role</span>
                                <span className="text-white capitalize">{profile.user.role}</span>
                            </div>
                            {profile.user.username && (
                                <div className="flex justify-between">
                                    <span className="text-white/60">Username</span>
                                    <span className="text-white">@{profile.user.username}</span>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === "purchases" && (
                <div className="space-y-3">
                    {purchases.length === 0 ? (
                        <Card>
                            <div className="text-center py-8">
                                <svg
                                    className="w-12 h-12 mx-auto text-white/20 mb-3"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                                    />
                                </svg>
                                <p className="text-white/60 text-sm">No purchases yet</p>
                            </div>
                        </Card>
                    ) : (
                        purchases.map((purchase) => (
                            <Card
                                key={purchase.id}
                                hover
                                onClick={() => router.push(`/t/${purchase.ticket.id}`)}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-semibold text-white flex-1 line-clamp-1">
                                        {purchase.ticket.title}
                                    </h4>
                                    <span
                                        className={`text-xs font-semibold px-2 py-1 rounded-full ${purchase.ticket.status === "won"
                                                ? "bg-green-500/20 text-green-400"
                                                : purchase.ticket.status === "lost"
                                                    ? "bg-red-500/20 text-red-400"
                                                    : "bg-yellow-500/20 text-yellow-400"
                                            }`}
                                    >
                                        {purchase.ticket.status.toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-white/60">
                                        Odds: {purchase.ticket.odds.toFixed(2)}
                                    </span>
                                    <span className="font-semibold text-white">
                                        {formatNGN(purchase.amount_paid)}
                                    </span>
                                </div>
                                <p className="text-xs text-white/50 mt-2">
                                    {new Date(purchase.created_at).toLocaleDateString()}
                                </p>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </main>
    );
}
