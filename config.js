// Paste your deployed Apps Script Web App URL here (Deploy -> New deployment ->
// Web app -> copy the URL; it ends in /exec). Both pages read this file.
//
// Unlike a database key, this URL is not a secret you can protect — anyone who
// opens the page can read it. That is why every write the app performs is
// gated inside WEB.gs (admin password / Google Sign-In) rather than by hiding
// this value.
window.API_CONFIG = {
  url: 'https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnQoccvXjR4gl-XLuDRoA8BsDfKqFfG6Xb_jj4U8TlgjhpEL8HlhmPULBfZfWb6VO_F2MKas7itimKlj3Ipob3AXtaon6VGDXnj4wrrtRZeAmQxO4VSlPszlVIF79VXMHRua5Q1ZJl8F2gTryNXHEEkjuVKgwJdvUr0qw7DQ3Av1wmuzbWM7wa4XesBjse3Oe1uMniESZGBijjBaZF6bW6URqQ89upmqgf8_N5CzgoHflMHBsBclbxMV8TDJC-903DfeuGi-PHvuCswaIQShHIfKg3Jf0A&lib=MUzt7Kb0-U-TRYMmG93HyFqUvdGhh_fup',

  // Only needed for the dashboard's Admin Login tab. Create an OAuth 2.0 Web
  // client ID in Google Cloud Console, add your GitHub Pages origin to its
  // "Authorized JavaScript origins", and paste the client ID here AND into
  // CONFIG.GOOGLE_CLIENT_ID in apps-script/WEB.gs — they must match, or the
  // server will reject the sign-in token.
  googleClientId: ''
};
