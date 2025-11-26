// app/studio/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { Input, TextArea, Select } from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";
import type { CreateTicketForm, Bookmaker, ApiResponse } from "@/types";

export default function StudioPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<CreateTicketForm>({
    title: "",
    description: "",
    total_odds: 0,
    bookmaker: "bet9ja",
    confidence: 7,
    priceNGN: 0,
    booking_code: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreateTicketForm, string>>>({});

  const checkAccess = async () => {
    setLoading(true);
    setError(null);

    try {
      const initData = window.Telegram?.WebApp?.initData || "";

      const response = await fetch("/api/studio/allowed", {
        headers: {
          "x-telegram-init-data": initData,
        },
        cache: "no-store",
      });

      const data = await response.json();

      if (data.ok) {
        setAllowed(true);
      } else {
        setAllowed(false);
        setError(data.reason || "Access denied");
      }
    } catch (err) {
      setAllowed(false);
      setError(err instanceof Error ? err.message : "Failed to check access");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateTicketForm, string>> = {};

    if (!form.title.trim()) {
      newErrors.title = "Title is required";
    } else if (form.title.length > 100) {
      newErrors.title = "Title must be less than 100 characters";
    }

    if (form.description && form.description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }

    if (!form.total_odds || form.total_odds < 1) {
      newErrors.total_odds = "Odds must be at least 1.0";
    }

    if (!form.confidence || form.confidence < 1 || form.confidence > 10) {
      newErrors.confidence = "Confidence must be between 1 and 10";
    }

    if (!form.priceNGN || form.priceNGN < 0) {
      newErrors.priceNGN = "Price must be a positive number";
    }

    if (!form.booking_code.trim()) {
      newErrors.booking_code = "Booking code is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const initData = window.Telegram?.WebApp?.initData || "";

      const response = await fetch("/api/tickets/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-init-data": initData,
        },
        body: JSON.stringify(form),
      });

      const data: ApiResponse<{ id: string }> = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to create ticket");
      }

      // Success!
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
      }

      // Reset form
      setForm({
        title: "",
        description: "",
        total_odds: 0,
        bookmaker: "bet9ja",
        confidence: 7,
        priceNGN: 0,
        booking_code: "",
      });

      alert("Ticket created successfully!");
      router.push("/");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }

    checkAccess();
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

  if (!allowed) {
    return (
      <main className="container mx-auto px-4 py-6 max-w-md">
        <Card>
          <div className="text-center py-8">
            <svg
              className="w-16 h-16 mx-auto text-red-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-white/70 mb-4">{error}</p>
            <Button variant="secondary" onClick={() => router.push("/")}>
              Go Home
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6 max-w-md">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Create Ticket</h1>
        <p className="text-white/60 text-sm">Post a new premium betting tip</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-4">
          <div className="space-y-4">
            <Input
              label="Title"
              placeholder="e.g., Premier League 3-Match Combo"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              error={errors.title}
              maxLength={100}
            />

            <TextArea
              label="Description (Optional)"
              placeholder="Provide details about your tip..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              error={errors.description}
              rows={3}
              maxLength={500}
            />

            <Input
              label="Total Odds"
              type="number"
              step="0.01"
              placeholder="e.g., 5.50"
              value={form.total_odds || ""}
              onChange={(e) =>
                setForm({ ...form, total_odds: parseFloat(e.target.value) || 0 })
              }
              error={errors.total_odds}
            />

            <Select
              label="Bookmaker"
              value={form.bookmaker}
              onChange={(e) =>
                setForm({ ...form, bookmaker: e.target.value as Bookmaker })
              }
              options={[
                { value: "bet9ja", label: "Bet9ja" },
                { value: "sportybet", label: "SportyBet" },
                { value: "1xbet", label: "1xBet" },
                { value: "betking", label: "BetKing" },
                { value: "other", label: "Other" },
              ]}
            />

            <Input
              label="Confidence Level (1-10)"
              type="number"
              min="1"
              max="10"
              placeholder="7"
              value={form.confidence || ""}
              onChange={(e) =>
                setForm({ ...form, confidence: parseInt(e.target.value) || 0 })
              }
              error={errors.confidence}
              helperText="How confident are you in this tip?"
            />

            <Input
              label="Price (₦)"
              type="number"
              step="1"
              placeholder="e.g., 500"
              value={form.priceNGN || ""}
              onChange={(e) =>
                setForm({ ...form, priceNGN: parseInt(e.target.value) || 0 })
              }
              error={errors.priceNGN}
            />

            <Input
              label="Booking Code"
              placeholder="Enter the booking code"
              value={form.booking_code}
              onChange={(e) => setForm({ ...form, booking_code: e.target.value })}
              error={errors.booking_code}
            />
          </div>
        </Card>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={submitting}
        >
          Publish Ticket
        </Button>
      </form>
    </main>
  );
}
