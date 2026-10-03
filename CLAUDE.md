# Show Choir website

Next.js (pages router) site for Show Choir: public pages from Contentful, member sign-up and payments, the members' area, admin pages, and the API the Expo app uses (sibling repo `../showChoirExpoApp`).

## Commands

- `npm run dev` – Next.js dev server **plus** the Stripe CLI forwarding test webhooks (`scripts/dev.mjs`, uses `STRIPE_SECRET`, not `stripe login`). `npm run dev:next` = Next only.
- `npm test` – Jest (`src/__tests__/api`, `src/__tests__/ui`). Known failure: `Hero.test.tsx`.
- `npx tsc --noEmit` – typecheck (known error in `AboutComponentContainer.test.tsx`). `npm run lint` / `npx eslint --fix <files>`.
- `npm run seed` – local dummy members from `scripts/seed/members.json` (password `password123`; admin `test@test.com`, GA `ga@example.com`, real inbox for email tests `jamiejmackenzie@gmail.com` (Resend's test sender only delivers there); Direct Debit stopped: `dd.grace@example.com` always inside the 14-day grace period, `dd.cancelled@example.com` past it – via `"_dd_ended_days_ago"` in the JSON; Flexi expiry: `flexi.expiring@example.com` sees the warning, `flexi.lapsed@example.com` expires on first login/scan – via `"_last_check_in_days_ago"`). Refuses non-local databases.
- `npm run ngrok` – tunnel for GoCardless sandbox webhooks. `npm run minio` – local S3-compatible storage (optional; dev normally uses the R2 dev bucket).
- `npm run migrate:topups` / `npm run check:choirs` – data fix scripts; dry run by default (`-- --apply` / `-- --fix` to write).

**Never run `next build` while `next dev` is running** – they share `.next` and it breaks the dev server.

## How it fits together

- **Database**: MongoDB via Mongoose, `src/lib/models/` (`member.ts`, `checkin.ts`, `song.ts`, event logs). `dbConnect()` before queries. Typed exports: `(mongoose.models.X as mongoose.Model<T>) || mongoose.model<T>(...)` so `.lean()` is typed.
- **Passwords & logins**: rules in `lib/passwordRules.ts` (min 5, bcrypt cost 10) – use them, don't hard-code. Both logins go through `lib/loginLimiter.ts` (5 wrong per email / 30 per IP in 15 min → "Too many attempts"; counts in the `loginattempts` collection, auto-deleted). Request values that reach queries must be checked as strings first (no `sanitizeFilter` – it would break our own `$ne`/`$in` queries). Never log `MONGO_URI`. Forgot password: `pages/auth/forgot-password.tsx` → emailed 1-hour link (hashed token, `password_reset` on the member) → `pages/auth/reset-password.tsx`; the app has its own screen (`src/app/forgot-password.tsx` in the app repo) that asks for the link; the link still opens this website page.
- **Auth**: website = NextAuth credentials (`pages/api/auth/[...nextauth].ts`), role in the session. App = JWT (`api/auth/appLogin.ts`, `refresh.ts`, `lib/auth/verifyJWT.ts`). Role guards: `lib/auth/requireAdmin.ts`, `requireGA.ts` – they check the role **in the database**, not just the session. Admin pages check on the server in `getServerSideProps`.
- **Memberships**:
  - Flexi (packs of 10 sessions) – Stripe Checkout (`api/stripe/checkout_flexi*.ts`); `api/stripe/webhooks.ts` adds sessions and logs each pack in `topUpDate` (typed `TopUp`: date, method, amount_pence, Stripe id). Desk cash/card payments: `api/member-resources/record-payment.ts`.
  - Flexi is being phased out: only `membership_type: "flexi"` members can buy packs (`canBuyFlexi`). Sessions expire 6 months after the last check-in (`lib/flexiExpiry.ts`, checked on app open / login / scan, from `FLEXI_EXPIRY_FROM`; unset = off) → `membership_type: "flexi_expired"`, offered Direct Debit.
  - Monthly Direct Debit – GoCardless (`lib/gocardless.ts`, `api/gocardless/mandateflow.ts`, `webhooks.ts`). Prices: £30 single (`GO_CARDLESS_MONTHLY_AMOUNT`), legacy £50 joint (`GO_CARDLESS_JOINT_AMOUNT`, existing members only).
  - Existing DD members are onboarded from GoCardless on the admin "DD members" page (`lib/gocardlessImport.ts`, `api/admin/dd-members/*`, invite → `pages/register/welcome.tsx`). Only active mandates are imported/invited.
- **Check-in** (GA role, from the app): `api/member-resources/check-in-member.ts`, `search-members.ts`, `attendance.ts`, `undo-check-in.ts`, `lib/checkins.ts`.
- **Music & Lyrics**: files in Cloudflare R2 (S3 API, `lib/music.ts`), song list/metadata in Mongo `songs`. **Never list the bucket for members** (Class A cost) – read Mongo and sign links (free). Admin uploads go browser → R2 via presigned PUT. `R2_ENDPOINT` only for MinIO.
- **Mailchimp** (`lib/mailchimp.ts`, `lib/memberAudience.ts`): Prospects audience (`MAILCHIMP_LIST_ID`, Book a taster) and Choir audience (`MAILCHIMP_CHOIR_LIST_ID`). Membership starts (DD active, Flexi paid, invite accepted) → moved to Choir; ends → back to Prospects. Only when `MAILCHIMP_CHOIR_LIST_ID` is set – **never set it in dev** (the keys are the live account).
- **Daily job**: `api/cron/daily.ts` (Vercel Cron, `vercel.json`, needs `CRON_SECRET`) – expires lapsed Flexi members and moves ended memberships out of the Choir audience.
- **Email**: Resend + react-email templates (`components/emails/`, `lib/email/`). Account links carry the member's email encrypted (`lib/encryptEmail.ts`) – that, not a typed email, proves who they are.
- **Content**: Contentful (`lib/contentfulClient.ts`, server only). Choir/venue list for forms: `getChoirVenues()` → `ChoirOptions`.

## Gotchas

- **Server-only code must not reach the browser bundle** (Contentful client, Mongoose, R2/GoCardless clients). Keep shared types/helpers in browser-safe files (`*Shared.ts`, `lib/venues.ts`) and server code separate (`lib/music.ts`, `lib/ddMembers.ts`).
- **Restart the dev server after changing a Mongoose model** – the running server keeps the old schema (`mongoose.models.X ||`) and silently drops new fields.
- Mongoose: a field literally named `type` in a schema must be written `type: { type: String }`.
- Webhooks (Stripe, GoCardless): verify the signature on the raw body (`bodyParser: false` + `micro` buffer), finish all work **before** replying (Vercel stops on reply), and log event ids for idempotency.
- Member emails are stored lower-case and trimmed; look them up the same way.
- Dates: UK dates via `lib/ukDate.ts`; older member fields (`date_joined`, `direct_debit_started`) are `dd/MM/yyyy`-style strings.
- Resend's test sender only delivers to the account owner's address.
- In `jest.mock()` use relative paths (the `@/` alias isn't applied to mock paths).

## Conventions

- Plain-English comments explaining the *why*, written for a non-specialist reviewer (match the existing density).
- Prettier via ESLint: double quotes, 80 columns, **no trailing commas in function arguments** (editor-added ones fail lint). Run `npx eslint --fix` on touched files.
- Tailwind; dark cards with gold borders (`border-lightGold`, `bg-lightBlack/90`), gold gradient headers (`from-yellow-200 to-yellow-500`).
- Work on the `dev` branch; commit/push only when asked; stage files explicitly (the user may have their own work in progress).
- Env: `.env.local` (shared), `.env.development.local` (dev-only, overrides). Never commit secrets.
