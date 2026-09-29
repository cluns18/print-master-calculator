import { createClient } from '@supabase/supabase-js';

// Read-only access to the shared OBG garment catalog, the same Supabase project
// the Olive Branch Apparel Design Studio reads. The publishable key is meant to be
// shipped client-side. Without the two env vars the calculator still works, it
// just shows the hand-built shortlist and no "view all" button.
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const catalogEnabled = Boolean(url && key);

export const supabase = catalogEnabled
    ? createClient(url, key, { auth: { persistSession: false } })
    : null;
