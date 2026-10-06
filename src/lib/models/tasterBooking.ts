import mongoose from "mongoose";

// Someone who booked a free taster session with the "Book a taster" form
// (api/mailchimp/bookTasterSession.ts). The form only asks which choir, not
// when, so GAs see a choir's recent bookings in the app and check people in
// when they arrive (lib/tasters.ts).
export type TasterBookingType = {
  first_name: string;
  last_name: string;
  email: string;
  // The choir they picked, as the form shows it, e.g. "Dorking"
  choir: string;
  booked_at: Date;
  // Set when a GA checks them in as a taster attendee
  attended_at?: Date | null;
  // UK date ("YYYY-MM-DD") and venue slug of the rehearsal they came to
  attended_date?: string | null;
  attended_venue?: string | null;
  checked_in_by?: mongoose.Types.ObjectId | null;
  // The "great to meet you - here's how to join" email (sent by a GA from
  // the app): when it was last sent, how many times, and by whom
  follow_up_sent_at?: Date | null;
  follow_up_count?: number;
  follow_up_by?: mongoose.Types.ObjectId | null;
};

const TasterBookingSchema = new mongoose.Schema<TasterBookingType>({
  first_name: String,
  last_name: String,
  email: String,
  choir: String,
  booked_at: { type: Date, required: true },
  attended_at: Date,
  attended_date: String,
  attended_venue: String,
  checked_in_by: mongoose.Schema.Types.ObjectId,
  follow_up_sent_at: Date,
  follow_up_count: Number,
  follow_up_by: mongoose.Schema.Types.ObjectId,
});
// A choir's recent bookings, and who came to a rehearsal
TasterBookingSchema.index({ choir: 1, booked_at: -1 });
TasterBookingSchema.index({ attended_venue: 1, attended_date: 1 });

export default (mongoose.models
  .TasterBookings as mongoose.Model<TasterBookingType>) ||
  mongoose.model<TasterBookingType>("TasterBookings", TasterBookingSchema);
