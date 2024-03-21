import React from "react";

import { AudioPlayerAndDownloadComponent } from "./AudioPlayerAndDownloadComponent";

type Props = {
  song: string;
  urls: [{ trackName: string; url: string }];
};
// component to render audio player & download button for each track as well as a link to a pdf file
export function AudioAndLyricsContainer({ song, urls }: Props) {
  return (
    // create a container to display audion elements in a gri
    <section className="mt-5 flex w-11/12 flex-col rounded-md border-2 border-solid border-lightGold bg-slate-700">
      <div className="mb-2 flex w-full items-center justify-center bg-gradient-to-br from-yellow-200 to-yellow-500 ">
        <h2 className="mb-0 text-lightBlack">{song}</h2>
      </div>
      <div className="flex flex-wrap items-center justify-center bg-slate-100">
        {urls.map((el) => (
          <AudioPlayerAndDownloadComponent
            key={el.trackName}
            url={el.url}
            trackName={el.trackName}
          />
        ))}
      </div>
    </section>
  );
}
