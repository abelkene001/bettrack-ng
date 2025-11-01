// app/api/telegram/validate/route.ts
import { NextResponse } from "next/server";
import { validateTelegramInitData } from "../../../../lib/telegram";
import { signAppSession, SESSION_COOKIE } from "../../../../lib/session";

// Define proper types instead of `any`
type ValidationRequest = {
  initDataRaw?: string;
  devUser?: {
    id?: number;
    name?: string;
    username?: string;
  };
};

export async function POST(req: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json(
      { ok: false, error: "BOT_TOKEN_MISSING" },
      { status: 500 }
    );
  }

  let body: ValidationRequest = {};
  try {
    body = await req.json();
  } catch {
    // ignore → body stays {}
  }

  // Real Telegram flow
  if (body?.initDataRaw) {
    const res = validateTelegramInitData(body.initDataRaw, botToken);
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: res.reason },
        { status: 401 }
      );
    }
    const tgUser = res.user || {};
    const telegramId = String(tgUser.id ?? "");
    if (!telegramId) {
      return NextResponse.json(
        { ok: false, error: "NO_TG_ID" },
        { status: 400 }
      );
    }

    const name =
      [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ") ||
      tgUser.username ||
      "User";

    const token = await signAppSession({
      sub: telegramId,
      name,
      username: tgUser.username,
    });

    const resp = NextResponse.json(
      { ok: true, user: { telegramId, name } },
      { status: 200 }
    );
    resp.headers.append(
      "Set-Cookie",
      `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${
        60 * 60 * 24 * 30
      }`
    );
    return resp;
  }

  // Dev simulate (only when not production)
  if (process.env.NODE_ENV !== "production" && body?.devUser) {
    const telegramId = String(body.devUser.id ?? "999001");
    const name = body.devUser.name ?? "Dev User";

    const token = await signAppSession({
      sub: telegramId,
      name,
      username: body.devUser.username ?? "dev_local",
    });

    const resp = NextResponse.json(
      { ok: true, user: { telegramId, name }, dev: true },
      { status: 200 }
    );
    resp.headers.append(
      "Set-Cookie",
      `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${
        60 * 60 * 24 * 30
      }`
    );
    return resp;
  }

  return NextResponse.json({ ok: false, error: "NO_INPUT" }, { status: 400 });
}
