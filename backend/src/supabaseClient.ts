import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.DATABASE_URL;
const supabaseAnonKey = process.env.DATABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Variáveis de ambiente do Supabase não configuradas!");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
