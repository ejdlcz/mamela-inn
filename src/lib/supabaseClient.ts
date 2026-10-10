import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** null when no Supabase keys are configured -> the app runs in local mode. */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;
