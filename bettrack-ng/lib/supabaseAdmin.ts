// lib/supabaseAdmin.ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

/**
 * Server-only Supabase client using the Service Role key.
 * Use this ONLY in API routes (never ship to the browser).
 */
export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false },
});
