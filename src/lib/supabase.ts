import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yokoqyidmhdurhwmzxgm.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_8QD6o_kPnly2AIM9Yv1S9w_ZePdGWTL";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
