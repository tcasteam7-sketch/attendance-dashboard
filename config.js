// Paste your deployed Apps Script Web App URL here (Deploy -> New deployment ->
// Web app -> copy the URL; it ends in /exec). Both pages read this file.
//
// Unlike a database key, this URL is not a secret you can protect — anyone who
// opens the page can read it. That is why every write the app performs is
// gated inside WEB.gs (admin password / Google Sign-In) rather than by hiding
// this value.
window.API_CONFIG = {
  // Must be the /exec deployment URL. The script.googleusercontent.com/macros/echo
  // address the browser lands on after running the script is session-bound and
  // will fail here with "Failed to fetch".
  url: 'https://script.google.com/macros/s/AKfycbwNRTt8EV33_ae0EW5GcomtJZzTOMakkk2FW9asxFl2RpHBojcoaC_dWLB5jDpHk68T4Q/exec',

  // Only needed for the dashboard's Admin Login tab. Create an OAuth 2.0 Web
  // client ID in Google Cloud Console, add your GitHub Pages origin to its
  // "Authorized JavaScript origins", and paste the client ID here AND into
  // CONFIG.GOOGLE_CLIENT_ID in apps-script/WEB.gs — they must match, or the
  // server will reject the sign-in token.
  googleClientId: ''
};
