// lib/telegram.ts
import crypto from "crypto";

/** Validate Telegram WebApp initData using official HMAC method. */
export function validateTelegramInitData(
  initDataRaw: string,
  botToken: string
) {
  if (!initDataRaw || !botToken)
    return { ok: false as const, reason: "missing_data" };

  const urlSearch = new URLSearchParams(initDataRaw);
  const hash = urlSearch.get("hash");
  if (!hash) return { ok: false as const, reason: "missing_hash" };

  const pairs: string[] = [];
  urlSearch.forEach((value, key) => {
    if (key !== "hash") pairs.push(`${key}=${value}`);
  });
  pairs.sort();
  const dataCheckString = pairs.join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();
  const calcHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  // timingSafeEqual requires same length
  const ok =
    calcHash.length === hash.length &&
    crypto.timingSafeEqual(Buffer.from(calcHash), Buffer.from(hash));
  if (!ok) return { ok: false as const, reason: "bad_signature" };

  const userStr = urlSearch.get("user");
  const user = userStr ? JSON.parse(userStr) : null;

  return { ok: true as const, user };
}

// lib/telegram.ts
// Minimal, strict types for Telegram WebApp haptics + safe helpers.

export type HapticImpactStyle = "light" | "medium" | "heavy";
export type HapticNotificationType = "success" | "warning" | "error";

export interface TelegramHaptics {
  impactOccurred?: (style: HapticImpactStyle) => void;
  notificationOccurred?: (type: HapticNotificationType) => void;
}

export interface TelegramWebApp {
  HapticFeedback?: TelegramHaptics;
}

export interface TelegramNamespace {
  WebApp?: TelegramWebApp;
}

// Make it available globally without `any`
declare global {
  interface Window {
    Telegram?: TelegramNamespace;
  }
}

/** Safe haptic impact (no-ops if not available) */
export function hapticImpact(style: HapticImpactStyle = "light"): void {
  window?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(style);
}

/** Safe haptic notify (no-ops if not available) */
export function hapticNotify(type: HapticNotificationType = "success"): void {
  window?.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.(type);
}

// lib/telegram.ts
export function getTelegramIdFromHeaders(req: Request): string | null {
  // If you already set this header in a middleware from Telegram initData, keep it.
  const id = req.headers.get("x-telegram-id");
  return id && id.trim().length > 0 ? id.trim() : null;
}

/** Parse admin list once. */
const adminsRaw = process.env.APP_ADMIN_TELEGRAM_IDS || "";
const adminIds = new Set(adminsRaw.split(",").map((s) => s.trim()).filter(Boolean));

export function isAdminTelegramId(telegramId: string | null): boolean {
  return telegramId !== null && adminIds.has(telegramId);
}
