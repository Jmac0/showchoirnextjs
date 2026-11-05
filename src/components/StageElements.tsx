import Image, { StaticImageData } from "next/image";
import { useEffect, useState } from "react";

import styles from "@/src/styles/stage.module.css";

// The theatrical pieces shared by the home page and the Walton landing page

// The gold button that takes people down to the booking form (id="book")
export function BookButton({ className = "" }: { className?: string }) {
  return (
    <a
      href="#book"
      className={`inline-block rounded-full bg-lightGold px-8 py-4 text-center text-lg font-bold uppercase tracking-wide text-black shadow-[0_0_30px_rgba(222,204,120,0.55)] transition hover:scale-105 hover:bg-yellow-100 ${className}`}
    >
      Book your free taster
    </a>
  );
}

BookButton.defaultProps = { className: "" };

// Phones only: a booking button fixed to the bottom of the screen, on the way
// down from the hero (id="hero", which has its own button) to the booking form
// (id="book"). Also makes the booking buttons glide down the page rather than
// jump, switched off again when leaving the page.
// z-20: above the page, but below the menu drawer (Nav z-30, overlay z-[29])
export function PhoneBookBar() {
  const [heroOnScreen, setHeroOnScreen] = useState(true);
  const [formReached, setFormReached] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero");
    const book = document.getElementById("book");
    if (!hero || !book) return undefined;
    const heroObserver = new IntersectionObserver(([entry]) => {
      setHeroOnScreen(entry.isIntersecting);
    });
    const bookObserver = new IntersectionObserver(([entry]) => {
      setFormReached(entry.isIntersecting || entry.boundingClientRect.top < 0);
    });
    heroObserver.observe(hero);
    bookObserver.observe(book);
    return () => {
      heroObserver.disconnect();
      bookObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    html.style.scrollBehavior = "smooth";
    return () => {
      html.style.scrollBehavior = "";
    };
  }, []);

  if (heroOnScreen || formReached) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black to-transparent p-3 pt-6 md:hidden">
      <BookButton className="w-full !py-3" />
    </div>
  );
}

// Everything behind a hero's words: photo, video, dark tint, spotlights, stars.
// The photo shows until the video has loaded, and stays if the video can't play
// (e.g. phones in low power mode, or anyone who has asked for less motion)
export function StageBackdrop({
  image,
  alt,
}: {
  image: StaticImageData;
  alt: string;
}) {
  return (
    <>
      <Image
        src={image}
        alt={alt}
        fill
        priority
        placeholder={image.blurDataURL ? "blur" : "empty"}
        sizes="100vw"
        className="object-cover"
      />
      <video
        className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
        src="/hero.mp4"
        autoPlay
        muted
        loop
        playsInline
      />
      <span className="via-black/55 pointer-events-none absolute inset-0 bg-gradient-to-b from-black/75 to-black" />
      <span className={`${styles.beam} ${styles.beamLeft}`} />
      <span className={`${styles.beam} ${styles.beamRight}`} />
      <span
        className={`${styles.star} left-[12%] top-[24%] h-6 w-6 md:h-10 md:w-10`}
      />
      <span
        className={`${styles.star} right-[12%] top-[38%] h-5 w-5 [animation-delay:-1s] md:h-8 md:w-8`}
      />
      <span
        className={`${styles.star} bottom-[18%] left-[20%] h-4 w-4 [animation-delay:-1.8s] md:h-7 md:w-7`}
      />
    </>
  );
}

// The gold banner running across the page. Decoration only (hidden from screen
// readers): both pages say all of this in words further down
export function ScrollingBanner() {
  return (
    <div
      aria-hidden="true"
      className="relative z-10 -my-3 -rotate-1 overflow-hidden bg-lightGold py-3 shadow-[0_0_40px_rgba(222,204,120,0.5)]"
    >
      <div className={styles.marquee}>
        {[0, 1].map((copy) => (
          <span
            key={copy}
            className={`${styles.display} whitespace-nowrap pr-6 text-2xl text-black md:text-3xl`}
          >
            No auditions ✦ No sheet music ✦ No singing alone ✦ Just turn up and
            sing ✦ Find your sparkle ✦ No auditions ✦ No sheet music ✦ No
            singing alone ✦ Just turn up and sing ✦ Find your sparkle ✦
          </span>
        ))}
      </div>
    </div>
  );
}
