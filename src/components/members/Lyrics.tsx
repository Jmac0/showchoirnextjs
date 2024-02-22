import React from "react";

type Props = {
  signedUrl: string[];
};
export function Lyrics({ signedUrl }: Props) {
  return (
    <div className="mx-10 flex flex-col items-center md:mx-20">
      <h1 className="mb-10">Lyrics {signedUrl}</h1>

      <p>
        Lorem ipsum dolor sit amet consectetur, adipisicing elit. Nam dolorem
        est explicabo quod, architecto reiciendis nisi laborum ducimus nihil,
        nemo odit quae facere commodi alias aliquid similique corrupti, placeat
        tempore.
      </p>
    </div>
  );
}
