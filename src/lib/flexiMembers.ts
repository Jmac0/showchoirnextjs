import { format } from "date-fns";

import { InviteStatus } from "@/src/lib/ddMembersShared";
import { FlexiMemberRow } from "@/src/lib/flexiMembersShared";
import Members, { MemberType } from "@/src/lib/models/member";

// Server side of the "Flexi members" admin page (existing Flexi members
// brought over from Mailchimp - lib/flexiImport.ts). The caller must have
// connected to the database.

// Members the page lists
export const FLEXI_MEMBERS_FILTER = { imported_from_mailchimp: true };

// Who can be sent an invite: they haven't set up their account yet (their
// sessions don't need confirming first - the desk does that when they come)
export const canInviteFlexi = (
  member: Partial<Pick<MemberType, "password" | "invite">>
) => !member.password && member.invite?.status !== "accepted";

type MemberDoc = MemberType & { _id: { toString(): string } };

export function toFlexiRow(
  member: MemberDoc,
  // member id -> name, for who confirmed their sessions
  names: Map<string, string> = new Map()
): FlexiMemberRow {
  const confirmation = member.flexi_sessions_confirmation;
  return {
    id: member._id.toString(),
    first_name: member.first_name || "",
    last_name: member.last_name || "",
    email: member.email || "",
    home_choir: member.home_choir || "",
    sessions_confirmed: member.flexi_sessions_confirmed !== false,
    flexi_sessions: member.flexi_sessions || 0,
    confirmed_note: confirmation?.at
      ? `${names.get(confirmation.by) || "an admin"}, ${format(
          new Date(confirmation.at),
          "d MMM yyyy"
        )}`
      : null,
    can_invite: canInviteFlexi(member),
    invite_status: (member.invite?.status as InviteStatus) || "not_sent",
    invite_sent_at: member.invite?.sent_at
      ? new Date(member.invite.sent_at).toISOString()
      : null,
    invite_send_count: member.invite?.send_count || 0,
  };
}

// Everyone on the page, A-Z by surname
export async function listFlexiMembers(): Promise<FlexiMemberRow[]> {
  // (password only to work out who can be invited - never sent to the page)
  const members = (await Members.find(FLEXI_MEMBERS_FILTER)
    .select("+password")
    .collation({ locale: "en", strength: 2 })
    .sort({ last_name: 1, first_name: 1 })
    .lean()) as unknown as MemberDoc[];

  // Names of the GAs / admins who confirmed sessions
  const confirmers = Array.from(
    new Set(
      members
        .map((m) => m.flexi_sessions_confirmation?.by)
        .filter((id): id is string => !!id)
    )
  );
  const people = (await Members.find({ _id: { $in: confirmers } })
    .select("first_name last_name")
    .lean()) as unknown as MemberDoc[];
  const names = new Map(
    people.map((p) => [p._id.toString(), `${p.first_name} ${p.last_name}`])
  );

  return members.map((m) => toFlexiRow(m, names));
}
