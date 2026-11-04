// Announcement types and helpers that are safe for the browser (no database)
// - the server side is lib/announcements.ts. The app's Announcement type
// mirrors AnnouncementRow (showChoirExpoApp src/app/(app)/announcements.tsx).

export type AnnouncementRow = {
  id: string;
  title: string;
  message: string;
  pinned: boolean;
  // ISO date-times
  created_at: string;
  updated_at: string | null;
  author_name: string;
};

// Longest title and message an admin can save
export const MAX_ANNOUNCEMENT_TITLE = 100;
export const MAX_ANNOUNCEMENT_MESSAGE = 2000;

// "2026-11-04T19:30:00.000Z" -> "Wednesday, 4 November 2026" (UK time)
export const formatAnnouncementDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/London",
  });

// The text that goes into WhatsApp (title, blank line, message)
export const announcementShareText = ({
  title,
  message,
}: Pick<AnnouncementRow, "title" | "message">) => `*${title}*\n\n${message}`;
