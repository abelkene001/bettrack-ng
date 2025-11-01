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
