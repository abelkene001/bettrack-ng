// lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// We use the anon key in the Mini App for client-side reads/writes guarded by RLS.
// Server-side Admin key (if needed later) will live only in API routes (not exposed).
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Telegram handles identity; we’ll map users by telegram_id later
  },
});
