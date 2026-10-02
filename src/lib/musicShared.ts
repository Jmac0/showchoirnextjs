// Music & Lyrics - the parts that are safe to use in the browser as well as
// on the server (no storage keys or R2 code here - that's lib/music.ts).
// Used by the admin page, the members' Music & Lyrics page and the API routes.

import type { TrackKind, VoicePart } from "@/src/lib/models/song";

export type { TrackKind, VoicePart };

// Voice parts for audio tracks, in the order shown to members.
// Change the labels here; add a part here AND in models/song.ts.
export const VOICE_PARTS: { value: VoicePart; label: string }[] = [
  { value: "all", label: "All voices" },
  { value: "soprano", label: "Sopranos" },
  { value: "alto", label: "Altos / Mezzos" },
  { value: "tenor", label: "Tenors" },
  { value: "bass", label: "Basses" },
  { value: "solo", label: "Solo" },
  { value: "other", label: "Other" },
];

export const partLabel = (part?: VoicePart) =>
  VOICE_PARTS.find((voicePart) => voicePart.value === part)?.label || "";

export const KIND_LABELS: Record<TrackKind, string> = {
  audio: "Audio",
  lyrics: "Lyrics",
  sheet_music: "Sheet music",
};

// What can be uploaded for each kind of file
const MB = 1024 * 1024;
export const UPLOAD_RULES: Record<
  TrackKind,
  { types: string[]; extensions: string; maxBytes: number }
> = {
  audio: {
    types: [
      "audio/mpeg",
      "audio/mp4",
      "audio/x-m4a",
      "audio/wav",
      "audio/x-wav",
    ],
    extensions: ".mp3,.m4a,.wav",
    maxBytes: 50 * MB,
  },
  lyrics: {
    types: ["application/pdf"],
    extensions: ".pdf",
    maxBytes: 20 * MB,
  },
  sheet_music: {
    types: ["application/pdf"],
    extensions: ".pdf",
    maxBytes: 20 * MB,
  },
};

// Why a file can't be uploaded as this kind, or null if it's fine
export function uploadProblem(
  kind: TrackKind,
  contentType: string,
  size: number
): string | null {
  const rules = UPLOAD_RULES[kind];
  if (!rules) return "Please choose audio, lyrics or sheet music";
  if (!rules.types.includes(contentType)) {
    return kind === "audio"
      ? "Audio must be an MP3, M4A or WAV file"
      : "Lyrics and sheet music must be a PDF";
  }
  if (!(size > 0)) return "That file is empty";
  if (size > rules.maxBytes) {
    return `That file is too big (max ${rules.maxBytes / MB} MB)`;
  }
  return null;
}

// What members get for each song (website page and app) - with signed links
// that work for an hour (see songsForMembers in lib/music.ts)
export type MemberTrack = {
  id: string;
  kind: TrackKind;
  part?: VoicePart;
  label: string;
  // Play / view in the browser or app
  url: string;
  // Same file, but tells the browser to download it
  download_url: string;
};

// What the admin page gets for each song (no links - just the details)
export type AdminTrack = {
  id: string;
  kind: TrackKind;
  part?: VoicePart;
  label: string;
  file_name: string;
  size: number;
  uploaded_at: string;
};

export type AdminSong = {
  id: string;
  title: string;
  status: "current" | "archived";
  tracks: AdminTrack[];
};

export type MemberSong = {
  id: string;
  title: string;
  status: "current" | "archived";
  tracks: MemberTrack[];
};
