// config.js  
// Supabase configuration (Frontend Safe Keys Only)

(function (global) {

  // Your Supabase Project URL
  const SUPABASE_URL = "https://undifyifhbraziqxdzti.supabase.co";

  // Public ANON Key (Frontend safe)
  const SUPABASE_ANON = 
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuZGlmeWlmaGJyYXppcXhkenRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NjU0NzQsImV4cCI6MjA4MDM0MTQ3NH0.cHI9PzVeCQCNTelnvkQgY6ETsBA1tCxGoW3oH55tsKM";

  // Storage Bucket Name
  const PROOFS_BUCKET = "proofs";

  // Currency Symbol
  const CURRENCY = "৳";

  // Export Config Globally
  global.APP_CONFIG = {
    SUPABASE_URL,
    SUPABASE_ANON,
    PROOFS_BUCKET,
    CURRENCY,
  };

  // Create Supabase Client
  try {
    if (typeof supabaseJs !== 'undefined') {
      global.supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON);
    } else {
      console.error("Supabase JS not loaded!");
    }
  } catch (e) {
    console.error("Supabase init error:", e);
  }

})(window);
