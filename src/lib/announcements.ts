import { isValidObjectId } from "mongoose";

import {
  AnnouncementRow,
  MAX_ANNOUNCEMENT_MESSAGE,
  MAX_ANNOUNCEMENT_TITLE,
} from "@/src/lib/announcementsShared";
import dbConnect from "@/src/lib/dbConnect";
import Announcements, { AnnouncementType } from "@/src/lib/models/announcement";

// Announcements - the admins' notice board for active members, shown on the
// dashboard and the app's Announcements tab. Browser-safe bits:
// announcementsShared.ts. The API routes (api/admin/announcements and
// api/member-resources/announcements) just check who's asking and call these.

type Doc = AnnouncementType & { _id: unknown };

const toRow = (a: Doc): AnnouncementRow => ({
  id: String(a._id),
  title: a.title,
  message: a.message,
  pinned: !!a.pinned,
  created_at: new Date(a.created_at).toISOString(),
  updated_at: a.updated_at ? new Date(a.updated_at).toISOString() : null,
  author_name: a.created_by?.name || "",
});

// Every announcement: pinned ones first, then newest first
export async function listAnnouncements(): Promise<AnnouncementRow[]> {
  await dbConnect();
  const announcements = await Announcements.find()
    .sort({ pinned: -1, created_at: -1 })
    .lean();
  return announcements.map((a) => toRow(a as Doc));
}

// A title and message as typed by an admin: trimmed and checked. Returns the
// cleaned-up values, or the message to show if something's wrong.
export function checkAnnouncement(body: {
  title?: unknown;
  message?: unknown;
}): { title: string; message: string } | { error: string } {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!title || !message) {
    return { error: "Please give the announcement a title and a message" };
  }
  if (title.length > MAX_ANNOUNCEMENT_TITLE) {
    return {
      error: `The title can be up to ${MAX_ANNOUNCEMENT_TITLE} characters`,
    };
  }
  if (message.length > MAX_ANNOUNCEMENT_MESSAGE) {
    return {
      error: `The message can be up to ${MAX_ANNOUNCEMENT_MESSAGE} characters`,
    };
  }
  return { title, message };
}

export async function createAnnouncement(
  fields: { title: string; message: string; pinned: boolean },
  author: { _id: unknown; first_name?: string; last_name?: string }
) {
  await dbConnect();
  await Announcements.create({
    ...fields,
    created_by: {
      id: author._id,
      name: `${author.first_name ?? ""} ${author.last_name ?? ""}`.trim(),
    },
  });
}

// Changes an announcement (any of title, message, pinned). False if there's
// no announcement with that id.
export async function updateAnnouncement(
  id: unknown,
  changes: Partial<Pick<AnnouncementType, "title" | "message" | "pinned">>
) {
  if (!isValidObjectId(id)) return false;
  await dbConnect();
  // Only edits to the words count as "edited" - pinning doesn't
  const edited = "title" in changes || "message" in changes;
  const updated = await Announcements.findByIdAndUpdate(id, {
    ...changes,
    ...(edited ? { updated_at: new Date() } : {}),
  });
  return !!updated;
}

// False if there's no announcement with that id
export async function deleteAnnouncement(id: unknown) {
  if (!isValidObjectId(id)) return false;
  await dbConnect();
  return !!(await Announcements.findByIdAndDelete(id));
}
