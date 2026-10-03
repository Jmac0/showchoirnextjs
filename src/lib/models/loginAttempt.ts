import mongoose from "mongoose";

// Failed logins, counted per email and per IP address, so passwords can't be
// guessed by trying again and again (lib/loginLimiter.ts). Each record
// deletes itself when its window ends (MongoDB's TTL index on expires_at),
// so the collection stays tiny.
export type LoginAttemptType = {
  // "email:ann@example.com" or "ip:203.0.113.5"
  key: string;
  failures: number;
  // When this window ends - MongoDB deletes the record then
  expires_at: Date;
};

const LoginAttemptSchema = new mongoose.Schema<LoginAttemptType>({
  key: { type: String, required: true, unique: true },
  failures: { type: Number, default: 0 },
  expires_at: { type: Date, required: true },
});
LoginAttemptSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export default (mongoose.models
  .LoginAttempts as mongoose.Model<LoginAttemptType>) ||
  mongoose.model<LoginAttemptType>("LoginAttempts", LoginAttemptSchema);
