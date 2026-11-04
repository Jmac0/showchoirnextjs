import mongoose from "mongoose";

// A notice from the admins to active members - the app's Announcements tab
// and the dashboard's Announcements. Written on the admin "Announcements"
// page or in the app (admins only). No replies: a notice board, not a chat.
export type AnnouncementType = {
  title: string;
  message: string;
  // Kept at the top of the list, above newer ones
  pinned: boolean;
  // Who wrote it (shown to admins), kept even if their name changes later
  created_by: { id: mongoose.Types.ObjectId; name: string };
  created_at: Date;
  updated_at?: Date;
};

const AnnouncementSchema = new mongoose.Schema<AnnouncementType>({
  title: { type: String, required: true },
  message: { type: String, required: true },
  pinned: { type: Boolean, default: false },
  created_by: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "Members" },
    name: String,
  },
  created_at: { type: Date, default: Date.now },
  updated_at: Date,
});
// The list: pinned first, then newest
AnnouncementSchema.index({ pinned: -1, created_at: -1 });

export default (mongoose.models
  .Announcements as mongoose.Model<AnnouncementType>) ||
  mongoose.model<AnnouncementType>("Announcements", AnnouncementSchema);
