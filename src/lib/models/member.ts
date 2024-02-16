// eslint-disable-next-line import/no-import-module-exports
import mongoose from "mongoose";

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
  topUpDate: [];
  go_cardless_id?: string;
  flexi_type?: string;
  direct_debit_started?: string;
  direct_debit_cancelled?: string;
  active_mandate?: boolean;
  // TODO if false && password is set, keep login active but hide songs etc
  active_member: boolean;
  mandate?: string;
  password: string;
  role: string;
};

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
  topUpDate: Array,
  flexi_type: String,
  direct_debit_started: String,
  direct_debit_cancelled: String,
  active_mandate: Boolean,
  active_member: Boolean,
  mandate: String,
  password: String,
  role: String,
});
// string must match collection name
export default mongoose.models.Members ||
  mongoose.model("Members", MemberSchema);
