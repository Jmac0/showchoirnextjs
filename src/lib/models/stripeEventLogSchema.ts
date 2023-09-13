import mongoose from "mongoose";

// Schema to keep track of stripe webhook events to stop double processing
export type StripeEventLogType = {
  stripeEvent: string;
};

export const StripeEventLogSchema = new mongoose.Schema<StripeEventLogType>({
  stripeEvent: String,
});
export default mongoose.models.StripeEventLog ||
  mongoose.model("StripeEventLog", StripeEventLogSchema);
