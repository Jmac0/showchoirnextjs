import { faFilePdf } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

type Props = {
  // Signed link to view the PDF (from lib/music.ts - works for an hour)
  url: string;
  // Same file, but the browser saves it instead of showing it
  downloadUrl: string;
  trackName: string;
  // "Lyrics" or "Sheet music" - used in the link text
  kindName: string;
};

// A lyrics or sheet music PDF: view (in a new tab) and download links
export default function PdfDownloadAndViewComponent({
  trackName,
  url,
  downloadUrl,
  kindName,
}: Props) {
  return (
    <div
      className="m-1 mb-2 mt-1 flex w-full flex-shrink flex-col items-center
  justify-evenly rounded-md border-2 border-dashed border-lightGold bg-lightBlack px-1 md:max-w-md"
    >
      <h3 className="pt-1">{trackName}</h3>
      <a
        className="mb-3 flex flex-row justify-center text-white"
        href={url}
        target="_blank"
        rel="noreferrer"
      >
        View {kindName}
        <FontAwesomeIcon
          className="ml-2 bg-red-400"
          size="lg"
          icon={faFilePdf}
        />
      </a>
      <div>
        <a
          className="mb-1 flex flex-row justify-center text-white"
          href={downloadUrl}
        >
          Download {kindName}
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
