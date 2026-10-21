import Checkins from "@/src/lib/models/checkin";
import Members from "@/src/lib/models/member";
import TasterBookings from "@/src/lib/models/tasterBooking";

// Everyone at one rehearsal - members scanned in by a GA and tasters checked
// in from "Taster bookings". Shared by the app's GA "Who's here" list
// (api/member-resources/attendance.ts) and the admin Attendance report.
// Server only; the caller must have connected to the database.

export type AttendanceEntry = {
  id: string;
  first_name: string;
  last_name: string;
  membership_type?: string;
  scanned_at: string;
  // "cash" / "card" / "pay_later" if they weren't paid up when scanned
  payment?: string;
  // Pounds taken at the desk with a cash/card payment
  amount?: number;
  // A GA (they come free) - the app shows a gold star instead of their
  // membership type
  is_ga: boolean;
  // Someone on a free taster (checked in from "Taster bookings"), not a
  // member - id is their booking's, and undo goes to taster-check-in
  is_taster?: boolean;
};

// The list A-Z by name, and the member ids checked in (members and GAs,
// not tasters)
export async function listAttendance(venue: string, sessionDate: string) {
  const checkins = await Checkins.find({ venue, session_date: sessionDate })
    // case-insensitive A-Z by name, for roll call
    .collation({ locale: "en", strength: 2 })
    .sort({ first_name: 1, last_name: 1 })
    .lean();

  // Which of them are GAs (shown with a gold star in the app). Looked up from
  // the members, so it's right even for check-ins made before they became a GA.
  const gaIds = new Set(
    (
      await Members.find({
        _id: { $in: checkins.map((checkin) => checkin.member_id) },
        role: "ga",
      }).distinct("_id")
    ).map(String)
  );

  // Tasters checked in at this rehearsal (from "Taster bookings")
  const tasters = await TasterBookings.find({
    attended_venue: venue,
    attended_date: sessionDate,
  }).lean();

  const memberEntries: AttendanceEntry[] = checkins.map((checkin) => ({
    id: String(checkin._id),
    first_name: checkin.first_name,
    last_name: checkin.last_name,
    membership_type: checkin.membership_type,
    scanned_at: checkin.scanned_at.toISOString(),
    payment: checkin.payment,
    amount: checkin.amount,
    is_ga: gaIds.has(String(checkin.member_id)),
  }));
  const tasterEntries: AttendanceEntry[] = tasters.map((taster) => ({
    id: String(taster._id),
    first_name: taster.first_name,
    last_name: taster.last_name,
    scanned_at: (taster.attended_at as Date).toISOString(),
    is_ga: false,
    is_taster: true,
  }));
  // Everyone, A-Z by name, for roll call
  const everyone = [...memberEntries, ...tasterEntries].sort((a, b) =>
    `${a.first_name} ${a.last_name}`.localeCompare(
      `${b.first_name} ${b.last_name}`,
      "en",
      { sensitivity: "base" }
    )
  );

  return {
    entries: everyone,
    memberIds: checkins.map((checkin) => String(checkin.member_id)),
  };
}
