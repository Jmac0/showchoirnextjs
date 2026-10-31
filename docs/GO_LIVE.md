# Go-live checklist

Everything needed to run the Show Choir website on **Vercel** with a **hosted MongoDB**, **live Stripe** and **live GoCardless** – then bring the existing members over. Work top to bottom; tick as you go.

Use a strong random value wherever it says _random_: `openssl rand -base64 32`.

---

## 0. Accounts

- [ ] **Vercel** – Show Choir is a business, so the site needs a **Pro** plan (Hobby is for non-commercial use only).
- [ ] **MongoDB Atlas** – **Flex** tier (from ~$8/month, daily backups). ~200 members is only a few MB, so M10 (~$57/month) is overkill; free M0 has **no backups** and isn't meant for production. Flex can be upgraded to M10 later without changing the connection string.
- [ ] **Stripe** – account activated for live payments (business details, bank account).
- [ ] **GoCardless** – live account verified (the one the existing Direct Debits are on).
- [ ] **Resend** – for emails, with the show-choir.co.uk domain (step 5).
- [ ] **Cloudflare** – R2 for Music & Lyrics (already set up for dev).

---

## 1. MongoDB Atlas (live database)

- [ ] Create a project and a **Flex** cluster on **AWS, Ireland (`eu-west-1`)** – London isn't offered for Flex; Ireland is AWS's main EU region and pairs with Vercel's Dublin region (step 2), so the website and database sit side by side (~1 ms per query).
- [ ] **Database Access** → add a database user just for the website, with a long random password, role "Read and write to any database". Keep your own Atlas login for admin.
- [ ] **Network Access** → Vercel's servers don't have fixed addresses, so either allow `0.0.0.0/0` (protected by the user/password) or use the **Atlas Vercel integration**, which sets this up.
- [ ] **Connect → Drivers** → copy the connection string, put the password in and the database name **`show_choir`** before the `?`:
      `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/show_choir?retryWrites=true&w=majority` → this is `MONGO_URI`.
- [ ] **Alerts** (Project → Alerts): email alerts for connections and storage – free.
- [ ] Once real data is in, **test a restore once**: restore a snapshot into a throwaway cluster, so you know backups work before you need them.
- [ ] Do **not** run `npm run seed` against it (the script refuses anyway) – live starts empty.
- [ ] If any data is ever brought over from the old system, run `npm run migrate:topups` (and `npm run check:choirs`) against it, dry run first.

---

## 2. Vercel (the website)

- [ ] **Add New → Project** → import the GitHub repo. Framework: Next.js (detected).
- [ ] **Production branch: `main`**. Work stays on `dev`; going live = merge `dev` into `main` (via a pull request).
- [ ] **Settings → Functions → Function Region: Dublin, Ireland (`dub1`)** – next to the database. ⚠️ Vercel's default is Washington DC (`iad1`), which would add ~80 ms to every database query. Members aren't affected by the server being in Dublin – pages and images are served from Vercel's network near them.
- [ ] **Settings → Domains** → add `show-choir.co.uk` and `www.show-choir.co.uk`, update the DNS records Vercel shows at your domain registrar. Pick one as the main address (the other redirects) – use that address everywhere below as `https://SITE`.
- [ ] **`app.show-choir.co.uk`** – the address the store apps use (built into them, so it must never be removed – phones keep using it). Until launch it's connected to the **`dev` branch** (Settings → Domains), so App Store / Play reviewers see the new site with the dev database; on launch day it moves to Production (step 8). Never set it to redirect – the app's logins and payments don't survive a redirect.
- [ ] **Settings → Environment Variables** (scope: Production) – all of section 7.
- [ ] `NEXT_PUBLIC_…` values are built into the pages, so **redeploy after changing any of them** (Deployments → ⋯ → Redeploy).

---

## 3. Stripe (Flexi packs) – live mode

In the Stripe dashboard, switch **Test mode off** first.

