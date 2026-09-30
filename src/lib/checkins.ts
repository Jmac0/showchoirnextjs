import Checkins, { CheckinType } from "@/src/lib/models/checkin";
import { ukDate } from "@/src/lib/ukDate";

// Helpers for recording rehearsal check-ins (see models/checkin.ts).
// Shared by the app's check-in-member and record-payment routes.

// A valid Contentful venue slug, e.g. "choir-dorking-surrey"
export const VENUE_SLUG = /^[a-z0-9-]+$/;

// MongoDB's error code for breaking a unique index
const DUPLICATE_KEY = 11000;

// The member fields a check-in copies (so Who's here needs no extra lookups)
type MemberForCheckin = {
  id: string;
  first_name: string;
  last_name: string;
  membership_type?: string;
};

// Records a member as here at today's rehearsal at this venue. Returns null
// if they're already checked in - the unique index on member + venue + date
// rejects a second check-in, so double scans are never charged twice.
//   member     - who was scanned
//   venue      - the venue slug the GA picked
//   scannedBy  - the GA's member id
//   extra      - payment details when paid at the desk (see record-payment)
export async function createCheckin(
  member: MemberForCheckin,
  venue: string,
  scannedBy: string,
  extra: Partial<
    Pick<CheckinType, "payment" | "sessions_added" | "flexi_deducted">
  > = {}
) {
  try {
    return await Checkins.create({
      member_id: member.id,
      venue,
      session_date: ukDate(),
      first_name: member.first_name,
      last_name: member.last_name,
      membership_type: member.membership_type,
      scanned_at: new Date(),
      scanned_by: scannedBy,
      // check-in-member sets this to true once the session is deducted
      flexi_deducted: false,
      ...extra,
    });
  } catch (error) {
    // Already checked in at this rehearsal
    if ((error as { code?: number }).code === DUPLICATE_KEY) return null;
    throw error;
  }
}

// Whether the member already has a check-in at today's rehearsal here
export const isCheckedIn = (memberId: string, venue: string) =>
  Checkins.exists({ member_id: memberId, venue, session_date: ukDate() });
