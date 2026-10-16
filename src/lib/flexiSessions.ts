import Members from "@/src/lib/models/member";

// Entering an imported Flexi member's sessions from the paper records
// (server only; the caller has connected to the database). Members brought
// over from Mailchimp (lib/flexiImport.ts) start with 0 sessions, unconfirmed:
//   - a GA enters the paper record the first time they're scanned at a
//     rehearsal (api/member-resources/confirm-flexi-sessions.ts)
//   - or an admin does, on the "Flexi members" page
//     (api/admin/flexi-members/[id]/sessions.ts), who can also correct the
//     balance later
// The paper sessions are ADDED to their balance, not put in place of it: if
// they bought a pack online before coming, that's already on it.

// True if this member's sessions still need entering from the paper records
export const needsSessionsConfirmed = (member: {
  membership_type?: string;
  flexi_sessions_confirmed?: boolean;
}) =>
  member.membership_type === "flexi" &&
  member.flexi_sessions_confirmed === false;

// Adds the sessions from their paper record, once - only while they're still
// unconfirmed, so two GAs (or a GA and an admin) can't both add them. Returns
// the updated member, or null if they'd already been confirmed.
export async function addPaperSessions(options: {
  memberId: string;
  sessions: number;
  // The GA / admin entering them
  byId: string;
}) {
  const { memberId, sessions, byId } = options;
  return Members.findOneAndUpdate(
    { _id: memberId, flexi_sessions_confirmed: false },
    {
      $inc: { flexi_sessions: sessions },
      flexi_sessions_confirmed: true,
      flexi_sessions_confirmation: { by: byId, at: new Date(), sessions },
    },
    { new: true }
  );
}

// Admin correction for someone already confirmed: their balance becomes this
// (the original confirmation record is kept)
export async function correctFlexiBalance(memberId: string, sessions: number) {
  return Members.findOneAndUpdate(
    { _id: memberId },
    { flexi_sessions: sessions },
    { new: true }
  );
}
