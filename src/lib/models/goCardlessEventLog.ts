import mongoose from "mongoose";

// GoCardless webhook events we've already dealt with. GoCardless can send the
// same event more than once (e.g. retrying after a timeout), so
// api/gocardless/webhooks.ts skips any event id already in here.
export type GoCardlessEventLogType = {
  event_id: string;
};

export const GoCardlessEventLogSchema =
  new mongoose.Schema<GoCardlessEventLogType>({
    event_id: { type: String, required: true, unique: true },
  });

export default mongoose.models.GoCardlessEventLog ||
  mongoose.model("GoCardlessEventLog", GoCardlessEventLogSchema);
