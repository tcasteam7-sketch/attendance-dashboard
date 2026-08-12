// Shared Supabase client, built from window.SUPABASE_CONFIG (see config.js).
// Loaded after the Supabase CDN script and config.js in every page.
(function () {
  var cfg = window.SUPABASE_CONFIG || {};
  if (!cfg.url || cfg.url.indexOf('YOUR-PROJECT-REF') !== -1) {
    console.error('Supabase is not configured yet — edit web/assets/config.js with your project URL and anon key.');
  }
  window.supabaseClient = window.supabase.createClient(cfg.url, cfg.anonKey);
})();
