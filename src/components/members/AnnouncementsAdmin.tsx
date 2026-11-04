import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import {
  faMapPin,
  faPen,
  faPlus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import React, { useState } from "react";

import {
  AnnouncementRow,
  announcementShareText,
  formatAnnouncementDate,
  MAX_ANNOUNCEMENT_MESSAGE,
  MAX_ANNOUNCEMENT_TITLE,
} from "@/src/lib/announcementsShared";

const BIG_BUTTON =
  "flex items-center gap-2 rounded-md bg-lightGold px-4 py-2 font-bold text-black disabled:opacity-50";
const SMALL_BUTTON =
  "rounded-md p-2 text-lightGold hover:bg-lightGold/20 disabled:opacity-50";
const INPUT = "w-full rounded py-2 pl-2 text-base text-black";

// The message from a failed request to our API
const errorMessage = (error: unknown, fallback: string) =>
  (axios.isAxiosError(error) && error.response?.data?.message) || fallback;

// WhatsApp's "send a message" link: opens WhatsApp (or WhatsApp Web) with
// the text filled in, to pick the group and press send. WhatsApp doesn't
// let other sites post into a group by themselves.
const whatsAppLink = (announcement: AnnouncementRow) =>
  `https://wa.me/?text=${encodeURIComponent(
    announcementShareText(announcement)
  )}`;

// The "Announcements" admin page's contents - the notice board members see
// on the dashboard and the app's Announcements tab. No replies: a notice
// board, not a chat. Pinned ones stay at the top.
export function AnnouncementsAdmin({
  initialAnnouncements,
}: {
  initialAnnouncements: AnnouncementRow[];
}) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [pinned, setPinned] = useState(false);
  // The announcement being edited in the form, if any
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const clearForm = () => {
    setTitle("");
    setMessage("");
    setPinned(false);
    setEditingId(null);
  };

  // Every request replies with the whole list
  const send = async (request: () => Promise<{ data: unknown }>) => {
    setBusy(true);
    setError("");
    try {
      const { data } = await request();
      setAnnouncements(
        (data as { announcements: AnnouncementRow[] }).announcements
      );
      return true;
    } catch (err) {
      setError(errorMessage(err, "Couldn't save - please try again"));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const saved = await send(() =>
      editingId
        ? axios.patch(`/api/admin/announcements/${editingId}`, {
            title,
            message,
            pinned,
          })
        : axios.post("/api/admin/announcements", { title, message, pinned })
    );
    if (saved) clearForm();
  };

  const startEditing = (announcement: AnnouncementRow) => {
    setEditingId(announcement.id);
    setTitle(announcement.title);
    setMessage(announcement.message);
    setPinned(announcement.pinned);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const togglePin = (announcement: AnnouncementRow) =>
    send(() =>
      axios.patch(`/api/admin/announcements/${announcement.id}`, {
        pinned: !announcement.pinned,
      })
    );

  const remove = async (announcement: AnnouncementRow) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Delete "${announcement.title}"?`)) return;
    const deleted = await send(() =>
      axios.delete(`/api/admin/announcements/${announcement.id}`)
    );
    if (deleted && editingId === announcement.id) clearForm();
  };

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <form
        onSubmit={save}
        className="flex flex-col gap-3 rounded-md border-2 border-lightGold bg-lightBlack/90 p-5"
      >
        <h2 className="m-0 bg-gradient-to-r from-yellow-200 to-yellow-500 bg-clip-text p-0 text-transparent">
          {editingId ? "Edit announcement" : "New announcement"}
        </h2>
        <p className="m-0 text-sm">
          Active members see it on their dashboard and in the app. After
          posting, use the WhatsApp button to send it to the choir&apos;s group
          too.
        </p>
        <label className="flex flex-col gap-1" htmlFor="announcementTitle">
          Title
          <input
            id="announcementTitle"
            type="text"
            required
            maxLength={MAX_ANNOUNCEMENT_TITLE}
            className={INPUT}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1" htmlFor="announcementMessage">
          Message
          <textarea
            id="announcementMessage"
            required
            rows={6}
            maxLength={MAX_ANNOUNCEMENT_MESSAGE}
            className={INPUT}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-2" htmlFor="announcementPinned">
          <input
            id="announcementPinned"
            type="checkbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
          />
          Pin to the top
        </label>
        <div className="flex justify-center gap-3">
          <button
            type="submit"
            disabled={busy || !title.trim() || !message.trim()}
            className={BIG_BUTTON}
          >
            <FontAwesomeIcon icon={editingId ? faPen : faPlus} />{" "}
            {editingId ? "Save changes" : "Post announcement"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={clearForm}
              className="rounded-md px-4 py-2 text-lightGold hover:bg-lightGold/20"
            >
              Cancel
            </button>
          )}
        </div>
        {error && (
          <p role="alert" className="m-0 text-center text-sm text-red-400">
            {error}
          </p>
        )}
      </form>

      <div className="flex flex-col gap-3">
        {announcements.length === 0 && (
          <p className="text-center text-sm italic">No announcements yet</p>
        )}
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className="flex gap-3 rounded-md border-2 border-lightGold bg-lightBlack/90 p-4"
          >
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="font-bold">
                {announcement.pinned && (
                  <FontAwesomeIcon
                    icon={faMapPin}
                    className="mr-2 text-lightGold"
                    aria-label="Pinned"
                  />
                )}
                {announcement.title}
              </span>
              <span className="text-sm text-gray-300">
                {formatAnnouncementDate(announcement.created_at)}
                {announcement.author_name && ` · ${announcement.author_name}`}
                {announcement.updated_at && " · edited"}
              </span>
              <p className="m-0 mt-2 whitespace-pre-line text-sm">
                {announcement.message}
              </p>
            </div>
            <div className="flex flex-col items-center">
              <a
                href={whatsAppLink(announcement)}
                target="_blank"
                rel="noreferrer"
                className={SMALL_BUTTON}
                aria-label={`Send "${announcement.title}" to WhatsApp`}
              >
                {/* (brand icons need the cast - same as the Footer) */}
                <FontAwesomeIcon icon={faWhatsapp as IconProp} />
              </a>
              <button
                type="button"
                disabled={busy}
                onClick={() => togglePin(announcement)}
                className={`${SMALL_BUTTON} ${
                  announcement.pinned ? "" : "opacity-50"
                }`}
                aria-label={`${announcement.pinned ? "Unpin" : "Pin"} "${
                  announcement.title
                }"`}
              >
                <FontAwesomeIcon icon={faMapPin} />
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => startEditing(announcement)}
                className={SMALL_BUTTON}
                aria-label={`Edit "${announcement.title}"`}
              >
                <FontAwesomeIcon icon={faPen} />
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => remove(announcement)}
                className="rounded-md p-2 text-red-400 hover:bg-red-400/20 disabled:opacity-50"
                aria-label={`Delete "${announcement.title}"`}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
