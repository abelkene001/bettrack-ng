// lib/supabaseAdmin.ts
import { createClient } from "@supabase/supabase-js";
import type { User, TipsterProfile } from "@/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin client bypasses RLS for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Get or create user by Telegram ID
 */
export async function getOrCreateUser(telegramUser: {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}): Promise<User> {
  const telegramId = String(telegramUser.id);

  // Try to find existing user
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (existing) {
    return existing as User;
  }

  // Create new user
  const { data: newUser, error } = await supabaseAdmin
    .from("users")
    .insert({
      telegram_id: telegramId,
      username: telegramUser.username || null,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name || null,
      role: "user",
    })
    .select()
    .single();

  if (error || !newUser) {
    throw new Error(`Failed to create user: ${error?.message}`);
  }

  return newUser as User;
}

/**
 * Get user by Telegram ID
 */
export async function getUserByTelegramId(
  telegramId: string
): Promise<User | null> {
  const { data } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  return data as User | null;
}

/**
 * Get tipster profile for user
 */
export async function getTipsterProfile(
  userId: string
): Promise<TipsterProfile | null> {
  const { data } = await supabaseAdmin
    .from("tipster_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return data as TipsterProfile | null;
}

/**
 * Check if user has purchased a ticket
 */
export async function hasPurchasedTicket(
  userId: string,
  ticketId: string
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("purchases")
    .select("id")
    .eq("buyer_id", userId)
    .eq("ticket_id", ticketId)
    .eq("payment_status", "completed")
    .maybeSingle();

  return !!data;
}

/**
 * Check if user is admin
 */
export function isAdmin(telegramId: string): boolean {
  const adminsRaw = process.env.APP_ADMIN_TELEGRAM_IDS || "";
  const adminIds = new Set(
    adminsRaw.split(",").map((s) => s.trim()).filter(Boolean)
  );
  return adminIds.has(telegramId);
}
