// app/api/studio/allowed/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getUserByTelegramId,
  getTipsterProfile,
} from "@/lib/supabaseAdmin";
import { formatErrorResponse, AuthenticationError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const telegramId = request.headers.get("x-telegram-id");
    if (!telegramId) {
      throw new AuthenticationError();
    }

    const user = await getUserByTelegramId(telegramId);
    if (!user) {
      return NextResponse.json({
        ok: false,
        reason: "User not found",
      });
    }

    if (user.role !== "tipster") {
      return NextResponse.json({
        ok: false,
        reason: "Only tipsters can access the studio",
      });
    }

    const profile = await getTipsterProfile(user.id);
    if (!profile || !profile.is_approved) {
      return NextResponse.json({
        ok: false,
        reason: "Your tipster account is pending approval",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return formatErrorResponse(error);
  }
}
