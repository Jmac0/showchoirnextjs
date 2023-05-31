// eslint-disable-next-line import/no-import-module-exports
import mongoose from "mongoose";

// Type for new customer database entry
export type MemberType = {
  direct_debit_started?: string;
  direct_debit_cancelled?: string;
  active_mandate: boolean;
  mandate?: string;
  membership_type?: string | null;
  go_cardless_id: string;
  first_name: string;
  last_name: string;
  phone_number: number;
  post_code: string;
  street_address: string;
  town_city: string;
  county: string;
  email: string;
  age_confirm: boolean;
  home_choir: string;
  consent: boolean;
};

export const memberSchema = new mongoose.Schema<MemberType>({
  first_name: String,
  last_name: String,
  email: String,
  post_code: String,
  phone_number: String,
  street_address: String,
  town_city: String,
  county: String,
  age_confirm: Boolean,
  home_choir: String,
  consent: Boolean,
  active_mandate: Boolean,
  mandate: String,
  membership_type: String,
  go_cardless_id: String,
  direct_debit_started: String,
  direct_debit_cancelled: String,
});
// string must match collection name
module.exports =
  mongoose.models.members || mongoose.model("members", memberSchema);
