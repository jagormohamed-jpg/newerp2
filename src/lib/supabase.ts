import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://srcxgrhtmleitvlzagbg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyY3hncmh0bWxlaXR2bHphZ2JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MTY1MzgsImV4cCI6MjA5MDA5MjUzOH0.EeEvoXVlmRerEQa9lVZ3xQOWdOvyMW0xxmJTEM0EGyM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export { SUPABASE_URL, SUPABASE_ANON_KEY };
