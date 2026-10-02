import { faArrowCircleDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";

import { KIND_LABELS, MemberTrack, partLabel } from "@/src/lib/musicShared";

import { AudioPlayerAndDownloadComponent } from "./AudioPlayerAndDownloadComponent";
import PdfDownloadAndViewComponent from "./PdfDownloadAndViewComponent";

type Props = {
  title: string;
  // Already filtered to the member's chosen voice part (see resources.tsx)
  tracks: MemberTrack[];
};

// One song on the Music & Lyrics page: a gold header that opens a drawer with
// an audio player for each part track and a card for each lyrics / sheet
// music PDF.
export function AudioAndLyricsContainer({ title, tracks }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="mt-5 flex w-11/12 flex-col rounded-md border-2 border-solid border-lightGold bg-slate-700">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="mb-1 flex w-full items-center justify-center bg-gradient-to-br from-yellow-200 to-yellow-500 "
      >
        <div className="mb-0 pb-0 text-lightBlack">
          <h2 className="pb-1 text-lightBlack">{title}</h2>

          <FontAwesomeIcon
            className={`${
              isOpen ? "rotate-180" : "rotate-0"
            } m-0 mb-2 p-0 transition-all duration-300 `}
            size="xl"
            icon={faArrowCircleDown}
          />
        </div>
      </button>
      {/* The drawer - a generous max height, so songs with lots of files
          aren't cut off when it's open */}
      <div
        data-testid="audio-draw"
        className={`flex flex-wrap items-center justify-center overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[500rem]" : "max-h-0"
        }`}
      >
        {tracks.length === 0 && (
          <p className="p-4 text-sm text-gray-300">
            No files for this part yet
          </p>
        )}
        {tracks.map((track) =>
          track.kind === "audio" ? (
            <AudioPlayerAndDownloadComponent
              key={track.id}
              url={track.url}
              downloadUrl={track.download_url}
              trackName={track.label}
              partName={partLabel(track.part)}
            />
          ) : (
            <PdfDownloadAndViewComponent
              key={track.id}
              url={track.url}
              downloadUrl={track.download_url}
              trackName={track.label}
              kindName={KIND_LABELS[track.kind]}
            />
          )
        )}
      </div>
    </section>
  );
}
