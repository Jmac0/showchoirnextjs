import React from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown/lib/ast-to-react";

import styles from "@/src/styles/stage.module.css";

// A choir's Description from Contentful, on its venue page. The field is
// written in Contentful's markdown editor, where a heading is typed as
// "## What's it like at Banstead?" - so it's shown as markdown, not plain
// text (which showed the "##"). Any heading level comes out as an h3 under
// the section's "Find us" h2, in gold poster lettering like "Parking"
const heading: Components["h2"] = function DescriptionHeading({ children }) {
  return (
    <h3 className={`${styles.display} mb-2 mt-6 text-3xl text-lightGold`}>
      {children}
    </h3>
  );
};

const markdownComponents: Components = {
  h1: heading,
  h2: heading,
  h3: heading,
  h4: heading,
  // pre-line keeps single line breaks typed in Contentful
  p: function DescriptionText({ children }) {
    return (
      <p className="mt-3 whitespace-pre-line text-lg text-gray-200">
        {children}
      </p>
    );
  },
  a: function DescriptionLink({ children, href }) {
    return (
      <a className="text-lightGold underline hover:text-yellow-100" href={href}>
        {children}
      </a>
    );
  },
};

export function VenueDescription({ text }: { text: string }) {
  return (
    <div className="mt-2">
      <ReactMarkdown components={markdownComponents}>{text}</ReactMarkdown>
    </div>
  );
}
