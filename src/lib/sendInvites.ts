import { InviteKind, MAX_INVITES_PER_REQUEST } from "@/src/lib/ddMembersShared";
import { sendInviteEmail } from "@/src/lib/email/sendInviteEmail";
import Members from "@/src/lib/models/member";

// Sends "create your account" invites to existing members brought over from
// GoCardless (DD members page) or Mailchimp (Flexi members page). Server
// only; the caller has checked they're an admin and connected to the
// database.

// Resend allows about 2 emails a second
const GAP_BETWEEN_EMAILS_MS = 600;

const wait = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export type InviteResult = {
  sent: string[];
  failed: { id: string; name: string; message: string }[];
};

// Reads the ids from the request body: a list of 1 to
// MAX_INVITES_PER_REQUEST, or null if it isn't one
export function inviteIds(body: unknown): string[] | null {
  const raw = (body as { ids?: unknown })?.ids;
  const ids = Array.isArray(raw) ? raw.map(String) : [];
  return ids.length > 0 && ids.length <= MAX_INVITES_PER_REQUEST ? ids : null;
}

// Emails each of these members (not ones who've already created their
// account). `whyNot` says why someone can't be invited, or null if they can.
export async function sendInvites(
  ids: string[],
  kind: InviteKind,
  whyNot: (member: never) => string | null
): Promise<InviteResult> {
  const members = await Members.find({
    _id: { $in: ids },
    "invite.status": { $ne: "accepted" },
  }).select("+password");

  const result: InviteResult = { sent: [], failed: [] };
  // eslint-disable-next-line no-restricted-syntax
  for (const [index, member] of members.entries()) {
    const name = `${member.first_name} ${member.last_name}`;
    const reason = member.password
      ? "Already has an account"
      : whyNot(member as never);
    if (reason) {
      result.failed.push({ id: member.id, name, message: reason });
      // eslint-disable-next-line no-continue
      continue;
    }
    // eslint-disable-next-line no-await-in-loop
    if (index > 0) await wait(GAP_BETWEEN_EMAILS_MS);
    try {
      // eslint-disable-next-line no-await-in-loop
      await sendInviteEmail(member, kind);
      result.sent.push(member.id);
    } catch (error) {
      result.failed.push({
        id: member.id,
        name,
        message: (error as Error).message,
      });
    }
  }
  return result;
}
