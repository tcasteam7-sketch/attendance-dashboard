/**
 * Client for the Google Sheets backend (apps-script/WEB.gs).
 * Loaded after config.js on every page. Replaces the old supabase-client.js.
 *
 *   var zones = await api('getZones');
 *   await api('submitEntry', { entry: {...} });
 *
 * Resolves with the `data` the server returned, or rejects with an Error
 * carrying the server's message.
 */
(function () {
  var cfg = window.API_CONFIG || {};

  function isConfigured() {
    return !!cfg.url && cfg.url.indexOf('PASTE-YOUR') === -1;
  }

  if (!isConfigured()) {
    console.error('Not configured yet — set window.API_CONFIG.url in config.js to your Apps Script /exec URL.');
  }

  window.api = function (action, params) {
    if (!isConfigured()) {
      return Promise.reject(new Error(
        'The app is not connected to a backend yet. Set the Apps Script /exec URL in config.js.'
      ));
    }

    var body = Object.assign({ action: action }, params || {});

    // Content-Type must stay text/plain. Anything else (including
    // application/json) makes the browser send a CORS preflight OPTIONS
    // request first, and Apps Script web apps cannot respond to OPTIONS —
    // the call would fail before it ever reached the script.
    return fetch(cfg.url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      redirect: 'follow'
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Backend returned HTTP ' + response.status + '. Check that the Apps Script deployment is set to "Anyone".');
        }
        return response.text();
      })
      .then(function (text) {
        var payload;
        try {
          payload = JSON.parse(text);
        } catch (err) {
          // Apps Script serves an HTML error/consent page instead of JSON when
          // the deployment is not accessible anonymously — by far the most
          // common setup mistake, so name it rather than showing raw HTML.
          throw new Error('Backend did not return JSON. The deployment is probably not set to "Who has access: Anyone".');
        }
        if (!payload.ok) throw new Error(payload.error || 'Unknown backend error.');
        return payload.data;
      });
  };

  window.apiIsConfigured = isConfigured;
})();
