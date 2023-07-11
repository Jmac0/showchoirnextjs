import {
  faCircleCheck,
  faXmarkCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

type Props = {
  message: string;
  isError: boolean;
  showMessage: boolean;
};

export function UserMessage({ message, isError, showMessage }: Props) {
  return (
    <div
      data-testid="user-message-container"
      className={`mr-3 mt-2 flex h-8 w-max min-w-fit flex-row items-center justify-center self-center rounded-md border-2 p-1 px-5  
	  ${showMessage ? "opacity-1" : "opacity-0"}
  ${
    isError
      ? "border-red-900 bg-red-400 text-red-900 "
      : "border-amber-600 bg-yellow-200 text-amber-600 "
  }transition duration-200 ease-in-out`}
    >
      <div className="mr-3 mt-1">
        <FontAwesomeIcon
          icon={isError ? faXmarkCircle : faCircleCheck}
          style={{ fontSize: 20, color: isError ? "#b71c1c" : "#ffa000" }}
        />{" "}
      </div>
      <div data-testid="user-message">{message}</div>
    </div>
  );
}