- [ ] **Products**: the two Flexi products must exist in live mode – "Flexi Non Concession" and "Flexi Concession" – each with a **default price** equal to what members are charged online.
  - Copy each live product's id (`prod_…`) → `STRIPE_FLEXI_FULL_PRODUCT` and `STRIPE_FLEXI_CONCESSION_PRODUCT`. Live products have **different ids** from test ones, so Preview gets the test-mode ids. (Unset, the code falls back to `prod_NPVoljs1x5z8TW` / `prod_NPW4JZ4qmBULfB` – check which mode those belong to.)
  - Keep `NEXT_PUBLIC_FLEXI_FULL_PRICE` / `NEXT_PUBLIC_FLEXI_CONCESSION_PRICE` (shown on the site and the app's desk drawer) the same as the Stripe default prices.
- [ ] **Developers → API keys** → secret key `sk_live_…` → `STRIPE_SECRET`, and publishable key `pk_live_…` → `STRIPE_PUBLISHABLE_KEY` (the app's in-app payment sheet gets it from `api/stripe/flexi-payment-sheet` – Preview needs the `pk_test_…` one).
- [ ] **Settings → Payment methods**: check **Apple Pay** and **Google Pay** are on (used by the website's Checkout and the app's payment sheet).
- [ ] **Apple Pay in the app** (iOS): Apple Developer → Identifiers → **Merchant ID** `merchant.co.uk.show-choir` (matches the app's `app.json`). Then Stripe → Settings → Payment methods → Apple Pay → **iOS certificates → Add**: download Stripe's CSR, use it to create an *Apple Pay Payment Processing Certificate* for that merchant ID in Apple Developer, and upload the certificate back to Stripe. Then a new iOS build.
- [ ] **Google Pay in the app** (Android): Google only shows Google Pay in a live app once it has **production access**. [Google Pay & Wallet Console](https://pay.google.com/business/console) → set up the business profile → **Google Pay API → Get started** → add the Android app (`co.uk.showchoir.app`), integration type **Gateway** (Stripe), with screenshots of the payment sheet from a Play build → submit and wait for approval. No new build needed – until it's approved the app's payment sheet simply leaves the Google Pay button out (card still works).
- [ ] **Developers → Webhooks → Add endpoint**
  - URL: `https://SITE/api/stripe/webhooks`
  - Event: **`payment_intent.succeeded`** (the only one used)
  - Copy the **signing secret** `whsec_…` → `STRIPE_ENDPOINT_SECRET` (a different value from the local `stripe listen` one).
- [ ] If the old system had a live Stripe webhook pointing somewhere else, **delete it** once the new one works, so payments aren't processed twice.

---

## 4. GoCardless (monthly Direct Debit) – live

Can be done any time (nothing on the live site uses these until launch):

- [ ] **Developers → Create access token** (read-write) in the **live** dashboard → `GO_CARDLESS_ACCESS_TOKEN`; `GO_CARDLESS_ENVIRONMENT=live`.

⚠️ **Launch day only** (step 8), **after** `dev` is merged into `main` – until then the webhook page doesn't exist on the live site (it's only on `dev`), so GoCardless would get a 404 for every live event while the old Heroku app is still handling them:

- [ ] **Developers → Webhook endpoints → Create**
  - URL: **`https://www.show-choir.co.uk/api/gocardless/webhooks`** – with `www.`: the address without it redirects (308), and webhooks don't reliably follow redirects.
  - Copy its **secret** → `GO_CARDLESS_WEBHOOK_SECRET` in Vercel (Production), then redeploy.
- [ ] ⚠️ **Remove the old webhook endpoint** (the old Express app on Heroku) at the same time you add the new one. While both are active, a new sign-up's "mandate created" event would create **two subscriptions – the member would be charged twice**.
- [ ] Prices: `GO_CARDLESS_MONTHLY_AMOUNT=3000` (£30 single) and **`GO_CARDLESS_JOINT_AMOUNT=5000`** (£50 legacy joint – existing members only; the code assumes £50 if it's missing).
- [ ] Test: GoCardless dashboard → the webhook endpoint → **Send test webhook**, check it gets a 200.

---

## 5. Email (Resend)

- [ ] Resend → **Domains → Add** `show-choir.co.uk` → add the DNS records it shows (SPF/DKIM) → wait for **Verified**. Until then emails only reach the Resend account owner.
- [ ] `FROM_EMAIL` e.g. `Show Choir <hello@show-choir.co.uk>`; `ADMIN_EMAIL` = where problem alerts go; `RESEND_API_KEY` (a production key).
- [ ] **Taster follow-up email** (sent by GAs from the app's Taster bookings screen): `src/components/emails/TasterFollowUpEmail.tsx` still has placeholder wording – replace every part marked `TO WRITE` (opening and second paragraphs, benefits, price line, closing line) with the real text before launch.
- [ ] **Links to the app** (iOS and Android) – once the apps are in the stores:
  - Store addresses: Android `https://play.google.com/store/apps/details?id=co.uk.showchoir.app` (set by the package name in the app's `app.json`, so it's known already – but it only works once the app is **published** on Google Play, not yet uploaded); iOS `https://apps.apple.com/app/id<Apple ID>` (the Apple ID number is in App Store Connect → the app → App Information). Open both links on a phone before adding them.
  - **Welcome email** (`src/components/emails/EmailTemplate.tsx`) – add both links, with text saying to **create your account on the website first** (the button in the email), then log in to the app with the same email and password. The app has no sign-up of its own. Do the same in the existing members' invite email (`src/components/emails/InviteEmail.tsx`).
  - **Members section of the site** (`src/pages/members/dashboard.tsx`) – add both links ("Get the app"), saying to log in with the same email and password as the website.

---

## 6. Music & Lyrics storage (Cloudflare R2)

- [ ] R2 → create the live bucket, e.g. `showchoir-music` (private).
- [ ] **Manage API tokens** → token with Object Read & Write on **that bucket only** → key id + secret.
- [ ] Bucket → Settings → **CORS policy**:
  ```json
  [{ "AllowedOrigins": ["https://www.show-choir.co.uk", "https://show-choir.co.uk"],
     "AllowedMethods": ["GET", "PUT", "HEAD"], "AllowedHeaders": ["Content-Type"],
     "MaxAgeSeconds": 3600 }]
  ```
- [ ] After launch, upload the songs again through **Music admin** on the live site (dev files and database don't carry over).

---

## 7. Environment variables for Vercel (Production)

| Variable | Value |
|---|---|
| `MONGO_URI` | Atlas connection string (step 1) |
| `NEXTAUTH_URL` | `https://SITE` |
| `NEXTAUTH_SECRET` | _random_ |
| `NEXT_PUBLIC_BASE_URL` | `https://SITE` (links in emails) |
| `JWT_SECRET` | _random_ (app logins) |
| `JWT_ACCESS_TOKEN_EXPIRY` / `JWT_REFRESH_TOKEN_EXPIRY` | optional – default `15m` / `30d` |
| `EMAIL_SECRET` | _random_ – ⚠️ **never change it once emails have gone out**: every welcome/invite link uses it and would stop working |
| `STRIPE_SECRET` | `sk_live_…` (step 3) |
| `STRIPE_ENDPOINT_SECRET` | live webhook `whsec_…` (step 3) |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_…` (step 3) – for the app's payment sheet |
| `STRIPE_FLEXI_FULL_PRODUCT` / `STRIPE_FLEXI_CONCESSION_PRODUCT` | live Flexi product ids `prod_…` (step 3) |
| `NEXT_PUBLIC_FLEXI_FULL_PRICE` | e.g. `95` (pounds, same as Stripe) |
| `NEXT_PUBLIC_FLEXI_CONCESSION_PRICE` | e.g. `85` |
| `FLEXI_CASH_DISCOUNT` | `5` (cash at the desk is £5 less) |
| `FLEXI_EXPIRY_FROM` | ⚠️ e.g. `2027-01-01` – the date Flexi sessions start expiring after 6 months without a check-in. Nothing expires before it, and members are warned the month before. **Set it only after the 6-month rule is in the terms and current Flexi members have been told.** Leave it out and nothing expires. |
| `GO_CARDLESS_ACCESS_TOKEN` | live token (step 4) |
| `GO_CARDLESS_ENVIRONMENT` | `live` |
| `GO_CARDLESS_WEBHOOK_SECRET` | live endpoint secret (step 4) |
| `GO_CARDLESS_MONTHLY_AMOUNT` | `3000` |
| `GO_CARDLESS_JOINT_AMOUNT` | `5000` |
| `RESEND_API_KEY`, `FROM_EMAIL`, `ADMIN_EMAIL` | step 5 |
| `R2_ACCOUNT_ID` | `4742daffb41dc0ff0a08481ac862fa10` |
| `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | step 6 – and **no** `R2_ENDPOINT` |
| `CONTENTFUL_SPACEID`, `CONTENTFUL_ACCESS_TOKEN`, `CONTNETFUL_SYSTEM_ID` | copy from `.env.local` (the misspelling is what the code reads) |
| `MAILCHIMP_API`, `MAILCHIMP_SERVER_PREFIX`, `MAILCHIMP_LIST_ID` | from the **real** Mailchimp account (**not** `.env.local` – that's a separate account used only for dev) – `MAILCHIMP_LIST_ID` is its **Prospects** audience (Book a taster) |
| `MAILCHIMP_CHOIR_LIST_ID` | the real account's **Choir** audience id. Members move Prospects → Choir when their membership starts, and back when it ends. Unset, nothing is synced. |
| `CRON_SECRET` | _random_ – protects the daily housekeeping job (`/api/cron/daily`, scheduled in `vercel.json`); Vercel sends it automatically |

**Not needed** (in the local env files but no longer read by the code): `S3_*`, `DROPBOX_*`, `STRIPE_PRICE_FLEXI*`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE` (the one in use is `STRIPE_PUBLISHABLE_KEY`), `NEXT_PUBLIC_GOCARDLESS_SIGNUP_URL`, `GC_WEBHOOK_SECRET`, `BASE_URL`, `DB_PATH`, `EMAIL_ALGORITHM`, `ABSTRACT_API_KEY`, `CONTNETFUL_DELIVERY_TOKEN`, `CONTNETFUL_PREVIEW_TOKEN`. `EMAIL_TRIGGER_SECRET` (its endpoint has been removed).

Dev-only, never in Vercel: `R2_ENDPOINT`, the `stripe listen` webhook secret, sandbox GoCardless values.

---

## 8. Launch day

1. [ ] Merge `dev` → `main`; Vercel builds and deploys. Check the build log is clean.
2. [ ] **Point the apps at the live site**: Settings → Domains → `app.show-choir.co.uk` → Edit → connect it to **Production** (instead of the `dev` branch). The apps already on phones switch straight over – no new build. Check `https://app.show-choir.co.uk` shows the live site.
3. [ ] Swap the webhooks over (steps 3 & 4 – add new, remove old). GoCardless: create the live endpoint only now that `main` has the webhook page, add its secret to Vercel and redeploy, remove the Heroku endpoint, then **Send test webhook** → 200.
4. [ ] **First admin**: sign up on the live site as yourself (or create your member), then in Atlas → Browse Collections → `members` → your record → set `role` to `"admin"`. Do the same with `"ga"` for each welcome assistant.
5. [ ] Smoke tests on the live site:
   - [ ] Home and venue pages load (Contentful)
   - [ ] Flexi sign-up with a real card → sessions added, welcome email arrives, create account, log in. Refund it in Stripe afterwards.
   - [ ] Flexi top-up from the Account page
   - [ ] Monthly sign-up → GoCardless form → member marked active, welcome email (cancel the test mandate afterwards)
   - [ ] Music admin upload → plays on the Resources page
   - [ ] App logs in (live account); GA scan checks someone in
7. [ ] **Release the apps**: they were approved ahead of time and held – Play Console → Publishing overview → Managed publishing → Publish; App Store Connect → the approved version → Release this version.
6. [ ] Book a taster form → appears in Mailchimp.

---

## 9. After launch

- [ ] **Upgrade Next.js 13.5.5 → 15.5** (latest patched) on a **new branch**, once the site is running. 13.5.5 has 36 published security advisories; several that apply here (Image Optimization, cache poisoning, rewrites, denial-of-service) are only fixed in 15.5. Keep React 18. Update next-auth 4.24, mongoose, axios, crypto-js with it. Expect: `images.domains` → `remotePatterns`, small request-API changes, ESLint setup. Check: tests, typecheck, lint, `next build` (dev server stopped), then click through the site before merging.

- [ ] **Daily job**: Vercel → Settings → Cron Jobs shows `/api/cron/daily` (3am UTC). Run it once by hand (Cron Jobs → Run) and check the log – it expires lapsed Flexi members and moves ended memberships back to the Mailchimp Prospects audience.
- [ ] **Mailchimp** (real account – before launch): both audiences (Prospects and Choir) need a group category (like "Select Choir") with one group per choir – currently Banstead, Dorking, Cobham, Leatherhead, West Byfleet, Walton on Thames – spelt exactly as on the site (the Contentful venue names without "Show Choir"). The code finds each choir's group by name. **When a choir is added in Contentful, add its group to both audiences too**, so taster bookings and members get their choir group. First name / last name fields (`FNAME`, `LNAME`) are Mailchimp's defaults.

- [ ] **Flexi expiry**: put the 6-month rule in the membership terms, tell current Flexi members, then set `FLEXI_EXPIRY_FROM` in Vercel (a date at least a month away, so they get the warning first) and redeploy.

- [ ] **Bring over the existing Direct Debit members**: admin → **DD members** → Import from GoCardless → add the second singer on each £50 joint membership → send yourself a test invite → invite one choir, then the rest.
- [ ] **Bring over the existing Flexi members** (sessions are on paper): in the **real** Mailchimp account, tag each current Flexi member **`Flexi`** in the **Choir** audience (not Prospects – only the Choir audience is imported) → admin → **Flexi members** → Import from Mailchimp → check the summary (anyone already a member another way is left alone) → send yourself a test invite → invite one choir, then the rest. Tell the GAs: the first time an imported Flexi member is scanned, the app asks for the sessions left on their paper record – keep the paper records at the desk until everyone's been in (the **Sessions to confirm** tab shows who's left; admins can enter them there too).
- [ ] Switch off the old system once nothing depends on it: the **showChoirExpress app on Heroku**, any **Atlas trigger** that called the old `sendCreateNewAccountEmail` (the website no longer has it - the GoCardless webhook sends the welcome email itself), and the **old AWS S3 bucket**.
- [ ] Remove the unused variables from the local `.env` files (section 7 list).
- [ ] App release: set `EXPO_PUBLIC_BASE_URL=https://SITE` for production builds, then EAS Build → TestFlight → App Store (see the app repo's `CLAUDE.md`).
