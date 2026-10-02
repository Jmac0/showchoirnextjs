import {
  faArrowCircleDown,
  faBoxArchive,
  faFileArrowUp,
  faPen,
  faRotateLeft,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import React, { useState } from "react";

import {
  AdminSong,
  AdminTrack,
  KIND_LABELS,
  partLabel,
  TrackKind,
  UPLOAD_RULES,
  uploadProblem,
  VOICE_PARTS,
  VoicePart,
} from "@/src/lib/musicShared";

type Props = {
  song: AdminSong;
  // The song after a change (or null if it was deleted)
  onChange: (song: AdminSong | null) => void;
};

const BUTTON =
  "flex items-center gap-2 rounded-md border border-lightGold/60 px-3 py-1.5 text-sm text-lightGold hover:bg-lightGold hover:text-black disabled:opacity-50";
const INPUT =
  "rounded-md border-2 border-lightGold/60 bg-white px-2 py-1.5 text-base text-black focus:border-lightGold focus:outline-none";

// "1.2 MB"
const fileSize = (bytes: number) =>
  bytes > 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.ceil(bytes / 1024)} KB`;

// Some browsers don't know an M4A's type - work it out from the name
function contentTypeFor(file: File) {
  if (file.type) return file.type;
  if (/\.m4a$/i.test(file.name)) return "audio/mp4";
  if (/\.mp3$/i.test(file.name)) return "audio/mpeg";
  if (/\.wav$/i.test(file.name)) return "audio/wav";
  if (/\.pdf$/i.test(file.name)) return "application/pdf";
  return "";
}

// A sensible starting name from the file name, e.g.
// "Memory-Sops-and-Sop1.mp3" -> "Memory Sops and Sop1"
const labelFromFileName = (name: string) =>
  name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();

// The message from a failed request to our API
const errorMessage = (error: unknown) =>
  (axios.isAxiosError(error) && error.response?.data?.message) ||
  "Something went wrong, please try again";

// Uploads straight to storage (R2) with the signed link, reporting progress
function putFile(
  url: string,
  file: File,
  contentType: string,
  onProgress: (percent: number) => void
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () =>
      xhr.status < 300 ? resolve() : reject(new Error("Upload failed"));
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(file);
  });
}

// One song on the admin page: rename / archive / delete it, its files
// (edit name and part, delete), and "Add file" to upload more.
export function AdminSongCard({ song, onChange }: Props) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  // Whether the card is opened up (starts closed, like the members' cards)
  const [isOpen, setIsOpen] = useState(false);

  // --- Renaming the song ---
  const [isRenaming, setIsRenaming] = useState(false);
  const [title, setTitle] = useState(song.title);

  // --- Editing one file's name / part ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editPart, setEditPart] = useState<VoicePart>("all");

  // --- Adding a file ---
  const [isAdding, setIsAdding] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState<TrackKind>("audio");
  const [part, setPart] = useState<VoicePart>("all");
  const [label, setLabel] = useState("");
  const [progress, setProgress] = useState<number | null>(null);

  const songUrl = `/api/admin/music/songs/${song.id}`;

  // Runs a change, showing errors and passing the updated song back up
  const run = async (action: () => Promise<AdminSong | null>) => {
    setError("");
    setBusy(true);
    try {
      onChange(await action());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  // --- Song actions ---

  const saveTitle = () =>
    run(async () => {
      const { data } = await axios.patch(songUrl, { title });
      setIsRenaming(false);
      return data.song;
    });

  const toggleArchived = () =>
    run(async () => {
      const status = song.status === "current" ? "archived" : "current";
      const { data } = await axios.patch(songUrl, { status });
      return data.song;
    });

  const deleteSong = () => {
    if (
      // eslint-disable-next-line no-alert
      !window.confirm(
        `Delete "${song.title}" and all ${song.tracks.length} of its files? This can't be undone.`
      )
    )
      return;
    run(async () => {
      await axios.delete(songUrl);
      return null;
    });
  };

  // --- File actions ---

  const startEdit = (track: AdminTrack) => {
    setEditingId(track.id);
    setEditLabel(track.label);
    setEditPart(track.part || "all");
  };

  const saveEdit = (track: AdminTrack) =>
    run(async () => {
      const { data } = await axios.patch(`${songUrl}/tracks/${track.id}`, {
        label: editLabel,
        ...(track.kind === "audio" ? { part: editPart } : {}),
      });
      setEditingId(null);
      return data.song;
    });

  const deleteTrack = (track: AdminTrack) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Delete "${track.label}"?`)) return;
    run(async () => {
      const { data } = await axios.delete(`${songUrl}/tracks/${track.id}`);
      return data.song;
    });
  };

  // --- Uploading a new file ---

  const chooseFile = (chosen: File | null) => {
    setFile(chosen);
    if (chosen) setLabel(labelFromFileName(chosen.name));
  };

  const upload = (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      setError("Please choose a file");
      return;
    }
    const contentType = contentTypeFor(file);
    // Same checks as the server, so problems show straight away
    const problem = uploadProblem(kind, contentType, file.size);
    if (problem) {
      setError(problem);
      return;
    }
    const details = {
      fileName: file.name,
      contentType,
      size: file.size,
      kind,
    };
    run(async () => {
      // 1. Ask for an upload link
      const { data: link } = await axios.post("/api/admin/music/upload-url", {
        songId: song.id,
        ...details,
      });
      // 2. Upload the file straight to storage
      setProgress(0);
      try {
        await putFile(link.uploadUrl, file, contentType, setProgress);
      } finally {
        setProgress(null);
      }
      // 3. Add it to the song
      const { data } = await axios.post(`${songUrl}/tracks`, {
        trackId: link.trackId,
        ...details,
        ...(kind === "audio" ? { part } : {}),
        label,
      });
      // Ready for the next file
      setFile(null);
      setLabel("");
      setIsAdding(false);
      return data.song;
    });
  };

  const fileCount = `${song.tracks.length} file${
    song.tracks.length === 1 ? "" : "s"
  }`;

  return (
    <article className="flex w-full flex-col overflow-hidden rounded-xl border-2 border-lightGold bg-lightBlack/90 shadow-lg shadow-lightGold/10">
      {/* --- Gold header (like the members' Music & Lyrics cards): tap to
          open or close the song --- */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-3 bg-gradient-to-br from-yellow-200 to-yellow-500 px-5 py-3 text-left"
      >
        <h2 className="flex-1 p-0 text-lightBlack">{song.title}</h2>
        <span className="text-sm text-lightBlack">{fileCount}</span>
        <FontAwesomeIcon
          className={`${
            isOpen ? "rotate-180" : "rotate-0"
          } text-lightBlack transition-all duration-300`}
          size="xl"
          icon={faArrowCircleDown}
        />
      </button>

      {/* --- The drawer: song actions, its files, and Add file --- */}
      <div
        data-testid="admin-song-drawer"
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[500rem]" : "max-h-0"
        }`}
      >
        <div className="p-5">
          {/* --- Song actions (rename / archive / delete) --- */}
          <div className="flex flex-wrap items-center gap-3">
            {isRenaming && (
              <input
                className={`${INPUT} flex-1`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                aria-label="Song title"
              />
            )}
            {isRenaming ? (
              <>
                <button
                  type="button"
                  className={BUTTON}
                  onClick={saveTitle}
                  disabled={busy}
                >
                  Save
                </button>
                <button
                  type="button"
                  className={BUTTON}
                  onClick={() => {
                    setTitle(song.title);
                    setIsRenaming(false);
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={BUTTON}
                  onClick={() => setIsRenaming(true)}
                >
                  <FontAwesomeIcon icon={faPen} /> Rename
                </button>
                <button
                  type="button"
                  className={BUTTON}
                  onClick={toggleArchived}
                  disabled={busy}
                >
                  <FontAwesomeIcon
                    icon={
                      song.status === "current" ? faBoxArchive : faRotateLeft
                    }
                  />
                  {song.status === "current" ? "Archive" : "Make current"}
                </button>
                <button
                  type="button"
                  className={BUTTON}
                  onClick={deleteSong}
                  disabled={busy}
                >
                  <FontAwesomeIcon icon={faTrash} /> Delete
                </button>
              </>
            )}
          </div>

          {/* --- Its files --- */}
          <ul className="mt-4 flex flex-col divide-y divide-white/10">
            {song.tracks.length === 0 && (
              <li className="py-2 text-sm text-gray-400">No files yet</li>
            )}
            {song.tracks.map((track) => (
              <li
                key={track.id}
                className="flex flex-wrap items-center gap-3 py-2"
              >
                {editingId === track.id ? (
                  <>
                    <input
                      className={`${INPUT} flex-1`}
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      aria-label="File name shown to members"
                    />
                    {track.kind === "audio" && (
                      <select
                        className={INPUT}
                        value={editPart}
                        onChange={(e) =>
                          setEditPart(e.target.value as VoicePart)
                        }
                        aria-label="Voice part"
                      >
                        {VOICE_PARTS.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      type="button"
                      className={BUTTON}
                      onClick={() => saveEdit(track)}
                      disabled={busy}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className={BUTTON}
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="text-white">{track.label}</p>
                      <p className="text-xs text-gray-400">
                        {track.kind === "audio"
                          ? `Audio · ${partLabel(track.part)}`
                          : KIND_LABELS[track.kind]}{" "}
                        · {fileSize(track.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={BUTTON}
                      onClick={() => startEdit(track)}
                      aria-label={`Edit ${track.label}`}
                    >
                      <FontAwesomeIcon icon={faPen} />
                    </button>
                    <button
                      type="button"
                      className={BUTTON}
                      onClick={() => deleteTrack(track)}
                      disabled={busy}
                      aria-label={`Delete ${track.label}`}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>

          {/* --- Add a file --- */}
          {isAdding ? (
            <form
              onSubmit={upload}
              className="mt-4 flex flex-col gap-3 rounded-lg bg-white/5 p-4"
            >
              <div className="flex flex-wrap gap-3">
                <label className="flex flex-col text-sm">
                  Type
                  <select
                    className={INPUT}
                    value={kind}
                    onChange={(e) => {
                      setKind(e.target.value as TrackKind);
                      setFile(null);
                    }}
                  >
                    {(Object.keys(KIND_LABELS) as TrackKind[]).map((k) => (
                      <option key={k} value={k}>
                        {KIND_LABELS[k]}
                      </option>
                    ))}
                  </select>
                </label>
                {kind === "audio" && (
                  <label className="flex flex-col text-sm">
                    Voice part
                    <select
                      className={INPUT}
                      value={part}
                      onChange={(e) => setPart(e.target.value as VoicePart)}
                    >
                      {VOICE_PARTS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              <label className="flex flex-col text-sm">
                File ({UPLOAD_RULES[kind].extensions.replace(/,/g, ", ")}, max{" "}
                {UPLOAD_RULES[kind].maxBytes / 1024 / 1024} MB)
                <input
                  key={kind}
                  type="file"
                  accept={UPLOAD_RULES[kind].extensions}
                  onChange={(e) => chooseFile(e.target.files?.[0] || null)}
                  className="mt-1 text-white"
                />
              </label>

              <label className="flex flex-col text-sm">
                Name shown to members
                <input
                  className={INPUT}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Sopranos"
                />
              </label>

              {/* Upload progress */}
              {progress !== null && (
                <div className="h-2 w-full overflow-hidden rounded bg-white/20">
                  <div
                    className="h-full bg-lightGold transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button type="submit" className={BUTTON} disabled={busy}>
                  <FontAwesomeIcon icon={faFileArrowUp} />
                  {progress !== null ? `Uploading ${progress}%` : "Upload"}
                </button>
                <button
                  type="button"
                  className={BUTTON}
                  disabled={busy}
                  onClick={() => {
                    setIsAdding(false);
                    setFile(null);
                    setError("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              className={`${BUTTON} mt-4 self-start`}
              onClick={() => setIsAdding(true)}
            >
              <FontAwesomeIcon icon={faFileArrowUp} /> Add file
            </button>
          )}

          {error && (
            <p role="alert" className="mt-3 text-sm text-red-400">
              {error}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
