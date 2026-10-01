import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { forwardRef, InputHTMLAttributes, useState } from "react";

// Every normal input prop except `type`, which this component controls
type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

// Password box with an eye button to show or hide what's been typed.
// Hidden by default. Works with react-hook-form like a normal input:
//   <PasswordInput id="password" className="..." {...register("password")} />
// (forwardRef passes register's ref through to the real <input>.)
export const PasswordInput = forwardRef<HTMLInputElement, Props>(
  ({ className, ...inputProps }, ref) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
      <div className="relative w-full">
        <input
          ref={ref}
          type={isVisible ? "text" : "password"}
          // Room on the right for the eye button
          className={`${className || ""} pr-10`}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setIsVisible((visible) => !visible)}
          aria-label={isVisible ? "Hide password" : "Show password"}
          aria-pressed={isVisible}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-black"
        >
          <FontAwesomeIcon icon={isVisible ? faEyeSlash : faEye} />
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
