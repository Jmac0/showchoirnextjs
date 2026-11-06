import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faFacebook, faInstagram } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { format } from "date-fns";
import Link from "next/link";
import React from "react";

import { openCookieSettings } from "@/src/lib/cookieConsent";

import Logo from "./Logo";

type Props = {
  pathData:
    | {
        slug: string;
        displayText: string;
        order: number;
      }[]
    | undefined;
};

export default function Footer({ pathData }: Props) {
  const date = format(new Date(), "yyyy").toString();
  return (
    <section className="mt-8 flex w-full flex-col justify-center bg-gold pb-0">
      <Logo color="black" />
      <div className="flex w-1/3 flex-col self-center">
        <h3 className="text-lightBlack">Quick links</h3>
        {pathData &&
          pathData.map((element, index) => (
            <Link key={index} href={element.slug}>
              {element.displayText}
            </Link>
          ))}
        {/* Not a Contentful page, so it's added here rather than in the main
        menu (which comes from Contentful) */}
        <Link href="/privacy-policy">Privacy policy</Link>
        {/* Lets people change their mind about cookies at any time */}
        <button
          type="button"
          className="text-left"
          onClick={openCookieSettings}
        >
          Cookie settings
        </button>
      </div>
      <div className="flex w-full flex-row pl-4">
        <a href="https://www.facebook.com/profile.php?id=61588907476935">
          <FontAwesomeIcon
            icon={faFacebook as IconProp}
            className="mr-2 text-lightBlack"
            size="2xl"
          />
        </a>

        <a href="https://www.instagram.com/show_choir_uk">
          <FontAwesomeIcon
            icon={faInstagram as IconProp}
            className="mr-2 text-lightBlack"
            size="2xl"
          />
        </a>
      </div>
      <p className="flex self-center text-lightBlack">
        &copy; {date} Show Choir
      </p>
    </section>
  );
}
