import { supabase } from '../lib/supabaseClient';
import type { DataStore } from './DataStore';
import { createLocalStore } from './localStore';
import { createSupabaseStore } from './supabaseStore';

/** Supabase when keys are configured in .env, otherwise browser storage. */
export function createDataStore(): DataStore {
  return supabase ? createSupabaseStore(supabase) : createLocalStore();
}

export type { DataStore, Snapshot, StoreEvent, Change } from './DataStore';
