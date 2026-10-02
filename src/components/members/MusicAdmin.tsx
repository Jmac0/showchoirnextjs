import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import React, { useState } from "react";

import { AdminSongCard } from "@/src/components/members/AdminSongCard";
import { AdminSong } from "@/src/lib/musicShared";

type Props = {
  initialSongs: AdminSong[];
};

// A-Z by title, ignoring case
const byTitle = (a: AdminSong, b: AdminSong) =>
  a.title.localeCompare(b.title, "en", { sensitivity: "base" });

// The Music & Lyrics admin page's contents: add a song, then manage each
// song's files. Current and archived songs are on separate tabs.
export function MusicAdmin({ initialSongs }: Props) {
  const [songs, setSongs] = useState<AdminSong[]>(initialSongs);
  const [tab, setTab] = useState<"current" | "archived">("current");
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Replace (or remove, if null) one song after a change on its card
  const updateSong = (id: string, updated: AdminSong | null) =>
    setSongs((all) =>
      updated
        ? all.map((song) => (song.id === id ? updated : song))
        : all.filter((song) => song.id !== id)
    );

  const addSong = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { data } = await axios.post("/api/admin/music/songs", {
        title: newTitle,
      });
      setSongs((all) => [...all, data.song].sort(byTitle));
      setNewTitle("");
      setTab("current");
    } catch (err) {
      setError(
        (axios.isAxiosError(err) && err.response?.data?.message) ||
          "Couldn't add the song"
      );
    } finally {
      setBusy(false);
    }
  };

  const shown = songs.filter((song) => song.status === tab).sort(byTitle);
  const count = (status: string) =>
    songs.filter((song) => song.status === status).length;

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      {/* --- Add a song --- */}
      <form
        onSubmit={addSong}
        className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-lightGold bg-lightBlack/90 p-5"
      >
        <input
          className="min-w-0 flex-1 rounded-md border-2 border-lightGold/60 bg-white px-2 py-2 text-base text-black focus:border-lightGold focus:outline-none"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New song title"
          aria-label="New song title"
        />
        <button
          type="submit"
          disabled={busy || !newTitle.trim()}
          className="flex items-center gap-2 rounded-md bg-lightGold px-4 py-2 font-bold text-black disabled:opacity-50"
        >
          <FontAwesomeIcon icon={faPlus} /> Add song
        </button>
        {error && (
          <p role="alert" className="w-full text-sm text-red-400">
            {error}
          </p>
        )}
      </form>

      {/* --- Current / Archived tabs --- */}
      <div className="flex gap-2" role="tablist">
        {(["current", "archived"] as const).map((status) => (
          <button
            key={status}
            type="button"
            role="tab"
            aria-selected={tab === status}
            onClick={() => setTab(status)}
            className={`rounded-full px-4 py-1.5 font-bold ${
              tab === status
                ? "bg-lightGold text-black"
                : "border border-lightGold/60 text-lightGold"
            }`}
          >
            {status === "current" ? "Current" : "Archived"} ({count(status)})
          </button>
        ))}
      </div>

      {/* --- The songs --- */}
      {shown.length === 0 ? (
        <p className="text-gray-400">
          {tab === "current"
            ? "No current songs - add one above."
            : "No archived songs."}
        </p>
      ) : (
        shown.map((song) => (
          <AdminSongCard
            key={song.id}
            song={song}
            onChange={(updated) => updateSong(song.id, updated)}
          />
        ))
      )}
    </div>
  );
}
