import type { CasaData } from './types';
import { seedData } from './casa-logic';

const KEY = 'casa_la_v1';

/**
 * Local-mode persistence (localStorage). This mirrors the throwaway persistence
 * used by the prototype and powers the app when no Supabase project is configured
 * (see NEXT_PUBLIC_SUPABASE_URL in .env.local). Swap for the API-backed data layer
 * once real infra is wired up — see README "Going to production".
 */
export function loadLocal(): CasaData {
  if (typeof window === 'undefined') return seedData();
  try {
    const raw = window.localStorage.getItem(KEY);
    const data = raw ? (JSON.parse(raw) as CasaData) : null;
    if (data && Array.isArray(data.applications)) return data;
  } catch {
    // fall through to seed
  }
  const seeded = seedData();
  saveLocal(seeded);
  return seeded;
}

export function saveLocal(data: CasaData): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // storage unavailable (private browsing quota, etc) — silently skip persistence
  }
}

export function isBackendConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL;
}
