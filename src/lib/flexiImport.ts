import { format } from "date-fns";

import { FLEXI_TAG, FlexiImportSummary } from "@/src/lib/flexiMembersShared";
import {
  choirAudienceId,
  contactsWithTag,
  TaggedContact,
} from "@/src/lib/mailchimp";
import Members from "@/src/lib/models/member";

/* Brings existing Flexi members over from Mailchimp (server only).

Flexi members paid in different ways before the website, and their sessions
are only on paper at the rehearsal desks - so there's nothing like GoCardless
to read. Instead the admin tags current Flexi members "Flexi" in Mailchimp
(Choir audience only - Prospects is people who booked a taster, not
members), and this creates a member for each tagged contact:

- Flexi, sessions NOT confirmed: the first time they're scanned at a
  rehearsal, the app asks the GA to check the paper record and enter their
  sessions (api/member-resources/confirm-flexi-sessions.ts).
- Joined today, so the 6-month Flexi expiry (lib/flexiExpiry.ts) counts from
  the import rather than treating them as never having come.
- Then they get an invite email to finish their account (home choir,
  password...) - see the "Flexi members" admin page.

- Read only on Mailchimp: nothing is changed there.
- Safe to run again: anyone already imported is skipped, so it only adds new
  ones.
- Never touches an existing member with the same email (e.g. someone who
  joined on the website or pays by Direct Debit) - they're listed instead.
- Contacts whose email bounced ("cleaned") can't be invited, so they're listed.

The caller must have connected to the database. Throws if Mailchimp fails. */

// "dd/MM/yyyy" - the date format members are saved with
const today = () => format(new Date(), "dd/MM/yyyy");

const describe = (contact: TaggedContact) =>
  `${[contact.first_name, contact.last_name].filter(Boolean).join(" ")} (${
    contact.email
  })`.trim();

export async function importFlexiFromMailchimp(): Promise<FlexiImportSummary> {
  const summary: FlexiImportSummary = {
    created: 0,
    alreadyImported: 0,
    alreadyMember: [],
    badEmail: [],
    tagFound: false,
  };

  // --- Everyone tagged in the Choir audience (one entry per email) ---

  const listId = choirAudienceId();
  if (!listId) {
    throw new Error(
      "MAILCHIMP_CHOIR_LIST_ID isn't set, so there's no Choir audience to import from"
    );
  }
  const contacts = await contactsWithTag(listId, FLEXI_TAG);
  summary.tagFound = !!contacts;
  const byEmail = new Map<string, TaggedContact>();
  (contacts || []).forEach((contact) => {
    if (contact.email && !byEmail.has(contact.email)) {
      byEmail.set(contact.email, contact);
    }
  });

  // --- Create a member for each one not here already ---

  // eslint-disable-next-line no-restricted-syntax
  for (const contact of Array.from(byEmail.values())) {
    if (contact.status === "cleaned") {
      summary.badEmail.push(describe(contact));
      // eslint-disable-next-line no-continue
      continue;
    }
    // eslint-disable-next-line no-await-in-loop
    const existing = await Members.findOne({ email: contact.email }).lean<{
      imported_from_mailchimp?: boolean;
    }>();
    if (existing?.imported_from_mailchimp) {
      summary.alreadyImported += 1;
      // eslint-disable-next-line no-continue
      continue;
    }
    if (existing) {
      summary.alreadyMember.push(describe(contact));
      // eslint-disable-next-line no-continue
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    await Members.create({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      // Their choir group, if they're in exactly one - they confirm it (or
      // choose one) when they finish their account
      home_choir: contact.groups.length === 1 ? contact.groups[0] : "",
      street_address: "",
      town_city: "",
      county: "",
      post_code: "",
      phone_number: "",
      age_confirm: false,
      consent: false,
      membership_type: "flexi",
      active_member: true,
      active_mandate: false,
      flexi_sessions: 0,
      flexi_sessions_confirmed: false,
      date_joined: today(),
      topUpDate: [],
      role: "",
      imported_from_mailchimp: true,
      invite: { status: "not_sent", send_count: 0 },
    });
    summary.created += 1;
  }

  return summary;
}
