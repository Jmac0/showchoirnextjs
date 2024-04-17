import { faArrowCircleDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";

import { AudioPlayerAndDownloadComponent } from "./AudioPlayerAndDownloadComponent";
import PdfDownloadAndViewComponent from "./PdfDownloadAndViewComponent";

type Props = {
  song: string;
  urls: { trackName: string; url: string }[];
};
// component to render audio player & download button for each track as well as a link to a pdf file
export function AudioAndLyricsContainer({ song, urls }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const handleHide = () => {
    setIsOpen(!isOpen);
  };
  return (
    <section className="mt-5 flex w-11/12 flex-col rounded-md border-2 border-solid border-lightGold bg-slate-700">
      <button
        type="button"
        onClick={handleHide}
        className="mb-1 flex w-full items-center justify-center bg-gradient-to-br from-yellow-200 to-yellow-500 "
      >
        <div className="mb-0 pb-0 text-lightBlack">
          <h2 className="pb-1 text-lightBlack">{song}</h2>

          <FontAwesomeIcon
            className={`${
              isOpen ? "rotate-180" : "rotate-0"
            } m-0 mb-2 p-0 transition-all duration-300 `}
            size="xl"
            icon={faArrowCircleDown}
          />
        </div>
      </button>
      <div
        data-testid="audio-draw"
        className={`bg-slate-100transition-all flex flex-wrap items-center justify-center overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-screen" : "max-h-0"
        }`}
      >
        {urls.map((el) =>
          el.url.includes("pdf") ? (
            <PdfDownloadAndViewComponent
              key={el.url}
              url={el.url}
              trackName={el.trackName}
            />
          ) : (
            <AudioPlayerAndDownloadComponent
              key={el.trackName}
              url={el.url}
              trackName={el.trackName}
            />
          )
        )}
      </div>
    </section>
  );
}
