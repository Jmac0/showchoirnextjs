import { faFileDownload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

type Props = {
  // Signed link to play the track (from lib/music.ts - works for an hour)
  url: string;
  // Same file, but the browser saves it instead of playing it
  downloadUrl: string;
  trackName: string;
  // e.g. "Sopranos"
  partName?: string;
};

// One audio track: player and download link
export function AudioPlayerAndDownloadComponent({
  url,
  downloadUrl,
  trackName,
  partName = "",
}: Props) {
  return (
    <div
      className="m-1 mb-2 mt-1 flex w-full flex-shrink flex-col items-center
    justify-evenly rounded-md border-2 border-solid border-lightGold bg-lightBlack px-1 md:max-w-md"
    >
      <h3 className="pt-1">{trackName}</h3>
      {partName && partName !== trackName && (
        <p className="-mt-2 mb-1 text-xs text-gray-400">{partName}</p>
      )}
      {/* preload="none": nothing is fetched until play is pressed - every
          fetch from storage counts, and most tracks on the page aren't played */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        className="mb-2"
        data-testid="audio-player"
        controls
        preload="none"
        src={url}
      >
        Your browser does not support the audio element.
      </audio>
      <div>
        {/* Not the `download` attribute - it's ignored for files on another
            site (the storage), so downloadUrl asks the storage to send it as
            a download instead */}
        <a
          className="flex flex-row justify-center text-white"
          href={downloadUrl}
        >
          Download Track
          <FontAwesomeIcon className="ml-2" size="lg" icon={faFileDownload} />
        </a>
      </div>
    </div>
  );
}

AudioPlayerAndDownloadComponent.defaultProps = {
  partName: "",
};
