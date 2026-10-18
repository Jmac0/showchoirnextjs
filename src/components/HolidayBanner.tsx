import { faUmbrellaBeach } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

type Props = {
  message: string;
};

// A notice in the same shape as UserMessage, but light gold - for things
// visitors should know before booking, like the choir being on holiday.
// role="status" rather than "alert": it's there when the page loads, so
// screen readers shouldn't interrupt to announce it.
export function HolidayBanner({ message }: Props) {
  return (
    <div
      role="status"
      className="my-4 flex flex-row items-center justify-center self-center rounded-md border-2 border-lightGold bg-lightGold/90 px-8 py-3 text-center text-base font-semibold text-lightBlack"
    >
      <span className="mr-3 flex items-center">
        <FontAwesomeIcon icon={faUmbrellaBeach} style={{ fontSize: 22 }} />
      </span>
      {message}
    </div>
  );
}
