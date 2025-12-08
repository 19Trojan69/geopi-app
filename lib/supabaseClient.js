import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// HIER deine echten Werte eintragen:
const SUPABASE_URL = "https://mubfgqihjdczrsadrhhz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11YmZncWloamRjenJzYWRyaGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMDczMTAsImV4cCI6MjA3ODc4MzMxMH0.0i2S0o4rOB4I2Np-tPnvMjYfIsB_CZZdZ5w_I83UAk4"; // nur anon key! KEIN service key

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
