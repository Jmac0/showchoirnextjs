import { faFileDownload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

type Props = {
  url: string;
  trackName: string;
};
// component to play audio and download linked file
export function AudioPlayerAndDownloadComponent({ url, trackName }: Props) {
  return (
    <div className="m-1 mb-2 mt-1 flex w-full flex-shrink flex-col items-center justify-evenly rounded-md border-2 border-solid border-lightGold bg-lightBlack px-1 md:max-w-md">
      <h3 className="pt-1">{trackName}</h3>
      <audio className="mb-2" controls>
        <source src={url} type="audio/mpeg" />
        <source src={url} type="audio/mp4" />
        Your browser does not support the audio element.
        <track kind="captions" />
      </audio>
      <div>
        <a
          className="flex flex-row justify-center text-white"
          href={url}
          download
        >
          Download Track
          <FontAwesomeIcon className="ml-2" size="lg" icon={faFileDownload} />
        </a>
      </div>
    </div>
  );
}
