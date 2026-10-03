import { faKey } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { yupResolver } from "@hookform/resolvers/yup";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";

import { PasswordInput } from "@/src/components/forms/PasswordInput";
import { LoadingButton } from "@/src/components/LoadingButton";
import { UserMessage } from "@/src/components/UserMessage";
import useHttp from "@/src/hooks/useHttp";
// Same rule everywhere (and checked again on the server)
import { MIN_PASSWORD_LENGTH } from "@/src/lib/passwordRules";

const schema = yup
  .object()
  .shape({
    currentPassword: yup
      .string()
      .required("Please enter your current password"),
    newPassword: yup
      .string()
      .required("Please enter a new password")
      .min(
        MIN_PASSWORD_LENGTH,
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`
      ),
    confirm: yup
      .string()
      .required("Please confirm your new password")
      .oneOf([yup.ref("newPassword")], "Passwords do not match"),
  })
  .required();

type FormValues = {
  currentPassword: string;
  newPassword: string;
  confirm: string;
};

// The three password fields, in order
const FIELDS: {
  name: keyof FormValues;
  label: string;
  autoComplete: string;
}[] = [
  {
    name: "currentPassword",
    label: "Current password",
    autoComplete: "current-password",
  },
  { name: "newPassword", label: "New password", autoComplete: "new-password" },
  {
    name: "confirm",
    label: "Confirm new password",
    autoComplete: "new-password",
  },
];

const inputClass =
  "w-full rounded-md border-2 border-lightGold/60 bg-white py-2 pl-2 text-base text-black focus:border-lightGold focus:outline-none";

type Props = {
  // Card styles, shared with the other boxes on the Account tab
  className: string;
};

// "Change password" card on the dashboard's Account tab. Starts closed as a
// single button, so the tab isn't cluttered; opens to the form.
// Sends to api/members/change-password.ts.
export function ChangePasswordForm({ className }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const {
    loading,
    message,
    setLoading,
    sendRequest,
    showUserMessage,
    setShowUserMessage,
    isErrorMessage,
  } = useHttp({
    url: "/api/members/change-password",
    method: "POST",
    withCredentials: true,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: yupResolver(schema) });

  const submitForm = async ({ currentPassword, newPassword }: FormValues) => {
    setLoading(true);
    await sendRequest({ currentPassword, newPassword }, () => {
      // Changed - clear the fields so the passwords aren't left on screen
      reset();
      return { currentPassword: "", newPassword: "" };
    });
  };

  // Closed: just the button to open it
  if (!isOpen) {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center gap-3 text-lg text-lightGold hover:text-white"
        >
          <FontAwesomeIcon icon={faKey} />
          Change password
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(submitForm)} className={className} noValidate>
      <h2 className="mb-4 flex items-center justify-center gap-3 text-lightGold">
        <FontAwesomeIcon icon={faKey} />
        Change password
      </h2>

      {FIELDS.map(({ name, label, autoComplete }) => (
        // w-full: the card centres its contents, which would otherwise
        // shrink the fields to a narrow box
        <div key={name} className="mb-3 flex w-full flex-col">
          <label htmlFor={name} className="mb-1 text-sm">
            {label}
          </label>
          <PasswordInput
            id={name}
            autoComplete={autoComplete}
            autoCapitalize="none"
            className={inputClass}
            {...register(name)}
          />
          {errors[name] && (
            <span role="alert" className="mt-1 text-xs text-red-400">
              {errors[name]?.message}
            </span>
          )}
        </div>
      ))}

      <p className="mt-1 text-center text-xs text-gray-400">
        You&apos;ll need to log in to the app again with your new password.
      </p>

      <LoadingButton text="Save" loading={loading} disabled={false} />

      {showUserMessage && (
        <UserMessage
          message={message}
          isError={isErrorMessage}
          showMessage={showUserMessage}
          onDismiss={() => setShowUserMessage(false)}
        />
      )}

      <button
        type="button"
        onClick={() => {
          reset();
          setShowUserMessage(false);
          setIsOpen(false);
        }}
        className="mt-4 text-sm text-gray-400 underline hover:text-white"
      >
        Close
      </button>
    </form>
  );
}
