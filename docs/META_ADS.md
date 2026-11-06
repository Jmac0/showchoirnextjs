# Meta ads and the Meta list

How Show Choir's Meta data works, and the jobs that have to be done by hand. Menu names and limits in Meta change often, so check them in Ads Manager.

## What goes to Meta automatically

Only for visitors who click **Accept** on the cookie banner:

- **Page visits** (`PageView`), on public pages only.
- **Taster bookings** (`Lead`), sent by the server. Live now.
- **Joins** (`Purchase` for Flexi, `Subscribe` for Direct Debit), sent by the server. These go live with the members' launch.

## What the Meta list is

The Meta list is separate from the cookie banner. It's for building a lookalike audience from members who agreed to it.

**Nothing on the list goes to Meta automatically. An email only reaches Meta when you upload the file.**

A member gets on the list by ticking the optional box when they create their account, or later on their Account page.

Each time the list is opened or downloaded, the site works it out afresh. It includes members who:

- currently have a yes saved
- are confirmed as over 18
- have an active membership

Anyone who withdraws, leaves or deletes their account drops off the next download automatically, but stays in Meta's copy until you replace it.

## Before the first upload

- [ ] Ask your adviser to read the tick wording and the privacy policy.
- [ ] Check Apple's and Google's current rules, as sharing member emails with an ad network may change the app's privacy answers in both stores.
- [ ] Check that the fuller privacy policy on `dev`, which covers the Meta list, is live on `www`. The current live version doesn't mention it.

## First upload

1. In the site's admin area, go to **Reports → Meta list** and click **Download the list**. The file has an `email` column and nothing else.
2. In Meta Ads Manager, go to **Audiences → Create audience → Custom audience → Customer list**, and upload the file. Meta hashes the emails in your browser before sending them, then matches them to Facebook and Instagram accounts.
3. Delete the file from your computer.
4. Create a **Lookalike audience** from that customer list, with UK as the location. Start at 1%, the closest match.
5. Choose the lookalike as the audience for an ad set, keeping your area and age limits.
6. You can also exclude the customer list from "book a taster" ads, so you don't pay to show them to existing members.

Meta needs at least 100 matched people. The count on the Meta list page is how many members are on the list, not how many Meta will match. Meta shows the matched size after upload, and it's usually lower, so 100 on the list may not be enough.

## Monthly job: put this in your calendar

The privacy policy promises the list is updated at least once a month. The site doesn't remind you or tell you when someone withdraws.

1. Download a fresh list from **Reports → Meta list**.
2. Open the customer list audience in Meta and choose the option to **replace** its customers. Don't add to them, as that would leave people on it who have since opted out.
3. Delete the file from your computer.

A lookalike built from the list should refresh when the list changes, but check how often in Ads Manager.

## If you change things

- **The tick's wording:** edit `src/components/forms/MetaAudienceOptIn.tsx` and update `META_AUDIENCE_WORDING_VERSION` in `src/lib/metaAudience.ts`, so each member's record shows what they agreed to.
- **How often the list is updated:** change the privacy policy and the note on the Meta list page.
- **Automating the monthly job:** Meta has an API that could do it, at the cost of more to build and maintain.
