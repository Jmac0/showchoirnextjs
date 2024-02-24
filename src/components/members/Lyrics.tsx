import React from "react";

type Props = {
  signedUrl: any;
};
export function Lyrics({ signedUrl }: Props) {
  console.log(signedUrl);

  return (
    <div className="mx-10 flex flex-col items-center md:mx-20">
      <h1 className="mb-10">Lyrics</h1>

      <div className="flex flex-col items-center">
        <h3>Memory</h3>
        <audio controls>
          <source src={signedUrl} type="audio/mpeg" />
          Your browser does not support the audio element.
          <track kind="captions" />
        </audio>
        <div>
          <a className="text-white" href={signedUrl} download>
            Download Audio
          </a>
        </div>
      </div>
    </div>
  );
}
