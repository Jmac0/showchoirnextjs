import { goCardlessClient } from "@/src/lib/gocardless";
import { changeContactEmail } from "@/src/lib/mailchimp";
import Members, { MemberType } from "@/src/lib/models/member";

// What happened in GoCardless when an email was changed
export type GoCardlessEmailResult =
  // GoCardless had their old email - now has the new one
  | { status: "updated" }
  // They don't pay by Direct Debit themselves (Flexi, or an extra singer on
  // someone else's Direct Debit - that customer is the payer)
  | { status: "not_direct_debit" }
  // GoCardless has a different email (e.g. a parent who pays) - left alone
  | { status: "different_email"; email: string };

/* Changes a member's email everywhere we keep it, in this order:

  1. GoCardless - only if they pay by Direct Debit and the GoCardless
     customer has their old email. First, so if GoCardless fails nothing
     changes and the two never disagree.
  2. Our database - their login email from now on. Clears any half-finished
     self-service change, and an invite that's been sent but not used goes
     back to "Not sent" (its link carries the old email, so it won't work).
  3. Mailchimp - both audiences, if they're in them (never blocks the change)

Used by the member's own "Change email" (api/members/confirm-email.ts) and
by admins (api/admin/change-email.ts, the DD members page). The caller has
connected to the database and checked the new email is valid and not taken.
Throws if GoCardless or the database fails. */
export async function changeMemberEmail(
  member: Pick<
    MemberType,
    "email" | "go_cardless_id" | "paid_by_member" | "invite"
  > & { id: string },
  newEmail: string
): Promise<GoCardlessEmailResult> {
  const oldEmail = member.email;

  // --- 1. GoCardless (only if it has their old email) ---

  let goCardless: GoCardlessEmailResult = { status: "not_direct_debit" };
  if (member.go_cardless_id && !member.paid_by_member) {
    const client = goCardlessClient();
    const customer = await client.customers.find(member.go_cardless_id);
    const theirs = String(customer.email || "")
      .toLowerCase()
      .trim();
    if (theirs === oldEmail) {
      await client.customers.update(member.go_cardless_id, {
        email: newEmail,
      });
      goCardless = { status: "updated" };
    } else {
      goCardless = { status: "different_email", email: theirs };
    }
  }

  // --- 2. Our database ---

  await Members.updateOne(
    { _id: member.id },
    {
      email: newEmail,
      $unset: { pending_email: 1 },
      ...(member.invite?.status === "sent"
        ? { "invite.status": "not_sent" }
        : {}),
    }
  );

  // --- 3. Mailchimp (logs, never throws) ---

  await changeContactEmail(oldEmail, newEmail);

  return goCardless;
}
