import mongoose from "mongoose";

// A song in the members' Music & Lyrics, with its files. The files themselves
// are in Cloudflare R2 (see lib/music.ts); this holds everything about them,
// so the song list never has to be read from R2 (listing R2 costs money).

export type TrackKind = "audio" | "lyrics" | "sheet_music";

// Voice parts for audio tracks - the list members can filter by.
// Keep in step with VOICE_PARTS in lib/music.ts.
export type VoicePart =
  | "all"
  | "soprano"
  | "alto"
  | "tenor"
  | "bass"
  | "solo"
  | "other";

export type TrackType = {
  _id: mongoose.Types.ObjectId;
  kind: TrackKind;
  // Audio only - which voice part it's for
  part?: VoicePart;
  // Shown to members, e.g. "Sops & Sop1 Solo Group" or "Lyrics"
  label: string;
  // Where the file is in R2: songs/<songId>/<trackId>-<file-name>
  key: string;
  file_name: string;
  content_type: string;
  size: number;
  uploaded_at: Date;
  uploaded_by: mongoose.Types.ObjectId;
};

export type SongType = {
  title: string;
  // "current" = being learnt now; "archived" = kept but tucked away
  status: "current" | "archived";
  tracks: TrackType[];
  created_by: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
};

const TrackSchema = new mongoose.Schema<TrackType>({
  kind: {
    type: String,
    enum: ["audio", "lyrics", "sheet_music"],
    required: true,
  },
  part: {
    type: String,
    enum: ["all", "soprano", "alto", "tenor", "bass", "solo", "other"],
  },
  label: { type: String, required: true },
  key: { type: String, required: true },
  file_name: String,
  content_type: String,
  size: Number,
  uploaded_at: Date,
  uploaded_by: mongoose.Schema.Types.ObjectId,
});

export const SongSchema = new mongoose.Schema<SongType>(
  {
    title: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["current", "archived"],
      default: "current",
    },
    tracks: { type: [TrackSchema], default: [] },
    created_by: mongoose.Schema.Types.ObjectId,
  },
  // Keeps created_at / updated_at up to date automatically
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// (Typed, so reads from it - e.g. .lean() - know they're songs)
export default (mongoose.models.Song as mongoose.Model<SongType>) ||
  mongoose.model<SongType>("Song", SongSchema);
