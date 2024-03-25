import { faFilePdf } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

type Props = {
  url: string;
  trackName: string;
};
export default function PdfDownloadAndViewComponent({ trackName, url }: Props) {
  return (
    <div
      className="m-1 mb-2 mt-1 flex w-full flex-shrink flex-col items-center 
  justify-evenly rounded-md border-2 border-dashed border-lightGold bg-lightBlack px-1 md:max-w-md"
    >
      <h3 className="pt-1">{trackName}</h3>
      <a className="mb-3 flex flex-row justify-center text-white" href={url}>
        View Lyrics
        <FontAwesomeIcon
          className="ml-2 bg-red-400"
          size="lg"
          icon={faFilePdf}
        />
      </a>
      <div>
        <a
          className="mb-1 flex flex-row justify-center text-white"
          href={url}
          download
        >
          Download Lyrics
          <FontAwesomeIcon
            className="ml-2 bg-red-400"
            size="lg"
            icon={faFilePdf}
          />
        </a>
      </div>
    </div>
  );
}
