import {
  faCircleCheck,
  faXmark,
  faXmarkCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

type Props = {
  message: string;
  isError: boolean;
  showMessage: boolean;
  // Optional - pass it to show a ✕ button that closes the message
  onDismiss?: () => void;
};

// Green success / red error message box, used by the site's forms and the
// members dashboard.
export function UserMessage({
  message,
  isError,
  showMessage,
  onDismiss,
}: Props) {
  return (
    <div
      role="alert"
      className={`min-h-8 mr-3 mt-2 flex flex-row items-center justify-center self-center rounded-md border-2 p-1 px-5 text-center text-sm  
	  ${showMessage ? "opacity-1" : "opacity-0"}
  ${
    isError
      ? "border-red-900 bg-red-400 text-red-900"
      : "border-green-600 bg-green-300 text-green-600"
  } transition duration-300 ease-in-out`}
    >
      <span className="mr-3 mt-1 items-center justify-center">
        <FontAwesomeIcon
          icon={isError ? faXmarkCircle : faCircleCheck}
          style={{ fontSize: 20, color: isError ? "#b71c1c" : "#1b9d49" }}
        />{" "}
      </span>
      {message}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Close message"
          className="ml-4 mt-1 opacity-70 hover:opacity-100"
        >
          <FontAwesomeIcon icon={faXmark} style={{ fontSize: 18 }} />
        </button>
      )}
    </div>
  );
}

// No ✕ unless onDismiss is passed
UserMessage.defaultProps = {
  onDismiss: undefined,
};
