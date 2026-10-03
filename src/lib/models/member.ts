// eslint-disable-next-line import/no-import-module-exports
import mongoose from "mongoose";

import type { DirectDebitEnded } from "../directDebit";
import type { FlexiExpired } from "../flexiExpiry";

// One flexi pack bought - an entry in a member's top-up history
// (MemberType.topUpDate)
export type TopUp = {
  // What they bought, e.g. "Flexi Non Concession"
  type: string;
  // When it was paid
  date: Date;
  // How: online (Stripe), or cash / card at the choir desk
  method: "online" | "cash" | "card";
  // What they paid, in pence (e.g. 9000 = £90)
  amount_pence?: number;
  // Online: the Stripe payment, to find it in the Stripe dashboard
  stripe_payment_intent?: string;
  // Desk: the check-in it was paid at (so undoing it removes this too)
  checkin_id?: string;
};

// Type for new customer database entry
export type MemberType = {
  first_name: string;
  last_name: string;
  street_address: string;
  county: string;
  town_city: string;
  post_code: string;
  phone_number: number;
  email: string;
  home_choir: string;
  age_confirm: boolean;
  consent: boolean;
  date_joined: string;
  membership_type?: string;
  flexi_sessions?: number;
  // Every flexi pack they've bought, oldest first (the name is historical -
  // it's the whole top-up history)
  topUpDate: TopUp[];
  go_cardless_id?: string;
  flexi_type?: string;
  direct_debit_started?: string;
  direct_debit_cancelled?: string;
  // When and why their Direct Debit stopped (set by the GoCardless webhook,
  // cleared if they set up a new one). Their membership stays active for a
  // grace period after this - see lib/directDebit.ts
  direct_debit_ended?: DirectDebitEnded | null;
  // Set when their Flexi sessions expired (no check-in for 6 months - see
  // lib/flexiExpiry.ts); membership_type is "flexi_expired" then
  flexi_expired?: FlexiExpired | null;
  // Which Mailchimp audience they're in: "choir" while a member, "prospects"
  // after it ends (lib/memberAudience.ts)
  mailchimp_audience?: "choir" | "prospects";
  // A change of email waiting for them to click the link sent to the new
  // address (api/members/change-email.ts). Only a hash of the link's token
  // is kept, so the database alone can't be used to confirm it.
  pending_email?: { email: string; token_hash: string; expires_at: Date };
  active_mandate?: boolean;
  // TODO if false && password is set, keep login active but hide songs etc
  active_member: boolean;
  // One refresh token per logged-in device/session, so logging in on a new
  // device doesn't invalidate another device's session.
  refresh_tokens?: string[];
  mandate?: string;
  password: string;
  role: string;
  // --- Existing Direct Debit members brought over from GoCardless ---
  // (see lib/gocardlessImport.ts and the "DD members" admin page)
  imported_from_gocardless?: boolean;
  // Their monthly subscription in pence - more than the usual amount usually
  // means one Direct Debit pays for more than one singer
  gc_subscription_amount?: number;
  // An extra singer on someone else's Direct Debit: the payer's member id
  paid_by_member?: string;
  // Their mandate's status in GoCardless when last imported - only "active"
  // ones are invited
  gc_mandate_status?: string;
  // The "create your account" email: not sent yet -> sent -> account made
  invite?: {
    status: "not_sent" | "sent" | "accepted";
    sent_at?: Date;
    send_count?: number;
    accepted_at?: Date;
  };
};

const TopUpSchema = new mongoose.Schema<TopUp>(
  {
    // (spelt out, because Mongoose reads a bare `type: String` as "this
    // whole object is a string")
    type: { type: String },
    date: Date,
    method: String,
    amount_pence: Number,
    stripe_payment_intent: String,
    checkin_id: String,
  },
  { _id: false }
);

export const MemberSchema = new mongoose.Schema<MemberType>({
  first_name: String,
  last_name: String,
  street_address: String,
  county: String,
  town_city: String,
  post_code: String,
  phone_number: String,
  email: String,
  home_choir: String,
  age_confirm: Boolean,
  consent: Boolean,
  date_joined: String,
  membership_type: String,
  flexi_sessions: Number,
  go_cardless_id: String,
  topUpDate: [TopUpSchema],
  flexi_type: String,
  direct_debit_started: String,
  direct_debit_cancelled: String,
  mailchimp_audience: String,
  pending_email: { email: String, token_hash: String, expires_at: Date },
  flexi_expired: {
    at: Date,
    sessions_removed: Number,
    last_check_in: String,
  },
  direct_debit_ended: {
    // (spelt out - see TopUpSchema)
    at: Date,
    event: { type: String },
    cause: String,
    description: String,
  },
  active_mandate: Boolean,
  active_member: Boolean,
  refresh_tokens: [String],
  mandate: String,
  password: { type: String, select: false },
  role: String,
  imported_from_gocardless: Boolean,
  gc_subscription_amount: Number,
  paid_by_member: String,
  gc_mandate_status: String,
  invite: {
    status: String,
    sent_at: Date,
    send_count: Number,
    accepted_at: Date,
  },
});

// --- Indexes (Mongoose creates them when the site starts) ---

// One account per email: the database itself refuses a second one, even if
// two sign-ups for the same email arrive at the same moment (double-click,
// two tabs). Emails are stored lower case, so this is case-insensitive in
// practice. A refused duplicate throws a "duplicate key" error (code 11000) -
// see isDuplicateEmailError.
MemberSchema.index({ email: 1 }, { unique: true });
// GoCardless webhooks and the import look members up by these
MemberSchema.index({ go_cardless_id: 1 });
MemberSchema.index({ mandate: 1 });

// True if saving failed because another member already has this email
export const isDuplicateEmailError = (error: unknown) =>
  (error as { code?: number })?.code === 11000 &&
  /email/.test(String((error as { message?: string })?.message));

// string must match collection name
export default mongoose.models.Members ||
  mongoose.model("Members", MemberSchema);
