# Leave & Attendance — Google Sheets edition

Two static web apps (a daily entry form and an admin dashboard) that read and
write your Google Sheet directly. No build step, no npm, no database server.

**Spreadsheet:** [`1s8TZ1V-slxyto0FW632jhUbqfAWVkS3LL-vt4zaPC9g`](https://docs.google.com/spreadsheets/d/1s8TZ1V-slxyto0FW632jhUbqfAWVkS3LL-vt4zaPC9g/edit)

## How it fits together

GitHub Pages can only serve static files, and a browser has nowhere safe to
keep a Google credential. So the pages never touch the sheet themselves — a
Google Apps Script Web App sits in between and is the only thing holding access:

```
GitHub Pages                Apps Script Web App           Google Sheet
(static HTML + JS)   ──►    /exec  (WEB.gs)      ──►     zone tabs + EMP_List
                     fetch        SpreadsheetApp
```

## What's in here

```
apps-script/WEB.gs         the backend — paste this into the Apps Script editor
apps-script/appsscript.json  manifest (scopes + web app access level)
web/entry/index.html       daily entry form
web/dashboard/index.html   dashboard, reports, employees, zones, admin
web/assets/config.js       ← the one file you must edit
web/assets/sheets-api.js   fetch wrapper both pages use
tools/sync-deploy.py       copies web/ into the two deploy repos
deploy/entry-repo/         git repo → github.com/tcasteam7-sketch/attendance-entry
deploy/dashboard-repo/     git repo → github.com/tcasteam7-sketch/attendance-dashboard
supabase/schema.sql        legacy, from the Postgres version — not used anymore
```

## How the sheet is used as the database

| Old Supabase table | Now                                                        |
|--------------------|------------------------------------------------------------|
| `zones`            | the sheet tabs themselves — one tab per zone                |
| `employees`        | the `EMP_List` tab                                          |
| `entries`          | rows inside each zone tab                                   |
| `app_settings`     | Apps Script *Script Properties* (never written to the sheet)|

A tab counts as a zone tab unless its name is `EMP_List`, `LINKS`, starts with
`_`, or contains `Log`, `List`, `Report` or `Updatation` — the same rule your
original Apps Script used. Change it in `CONFIG.isExcludedSheet` if your tab
names don't fit.

Column order does **not** have to match between tabs. Each read and write looks
at that tab's own header row and classifies every column (`classifyHeader_`), so
`WORKS ASSIGNED STATION` and `WORKS ASSIGNED` land in the right places even if
tabs disagree on ordering. Columns it can't recognise are left untouched.

---

## Setup

### 1. Deploy the Apps Script backend

1. Open [script.google.com](https://script.google.com) → **New project**.
2. Delete the starter `myFunction` code and paste in all of
   [`apps-script/WEB.gs`](apps-script/WEB.gs).
3. **Project Settings** → tick **Show "appsscript.json" manifest file**, then open
   `appsscript.json` in the editor and replace it with
   [`apps-script/appsscript.json`](apps-script/appsscript.json).
4. **Deploy → New deployment → Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. **Deploy**, then authorize when prompted. Google will warn the app is
   unverified — **Advanced → Go to (project name)** to continue. That warning is
   normal for your own scripts.
6. Copy the deployment URL. It ends in `/exec`.

> **"Who has access" must be "Anyone".** "Anyone with a Google account" makes
> Google serve a login page to `fetch()` instead of your data, and the app fails
> with an unhelpful CORS error. "Anyone" means the URL is callable without a
> Google login — see [Security](#security) for what that does and doesn't expose.

### 2. Check it found your sheet

Open your `/exec` URL in a browser with `?action=diagnostics` on the end:

```
https://script.google.com/macros/s/AKfy.../exec?action=diagnostics
```

You get JSON listing every tab, whether it was treated as a zone or ignored, and
how each column header was mapped. **Read this before going further** — if a tab
you expected is `"ignored"`, or a column says `"(unrecognised — ignored)"`, fix
`CONFIG.isExcludedSheet` or `classifyHeader_` now rather than discovering blank
fields later.

### 3. Point the pages at it

Edit [`web/assets/config.js`](web/assets/config.js):

```js
window.API_CONFIG = {
  url: 'https://script.google.com/macros/s/AKfy.../exec',
  googleClientId: ''
};
```

### 4. Google Sign-In for the Admin Login tab (optional)

Only needed for the dashboard tab that rotates the shared admin password.
Everything else works without it.

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) →
   **Create credentials → OAuth client ID → Web application**.
2. Under **Authorized JavaScript origins** add every origin you'll serve from:
   - `http://localhost:8110` (local testing)
   - `https://tcasteam7-sketch.github.io` (GitHub Pages)
3. Copy the client ID into **both**:
   - `googleClientId` in `web/assets/config.js`
   - `CONFIG.GOOGLE_CLIENT_ID` in `apps-script/WEB.gs`

   They must match — the backend rejects a token issued for a different client
   ID, which is what stops someone reusing a Google token from another site.
4. Redeploy the Apps Script (**Deploy → Manage deployments → edit → New version**).

Authorized accounts are `CONFIG.ADMIN_EMAILS` in `WEB.gs`
(`904536medha@gmail.com`, `tcas.team7@gmail.com`). Edit that list to change them.

### 5. Test locally

```bash
python -m http.server 8110 --directory web
```

Then open `http://localhost:8110/entry/` and `http://localhost:8110/dashboard/`.

### 6. Publish to GitHub Pages

The two repos under `deploy/` are already wired to their GitHub remotes. Copy
the current `web/` files into them (this also rewrites the `../assets/` script
paths, since the repos are flat):

```bash
python tools/sync-deploy.py
```

Then push each one:

```bash
cd deploy/entry-repo && git add -A && git commit -m "Switch to Google Sheets backend" && git push
```

```bash
cd deploy/dashboard-repo && git add -A && git commit -m "Switch to Google Sheets backend" && git push
```

In each repo on GitHub: **Settings → Pages → Deploy from a branch → `main` / root**.

---

## Security

The `/exec` URL is not a secret. Anyone who opens the page can read it out of
`config.js` and call the backend directly. This is the same exposure the
Supabase anon key had, and the design accounts for it:

- **Zone changes, employee edits and purges require the admin password**, checked
  inside `WEB.gs`. The password never reaches the browser and the client cannot
  bypass the check by calling the API directly.
- **Changing the admin password additionally requires Google Sign-In** as one of
  the two authorized accounts, verified server-side against Google.
- **Submitting an entry is deliberately open**, exactly as before — the form is
  meant for staff without Google accounts. Anyone with the URL can file an entry.
  If that matters, switch the deployment to "Anyone with a Google account" and
  serve the entry form from Apps Script instead of GitHub Pages.
- The admin password is stored as **salted SHA-256** in Script Properties, not
  bcrypt (Apps Script has no bcrypt). Weaker against offline cracking, but the
  hash is unreachable from any client request, so there's nothing to crack
  offline unless the script project itself is compromised.

The default password is `Medh@9999`, seeded on first use. Change it from the
dashboard's Admin Login tab.

## Differences from the Supabase version

- **Leave dates round-trip through the `Leave Period` text column** (`21-05-2026
  to 23-05-2026`), so historical rows keep working and the sheet stays readable.
  The form still uses two date pickers; the backend formats and parses.
- **Renaming a zone is not a database cascade.** `renameZone_` renames the tab and
  then walks `EMP_List` and every `Current Working Section` column itself. It's a
  real write across several tabs, not an atomic transaction — if it fails
  partway, re-run it.
- **Removing a zone deletes its sheet tab**, and is refused while it still has
  entries or assigned employees.
- **Retention purge deletes rows from the sheet permanently.** There is no
  transaction log to recover from. Take a copy (File → Make a copy) before the
  first purge. Automatic monthly cleanup only happens if you run
  `installMonthlyPurgeTrigger()` once from the Apps Script editor.
- **Check-in/check-out are times now.** Rows written before that change may still
  hold `DONE` / `NOT` text; those are passed through and displayed as-is rather
  than being converted, since there's no way to invent a time after the fact.
- **Reports are slower.** Every report scans every zone tab — seconds, not
  milliseconds. The dashboard was collapsed into one request (`getDashboard`) for
  this reason. Apps Script also caps a single execution at 6 minutes; if you grow
  past roughly 20–30k rows, expect to add pagination or archive old tabs.
- **The old `entries_no_future_date` constraint is now a check in `submitEntry_`.**
  Same effect, but enforced in the script rather than the database.

## Things to know about this working copy

- `C:\Users\Admin\Documents\ATTENDENCE` is an **older duplicate** of this project,
  still on the Supabase code, with an identical `.claude/launch.json` on port
  8099. It's not connected to the GitHub repos. Delete it or rename it to avoid
  editing the wrong copy — this folder (`ATTENDENCE_web`) is the live one.
- `supabase/schema.sql` and `web/assets/supabase-client.js` are left in place as
  a record of the previous system. Nothing loads them; safe to delete once you're
  confident in the new setup.

## Verification checklist

- [ ] `?action=diagnostics` lists your zone tabs and maps every column you care
      about (nothing important shows `(unrecognised — ignored)`).
- [ ] `config.js` has the real `/exec` URL.
- [ ] Entry form: section dropdown fills, an employee code auto-fills the rest,
      and submitting appends a row to the right tab in the sheet.
- [ ] Entry form blocks a future date and blocks the required work fields.
- [ ] Dashboard tiles show non-zero numbers after a test entry.
- [ ] Leave Report and Missing Entries both run; leave entered via the form is
      excluded from Missing Entries for those dates.
- [ ] Entries and Work Summary show the test entry; CSV download works.
- [ ] Zones tab: wrong password rejected, `Medh@9999` accepted; registering a
      zone creates a tab; removing a zone with entries is refused.
- [ ] Employees tab lists `EMP_List`; editing an employee updates the sheet row.
- [ ] Retention Preview reports a count (likely 0); Purge stays disabled until
      Preview finds something.
- [ ] Admin Login (if configured): an unauthorized Google account is rejected;
      an authorized one can change the shared password, and the new password then
      works on the Zones tab.
