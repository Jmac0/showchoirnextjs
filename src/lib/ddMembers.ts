import { DDMemberRow, InviteStatus, planFor } from "@/src/lib/ddMembersShared";
import { directDebitNotice } from "@/src/lib/directDebit";
import { jointAmountPence, monthlyAmountPence } from "@/src/lib/gocardless";
import Members, { MemberType } from "@/src/lib/models/member";

// Server side of the "DD members" admin page (existing Direct Debit members
// brought over from GoCardless). The caller must have connected to the
// database.

// Members the page lists: everyone imported from GoCardless, plus extra
// singers added to someone's Direct Debit
export const DD_MEMBERS_FILTER = {
  $or: [
    { imported_from_gocardless: true },
    { paid_by_member: { $exists: true, $ne: "" } },
  ],
};

// Who can be sent an invite: their Direct Debit mandate is active in
// GoCardless (not still being set up, or cancelled since), and they haven't
// set up their account yet
export const canInvite = (
  member: Partial<
    Pick<
      MemberType,
      "active_mandate" | "gc_mandate_status" | "password" | "invite"
    >
  >
) =>
  !!member.active_mandate &&
  member.gc_mandate_status === "active" &&
  !member.password &&
  member.invite?.status !== "accepted";

type MemberDoc = MemberType & { _id: { toString(): string } };

export function toRow(
  member: MemberDoc,
  payerNames: Map<string, string> = new Map(),
  // payer id -> names of the extra singers on their Direct Debit
  extraSingers: Map<string, string[]> = new Map()
): DDMemberRow {
  const id = member._id.toString();
  const amount = member.gc_subscription_amount || 0;
  return {
    id,
    first_name: member.first_name || "",
    last_name: member.last_name || "",
    email: member.email || "",
    home_choir: member.home_choir || "",
    can_invite: canInvite(member),
    // Kept up to date by the import and the GoCardless webhook
    mandate_status: member.active_mandate
      ? member.gc_mandate_status || ""
      : member.gc_mandate_status || "cancelled",
    direct_debit_ended: directDebitNotice(member),
    invite_status: (member.invite?.status as InviteStatus) || "not_sent",
    invite_sent_at: member.invite?.sent_at
      ? new Date(member.invite.sent_at).toISOString()
      : null,
    invite_send_count: member.invite?.send_count || 0,
    plan: planFor(amount, Number(monthlyAmountPence()), jointAmountPence()),
    amount,
    other_singers: extraSingers.get(id) || [],
    paid_by_name: member.paid_by_member
      ? payerNames.get(member.paid_by_member) || "another member"
      : null,
  };
}

// Everyone on the page, A-Z by surname
export async function listDDMembers(): Promise<DDMemberRow[]> {
  // (password only to work out who can be invited - never sent to the page)
  const members = (await Members.find(DD_MEMBERS_FILTER)
    .select("+password")
    .collation({ locale: "en", strength: 2 })
    .sort({ last_name: 1, first_name: 1 })
    .lean()) as unknown as MemberDoc[];

  const fullName = (m: MemberDoc) => `${m.first_name} ${m.last_name}`;
  const names = new Map(members.map((m) => [m._id.toString(), fullName(m)]));
  const extraSingers = new Map<string, string[]>();
  members.forEach((m) => {
    if (!m.paid_by_member) return;
    extraSingers.set(m.paid_by_member, [
      ...(extraSingers.get(m.paid_by_member) || []),
      fullName(m),
    ]);
  });
  return members.map((m) => toRow(m, names, extraSingers));
}

// Stored like every login looks it up
export const cleanEmail = (email: unknown) =>
  String(email || "")
    .toLowerCase()
    .trim();

export const isEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
