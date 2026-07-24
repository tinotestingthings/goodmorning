(function (global) {
  "use strict";

  // Supabase client. The URL + publishable key are PUBLIC by design — safe to
  // ship in the static app; the secret/service_role key is NEVER here (it only
  // lives in the Mac bridge task). Real access control comes from Supabase Auth
  // + Row-Level Security on the server, not from hiding these values.
  var SUPABASE_URL = "https://bobltktjohhnoqhnxslf.supabase.co";
  var SUPABASE_PUBLISHABLE_KEY = "sb_publishable_8SE7JZJrNv_wG-8SN6_NNA_K4Mc0yuR";

  var client = null;
  if (global.supabase && global.supabase.createClient) {
    client = global.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
    });
  }

  // Exposed as SB so it doesn't clobber the library's own `supabase` global.
  // May be null if the CDN library failed to load (offline) — callers must
  // handle that and fail closed (keep data gated).
  global.SB = client;
})(window);
