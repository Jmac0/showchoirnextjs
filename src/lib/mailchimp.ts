import crypto from "node:crypto";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mailchimp = require("@mailchimp/mailchimp_marketing");

/* Mailchimp - server only. Two audiences (production uses the real
account; .env.local has a separate account used only for dev):

  Prospects  MAILCHIMP_LIST_ID       people who booked a taster session
                                     (api/mailchimp/bookTasterSession.ts)
  Choir      MAILCHIMP_CHOIR_LIST_ID members

When someone's membership starts they move from Prospects to Choir
(joinChoirAudience), and when it ends they move back (leaveChoirAudience).
Mailchimp has no "move", so it's: add/update in one audience, then archive in
the other (archived = removed from the audience but history kept, and
reversible - and Mailchimp doesn't bill for archived contacts).

Unsubscribes are respected: someone is only added as "subscribed" if they're
NEW to that audience - anyone already there keeps their status.

Member syncing only happens when MAILCHIMP_CHOIR_LIST_ID is set.

Never throws: a Mailchimp problem is logged, and never stops a payment
webhook or a sign-up. Returns whether it worked. */

mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API,
  server: process.env.MAILCHIMP_SERVER_PREFIX,
});

export const prospectsListId = () => process.env.MAILCHIMP_LIST_ID || "";
const choirListId = () => process.env.MAILCHIMP_CHOIR_LIST_ID || "";
export const isMemberSyncOn = () => !!choirListId() && !!prospectsListId();

type MailchimpMember = {
  email: string;
  first_name?: string;
  last_name?: string;
  home_choir?: string;
};

// Mailchimp finds a contact by the MD5 of their lower-case email
const contactId = (email: string) =>
  crypto.createHash("md5").update(email.toLowerCase().trim()).digest("hex");

// Every group ("interest") in an audience, id -> name, across all its group
// categories (e.g. "Dorking"). Remembered per audience, as groups rarely
// change.
const groupCache = new Map<string, Map<string, string>>();
async function groupNames(listId: string) {
  const cached = groupCache.get(listId);
  if (cached) return cached;
  const names = new Map<string, string>();
  const { categories } = await mailchimp.lists.getListInterestCategories(
    listId,
    { count: 100 }
  );
  // eslint-disable-next-line no-restricted-syntax
  for (const category of categories) {
    // eslint-disable-next-line no-await-in-loop
    const { interests } = await mailchimp.lists.listInterestCategoryInterests(
      listId,
      category.id,
      { count: 100 }
    );
    interests.forEach((interest: { id: string; name: string }) =>
      names.set(interest.id, interest.name)
    );
  }
  groupCache.set(listId, names);
  return names;
}

// The id of the group named after this choir in an audience, e.g. "Dorking"
export async function choirInterestId(
  listId: string,
  choir?: string
): Promise<string | undefined> {
  if (!choir) return undefined;
  const wanted = choir.toLowerCase();
  const groups = Array.from((await groupNames(listId)).entries());
  return groups.find(([, name]) => name.toLowerCase() === wanted)?.[0];
}

// A contact with a tag (contactsWithTag)
export type TaggedContact = {
  email: string;
  first_name: string;
  last_name: string;
  // "subscribed", "unsubscribed", "cleaned" (email bounced) ...
  status: string;
  // Names of the groups they're in, e.g. ["Dorking"]
  groups: string[];
};

