import React from "react";
import Image from "next/image";

export default function TasterPageWelcome() {
  return (
    <section className="lg:px my-6 flex flex-col-reverse items-center px-4 text-xl md:flex-row lg:mx-auto lg:max-w-7xl">
      <div className="flex w-full flex-col text-center lg:w-1/2">
        <h1>
          Welcome to Show Choir <br />
          The choir for anyone who loves musicals!
        </h1>
        <div>
          <p>
            With five choirs singing across Surrey, we bring people together
            every week to escape into a world of music, friendship and fun!!
          </p>
          <p>
            Whether you're dreaming of Broadway stardom or you've never sung a
            note outside the shower, there's a place for you in Show Choir.
          </p>
          <p>
            No auditions, no sheet music, just turn up, sing and feel
            fabulous. Group singing is proven to lift your mood, your
            confidence, and even boost your brain power! There's no better
            feeling than being surrounded by fellow musical theatre fans all
            feeling the joy of singing together.
          </p>
          <p className="font-bold">
            Come and find your sparkle ✨ at Show Choir!
          </p>
        </div>
        <Image
          src="/signature.png"
          alt="Ange"
          width={200}
          height={313}
          className="h-auto w-24 md:w-32"
        />
      </div>
      <div className="flex w-full flex-col md:w-1/2 md:items-end">
        <Image
          src="/ange-half-length.png"
          alt="Ange profile pic"
          width={413}
          height={513}
          sizes="(max-width: 768px) 90vw, 33vw"
          className="h-auto w-11/12 max-w-sm md:w-1/2"
        />
        <p>Angela Mackenzie Show Choir Founder</p>
      </div>
    </section>
  );
}
