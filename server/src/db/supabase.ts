import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

export const supabaseServer = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
  console.error("[startup] Missing SUPABASE_URL or SUPABASE_SECRET_KEY");
  throw new Error("Supabase environment variables are not set");
}
