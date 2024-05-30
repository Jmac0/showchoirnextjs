import { faMusic } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

type Props = {
  listText: string;
};
export default function StyledListComponent({ listText }: Props) {
  return (
    <li className="text-left font-bold">
      <FontAwesomeIcon icon={faMusic} className="mr-2 text-lightGold" />
      {listText}
    </li>
  );
}
