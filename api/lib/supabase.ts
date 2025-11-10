import { createClient } from "@supabase/supabase-js";

import { settings } from "./config";

export const supabaseAdmin = createClient(
  settings.SUPABASE_URL,
  settings.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

