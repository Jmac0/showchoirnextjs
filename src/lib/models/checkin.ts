import mongoose from "mongoose";

// One document per member successfully scanned in by a GA at a rehearsal.
// Used for the app's "Who's here" list and attendance history.
export type CheckinType = {
  member_id: mongoose.Types.ObjectId;
  // Copied from the member so the attendance list needs no extra lookups
  first_name: string;
  last_name: string;
  membership_type?: string;
  // Venue slug from Contentful, e.g. "banstead"
  venue: string;
  // UK calendar date of the rehearsal, "YYYY-MM-DD"
  session_date: string;
  scanned_at: Date;
  // The GA who scanned them
  scanned_by: mongoose.Types.ObjectId;
  // True if a flexi session was deducted (so undo knows to give it back)
  flexi_deducted: boolean;
  // Set when the member wasn't paid up and the GA took payment at the desk
  // (cash, or card on iZettle) or let them in to pay later.
  payment?: CheckinPayment;
  // Sessions bought at the desk with this check-in (10 for cash/card), so
  // undo can take them back off
  sessions_added: number;
};

export type CheckinPayment = "cash" | "card" | "pay_later";

export const CheckinSchema = new mongoose.Schema<CheckinType>({
  member_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  first_name: String,
  last_name: String,
  membership_type: String,
  venue: { type: String, required: true },
  session_date: { type: String, required: true },
  scanned_at: { type: Date, required: true },
  scanned_by: { type: mongoose.Schema.Types.ObjectId, required: true },
  flexi_deducted: { type: Boolean, default: false },
  payment: { type: String, enum: ["cash", "card", "pay_later"] },
  sessions_added: { type: Number, default: 0 },
});

// A member can only be checked in once per rehearsal - a second insert
// fails with a duplicate key error, which makes double scans harmless.
CheckinSchema.index(
  { member_id: 1, venue: 1, session_date: 1 },
  { unique: true }
);
// For listing everyone at a rehearsal
CheckinSchema.index({ venue: 1, session_date: 1 });

export default mongoose.models.Checkin ||
  mongoose.model("Checkin", CheckinSchema);
