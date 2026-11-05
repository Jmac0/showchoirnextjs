import React from "react";

import styles from "@/src/styles/stage.module.css";

type Props = {
  listText: string;
};
// One of the home page's list items (from Contentful), as a card
export default function StyledListComponent({ listText }: Props) {
  return (
    <li className="mt-0 flex items-center gap-3 rounded-2xl border-2 border-lightGold bg-black p-5 text-left text-lightGold transition hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(222,204,120,0.45)]">
      <span aria-hidden="true" className="text-2xl">
        ✦
      </span>
      {/* its own element: the lettering class would remove the card's padding */}
      <span className={`${styles.display} text-2xl`}>{listText}</span>
    </li>
  );
}