// Everyone with this tag in an audience (e.g. "Flexi"), or null if the
// audience has no tag by that name. For admin imports (lib/flexiImport.ts) -
// unlike the rest of this file it throws if Mailchimp fails, so the admin
// sees it.
export async function contactsWithTag(
  listId: string,
  tag: string
): Promise<TaggedContact[] | null> {
  // Tags are "static segments" in Mailchimp's API
  const { segments } = await mailchimp.lists.listSegments(listId, {
    type: "static",
    count: 1000,
  });
  const segment = (segments as { id: number; name: string }[]).find(
    (s) => s.name.trim().toLowerCase() === tag.toLowerCase()
  );
  if (!segment) return null;

  const groups = await groupNames(listId);
  const contacts: TaggedContact[] = [];
  const PAGE = 1000;
  for (let offset = 0; ; offset += PAGE) {
    // eslint-disable-next-line no-await-in-loop
    const page = await mailchimp.lists.getSegmentMembersList(
      listId,
      segment.id,
      { count: PAGE, offset }
    );
    const members = (page.members || []) as {
      email_address: string;
      status: string;
      merge_fields?: { FNAME?: string; LNAME?: string };
      interests?: Record<string, boolean>;
    }[];
    members.forEach((member) =>
      contacts.push({
        email: String(member.email_address || "")
          .toLowerCase()
          .trim(),
        first_name: String(member.merge_fields?.FNAME || "").trim(),
        last_name: String(member.merge_fields?.LNAME || "").trim(),
        status: member.status,
        groups: Object.entries(member.interests || {})
          .filter(([, isIn]) => isIn)
          .map(([id]) => groups.get(id) || "")
          .filter(Boolean),
      })
    );
    if (members.length < PAGE) break;
  }
  return contacts;
}

// Choir audience id ("" if not set) - for the Flexi import
export const choirAudienceId = () => choirListId();

// Adds or updates them in an audience (subscribed only if new to it), with
// their name and home choir group
async function upsert(listId: string, member: MailchimpMember) {
  const interestId = await choirInterestId(listId, member.home_choir).catch(
    () => undefined
  );
  await mailchimp.lists.setListMember(listId, contactId(member.email), {
    email_address: member.email,
    status_if_new: "subscribed",
    merge_fields: {
      FNAME: member.first_name || "",
      LNAME: member.last_name || "",
    },
    ...(interestId ? { interests: { [interestId]: true } } : {}),
  });
}

// Archives them in an audience - fine if they were never in it
async function archive(listId: string, email: string) {
  try {
    await mailchimp.lists.deleteListMember(listId, contactId(email));
  } catch (error) {
    const status = (error as { status?: number })?.status;
    if (status !== 404 && status !== 405) throw error;
  }
}

async function move(
  member: MailchimpMember,
  to: string,
  from: string,
  what: string
) {
  if (!isMemberSyncOn() || !member.email) return false;
  try {
    await upsert(to, member);
    await archive(from, member.email);
    return true;
  } catch (error) {
    const body = (error as { response?: { body?: { detail?: string } } })
      ?.response?.body;
    // eslint-disable-next-line no-console
    console.error(
      `💥 Mailchimp ${what} failed for ${member.email}:`,
      body?.detail || (error as Error).message
    );
    return false;
  }
}

// Membership started (Direct Debit active, first Flexi pack paid, or an
// existing Direct Debit member finished their account): Prospects -> Choir
export const joinChoirAudience = (member: MailchimpMember) =>
  move(member, choirListId(), prospectsListId(), "join Choir");

// Membership ended (14 days after a Direct Debit stopped, or Flexi sessions
// expired): Choir -> Prospects
export const leaveChoirAudience = (member: MailchimpMember) =>
  move(member, prospectsListId(), choirListId(), "leave Choir");

// A member changed their email: change it on their contact in both
// audiences (whichever they're in - not being in one is fine), keeping
// their history and subscription status. Never throws.
export async function changeContactEmail(oldEmail: string, newEmail: string) {
  if (!isMemberSyncOn()) return;
  // eslint-disable-next-line no-restricted-syntax
  for (const listId of [choirListId(), prospectsListId()]) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await mailchimp.lists.updateListMember(listId, contactId(oldEmail), {
        email_address: newEmail,
      });
    } catch (error) {
      if ((error as { status?: number })?.status !== 404) {
        // eslint-disable-next-line no-console
        console.error(
          `💥 Mailchimp email change failed (${oldEmail} -> ${newEmail}):`,
          (error as { response?: { body?: { detail?: string } } })?.response
            ?.body?.detail || (error as Error).message
        );
      }
    }
  }
}

// A member deleted their account: archive them in both audiences (removed,
// and Mailchimp stops billing for them). Not being in one is fine. Never
// throws; returns whether it worked.
export async function archiveContact(email: string) {
  if (!isMemberSyncOn() || !email) return false;
  try {
    await archive(choirListId(), email);
    await archive(prospectsListId(), email);
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      `💥 Mailchimp archive failed for ${email}:`,
      (error as Error).message
    );
    return false;
  }
}
