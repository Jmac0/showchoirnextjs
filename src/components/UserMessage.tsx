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
      role="alert"
      className={`min-h-8 mr-3 mt-2 flex flex-row items-center justify-center self-center rounded-md border-2 p-1 px-5 text-center text-sm  
	  ${showMessage ? "opacity-1" : "opacity-0"}
  ${
    isError
      ? "border-red-900 bg-red-400 text-red-900"
      : "border-amber-600 bg-yellow-200 text-amber-600"
  } transition duration-200 ease-in-out`}
    >
      <span className="mr-3 mt-1 items-center justify-center">
        <FontAwesomeIcon
          icon={isError ? faXmarkCircle : faCircleCheck}
          style={{ fontSize: 20, color: isError ? "#b71c1c" : "#ffa000" }}
        />{" "}
      </span>
      {message}
    </div>
  );
}
