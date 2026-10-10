# Mamela's Inn — Front Desk & Owner Console

A React + TypeScript + Tailwind web app for running an inn: room grid with live
countdowns, check-in / check-out, pre-booked reservations, room changes, a master
ledger with Excel export, weekly emailed reports, and day/night mode.

It runs in **two modes from the same code** — no code changes needed to switch:

| Mode | When | Data lives in |
| --- | --- | --- |
| **Local** | No Supabase keys in `.env` | The browser (one device) |
| **Supabase** | Both Supabase keys set | Shared database, live sync on every phone/tablet/PC |

---

## Contents

1. [What you need to install](#1-what-you-need-to-install)
2. [Open it in VS Code and run it](#2-open-it-in-vs-code-and-run-it)
3. [Push to GitHub (and pull later)](#3-push-to-github-and-pull-later)
4. [Publish the website (GitHub Pages)](#4-publish-the-website-github-pages)
5. [Switch on Supabase (shared data)](#5-switch-on-supabase-shared-data)
6. [Weekly email report](#6-weekly-email-report)
7. [Everyday workflow](#7-everyday-workflow)
8. [How the project is organised](#8-how-the-project-is-organised)
9. [Changing things — recipes](#9-changing-things--recipes)
10. [Security notes](#10-security-notes)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. What you need to install

**Programs (one time):**

| Program | Why | Get it |
| --- | --- | --- |
| **Node.js 20 LTS** (or newer) | Runs and builds the app | <https://nodejs.org> |
| **Git** | Push / pull with GitHub | <https://git-scm.com/downloads> |
| **VS Code** | Your editor | <https://code.visualstudio.com> |
| *Supabase CLI* (optional) | Only to deploy the weekly-email function | `npm install -g supabase` |

Check they work — open a terminal and run `node -v` and `git --version`.

**VS Code extensions.** Open this folder in VS Code and click **Install** on the
"Do you want to install the recommended extensions?" pop-up (it reads
`.vscode/extensions.json`). Or install them by name from the Extensions panel
(`Ctrl+Shift+X`):

| Extension | Needed? | What it does |
| --- | --- | --- |
| **Prettier – Code formatter** (`esbenp.prettier-vscode`) | Recommended | Auto-formats code on save so everything stays consistent |
| **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`) | Recommended | Autocomplete + previews for the `bg-brand`, `text-muted`… classes |
| **GitLens** (`eamodio.gitlens`) | Optional | See who changed which line and when |
| **GitHub Pull Requests** (`github.vscode-pull-request-github`) | Optional | Create/review pull requests and sign in to GitHub from VS Code |
| **GitHub Actions** (`github.vscode-github-actions`) | Optional | Watch the deploy workflow's status inside VS Code |
| **Deno** (`denoland.vscode-deno`) | Only if you edit `supabase/functions/` | The Edge Function uses Deno imports; this stops false red underlines there |
| **Error Lens** (`usernamehw.errorlens`) | Optional | Shows errors inline next to the code |

React, TypeScript and Git support are built into VS Code — no extension needed for those.

---

## 2. Open it in VS Code and run it

```bash
# 1. open the project folder in VS Code (File -> Open Folder…), then open the
#    built-in terminal with  Ctrl+`
npm install          # downloads dependencies (first time only)
npm run dev          # starts the app, usually at http://localhost:5173
```

Open the address it prints. **Front Desk** needs no login; **Owner** uses
`owner` / `123` until you set your own (see [Security notes](#10-security-notes)).

Other commands:

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with instant reload while you edit |
| `npm run typecheck` | Finds TypeScript mistakes |
| `npm test` | Runs the automated tests (check-in, reservations, overlap rules…) |
| `npm run build` | Builds the production site into `dist/` |
| `npm run preview` | Serves the built `dist/` locally to check it |
| `npm run format` | Re-formats all code with Prettier |

---

## 3. Push to GitHub (and pull later)

### First time

1. On github.com click **New repository**, name it (e.g. `mamelas-inn`), keep it
   empty (no README), and create it.
2. In the VS Code terminal, inside this project folder:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/mamelas-inn.git
git push -u origin main
```

VS Code will ask you to sign in to GitHub in your browser the first time.

> Don't have the project yet on another computer? Get it with
> `git clone https://github.com/YOUR-USERNAME/mamelas-inn.git`, then `npm install`.

### Using VS Code's buttons instead of commands

Open **Source Control** (`Ctrl+Shift+G`): type a message → click **Commit** →
click **Sync Changes** (that pushes *and* pulls). The `...` menu has **Pull**,
**Push**, **Branch**, and **Checkout to…**.

`.env` is in `.gitignore`, so your keys and passwords are **never** uploaded.

---

## 4. Publish the website (GitHub Pages)

This repo includes `.github/workflows/deploy.yml`: every push to `main` runs the
type-check and tests, builds the site, and publishes it.

1. GitHub repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Push to `main`. Watch it under the **Actions** tab (or the GitHub Actions
   extension). When it's green your site is at
   `https://YOUR-USERNAME.github.io/mamelas-inn/`.

Without any extra setup it deploys in **local mode**. To deploy with Supabase or
your own owner login, add these under **Settings → Secrets and variables → Actions**:

| Where | Name | Value |
| --- | --- | --- |
| *Variables* tab | `VITE_SUPABASE_URL` | your Supabase project URL |
| *Variables* tab | `VITE_SUPABASE_ANON_KEY` | your Supabase anon (public) key |
| *Variables* tab | `VITE_OWNER_USERNAME` | owner username |
| *Secrets* tab | `VITE_OWNER_PASSWORD` | owner password |

Then re-run the workflow (Actions → *Test & deploy* → **Run workflow**).
The site updates a minute or two after every push — that is how you ship fixes
and new features.

---

## 5. Switch on Supabase (shared data)

Skip this and the app works fine on one device. Do it when you want the front
desk phone, the tablet and the owner's laptop to all see the same rooms.

1. Create a free project at <https://supabase.com>.
2. **SQL Editor → New query**, paste the whole of
   `supabase/migrations/20250101000000_init.sql`, **Run**. This creates the
   tables, adds rooms 101–110, turns on live sync, and sets starter security rules.
3. **Project Settings → API** — copy the **Project URL** and the **anon public** key.
4. Create your local settings file and paste them in:

   ```bash
   cp .env.example .env      # Windows PowerShell: copy .env.example .env
   ```
   ```
   VITE_SUPABASE_URL=https://abcdxyz.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
5. Restart `npm run dev`. The footer now reads **"Connected to Supabase"**.
6. For the published site, add the same two values as GitHub *Variables*
   (section 4).

Your existing rooms/bookings from local mode are not copied over automatically —
local data lives only in that browser.

---

## 6. Weekly email report

A Supabase Edge Function (`supabase/functions/weekly-report`) emails the last
7 days of stays as an Excel file to the owner and every extra recipient set in
**Owner Dashboard → Admin Settings**. It needs Supabase (section 5) and a free
[Resend](https://resend.com) account.

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR-PROJECT-REF      # the ID in your Supabase URL

supabase secrets set RESEND_API_KEY=re_xxxxxxxx
supabase secrets set SENDER_EMAIL="Mamela's Inn <reports@yourdomain.com>"
supabase functions deploy weekly-report
```

- Resend only sends *from* a domain you verified there. For a quick test use
  `SENDER_EMAIL="Mamela's Inn <onboarding@resend.dev>"` (it can only email your own
  Resend account address).
- **Schedule it:** Supabase Dashboard → **Edge Functions → weekly-report →
  Schedules**, cron `0 1 * * 1` = every Monday 9:00 AM Philippine time
  (cron uses UTC). Or use `supabase/cron/weekly_report.sql.template`.
- **Test it now:** Dashboard → Edge Functions → weekly-report → **Test**.
- Optional extras: `REPORT_TIMEZONE=Asia/Manila`, and `CRON_SECRET=<long random text>`
  (then callers must send header `x-cron-secret`).

---

## 7. Everyday workflow

```text
git pull                         # get the latest
git checkout -b fix/room-colors  # (optional) work on a branch
…edit in VS Code, check in the browser…
npm run typecheck && npm test    # quick safety check
git add . && git commit -m "Make occupied rooms darker"
git push                         # on main: site redeploys automatically
```

Tip: work on a branch, push it, and open a **Pull Request** on GitHub — the
workflow runs the tests on it *before* you merge into `main`.

---

## 8. How the project is organised

```text
src/
  App.tsx                      Wires login, header, and the two screens together
  main.tsx                     Entry point
  styles/
    theme.css                  ★ Colors for day + night mode (edit to re-skin)
    index.css                  ★ Reusable looks: .btn-primary, .field, .card, .chip…
  config/defaults.ts           Payment methods, duration presets, default rooms/settings
  types/index.ts               Room, Transaction, Settings…
  components/
    auth/LandingPage.tsx       Front Desk / Owner choice + owner login
    layout/Header.tsx          Logo, tabs, clock, theme toggle, log out
    frontdesk/                 FrontDesk (logic), RoomCard, CheckInModal,
                               GuestInfoModal, ReservationsList
    owner/                     OwnerDashboard, Ledger, Reports, AdminSettings
    pickers/                   DatePicker (calendar), TimePicker (scroll wheel)
    ui/                        Modal, Field, StatusBadge
  hooks/                       useInnData (all data), useAuth, useTheme, useToast, useNow
  data/                        The database layer
    DataStore.ts               The interface every backend implements
    localStore.ts              Browser storage backend
    supabaseStore.ts           Supabase backend (+ camelCase <-> snake_case mapping)
  lib/                         Pure helpers: bookings (overlap rule), ids, format, export, auth…
supabase/
  migrations/                  Database schema — add new numbered files to change it
  functions/weekly-report/     Weekly email Edge Function
  cron/                        Optional SQL scheduler template
.github/workflows/deploy.yml   Test + build + publish to GitHub Pages
.vscode/                       Editor settings and recommended extensions
```

Design rule of thumb: **screens know nothing about the database**. They call
`data.createTxn(...)`, `data.saveRoom(...)` etc. from `useInnData`; the
`DataStore` decides where that goes. That is why local mode and Supabase mode
behave identically.

---

## 9. Changing things — recipes

### Change colors / fonts / the "feel"
- **Colors:** `src/styles/theme.css`. Every color is a variable; the night-mode
  block just overrides some of them. Brand rust orange is `--c-brand`.
- **Fonts:** the Google Fonts link in `index.html` + `fontFamily` in `tailwind.config.ts`.
- **Buttons, inputs, cards, chips:** the `.btn-primary`, `.field`, `.card`, `.chip`
  rules in `src/styles/index.css` — change once, every screen follows.
- **Room button look:** `LOOKS` at the top of `components/frontdesk/RoomCard.tsx`;
  the 3-D "key-cap" shadows are in `tailwind.config.ts` (`boxShadow`).
- **Room button sizes:** `src/lib/layout.ts` (`roomGridColumns`).

### Change a layout
Each screen is a normal React component under `src/components/…` using Tailwind
classes. Move things around there; the data/logic is in props and hooks, so
rearranging markup is safe. Tailwind class reference: <https://tailwindcss.com/docs>.

### Add a field to the check-in form (e.g. "Phone number")
1. `src/types/index.ts` → add `phone?: string` to `Transaction`.
2. `components/frontdesk/CheckInModal.tsx` → add state, a `<Field>` input, and
   include it in the object passed to `onConfirm`.
3. *Supabase mode:* add `phone` to the row type + both mappers in
   `data/supabaseStore.ts`, and create
   `supabase/migrations/<timestamp>_add_phone.sql` containing
   `alter table public.transactions add column phone text;` then run it.
   (Local mode needs nothing — it stores whatever the object contains.)
4. Show it in `GuestInfoModal.tsx` / `Ledger.tsx` / `lib/export.ts` if wanted.

### Add a payment method
`PAYMENT_METHODS` in `config/defaults.ts` and the `PaymentMethod` type in
`types/index.ts`. For Supabase also update the `check (payment_method in …)` rule
with a new migration.

### Add a new screen / tab
Create a component in `components/owner/`, add an entry to `TABS` in
`OwnerDashboard.tsx`. Use `data.txns`, `data.rooms`, `data.settings` for content.

### Use a different backend
Implement `DataStore` (`src/data/DataStore.ts`) and return it from
`createDataStore()` in `src/data/index.ts`.

### Change the database
Never edit an old migration. Add `supabase/migrations/<yyyymmddhhmmss>_what_it_does.sql`
and run it in the SQL Editor (or `supabase db push`).

### Fix a bug safely
Add a test next to the code (`*.test.ts` / `src/App.test.tsx`) that fails, fix the
bug, and `npm test` until green. The deploy workflow refuses to publish if tests fail.

---

## 10. Security notes

Read this before using real guest data.

- **The owner login is a convenience gate, not real security.** The
  `VITE_OWNER_*` values are baked into the website's JavaScript, and "signed in"
  is remembered in browser storage. It stops casual access, not a determined one.
  The temporary `owner` / `123` login shows a hint on the sign-in form — set your
  own `VITE_OWNER_USERNAME` / `VITE_OWNER_PASSWORD` before sharing the URL. (Once
  you set a password, the hint disappears.)
- **Supabase starter rules are open.** The `anon` key is public by design, and the
  starter policies let it read and write everything, so anyone who inspects the
  site could talk to your database directly. To lock it down: turn on **Supabase
  Auth**, create staff accounts, change `verifyOwner()` in `src/lib/auth.ts` to
  `supabase.auth.signInWithPassword(...)`, and replace the `using (true)` policies
  in a new migration with `using (auth.role() = 'authenticated')`.
- Never put the Supabase **service-role** key in `.env`, GitHub variables, or git.
  It is only for the Edge Function (Supabase injects it there automatically).
- GitHub Pages sites on free plans are public even if the repo is private.
- Reference numbers (`INN-YYYYMMDD-XXXX`) are checked against existing ones and a
  duplicate is rejected by the database rather than overwriting a record.

---

## 11. Troubleshooting

| Problem | Fix |
| --- | --- |
| `npm` / `node` not recognised | Reinstall Node.js, then **restart VS Code** |
| Blank page after deploy | Pages source must be **GitHub Actions** (section 4), not "Deploy from a branch" |
| Footer says "Local mode" but I set keys | Both `VITE_SUPABASE_*` must be set; restart `npm run dev` after editing `.env` |
| "Couldn't reach the database" banner | Check the URL/key, that the SQL migration ran, and your internet; press **Retry** |
| Changes not live on the site | Look at the **Actions** tab — a failing test or type error blocks deploy |
| Red squiggles inside `supabase/functions` | Install the **Deno** extension (the folder is Deno code) |
| Tailwind classes not autocompleting | Install **Tailwind CSS IntelliSense**; reload the window |
| Push rejected ("fetch first") | Someone/something pushed first: run `git pull`, then `git push` |
| Weekly email didn't arrive | Check Dashboard → Edge Functions → Logs; confirm `RESEND_API_KEY`, a verified sender, and recipients in Admin Settings |
