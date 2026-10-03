import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { yupResolver } from "@hookform/resolvers/yup";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";

import { PasswordInput } from "@/src/components/forms/PasswordInput";
import { LoadingButton } from "@/src/components/LoadingButton";
import { UserMessage } from "@/src/components/UserMessage";
import useHttp from "@/src/hooks/useHttp";

const schema = yup
  .object()
  .shape({
    newEmail: yup
      .string()
      .lowercase()
      .trim()
      .required("Please enter your new email")
      .email("Please check the email address"),
    currentPassword: yup.string().required("Please enter your password"),
  })
  .required();

type FormValues = {
  newEmail: string;
  currentPassword: string;
};

const inputClass =
  "w-full rounded-md border-2 border-lightGold/60 bg-white py-2 pl-2 text-base text-black focus:border-lightGold focus:outline-none";

type Props = {
  // Card styles, shared with the other boxes on the Account tab
  className: string;
};

// "Change email" card on the dashboard's Account tab, next to Change
// password. Starts closed as a single button; opens to the form. Sends to
// api/members/change-email.ts, which emails a link to the NEW address -
// nothing changes until they click it (pages/account/confirm-email.tsx),
// which also updates GoCardless and Mailchimp.
export function ChangeEmailForm({ className }: Props) {
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
    url: "/api/members/change-email",
    method: "POST",
    withCredentials: true,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: yupResolver(schema) });

  const submitForm = async (data: FormValues) => {
    setLoading(true);
    await sendRequest(data, () => {
      // Sent - clear the password so it isn't left on screen
      reset({ newEmail: data.newEmail, currentPassword: "" });
      return { newEmail: "", currentPassword: "" };
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
          <FontAwesomeIcon icon={faEnvelope} />
          Change email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(submitForm)} className={className} noValidate>
      <h2 className="mb-4 flex items-center justify-center gap-3 text-lightGold">
        <FontAwesomeIcon icon={faEnvelope} />
        Change email
      </h2>

      {/* w-full: the card centres its contents, which would otherwise
          shrink the fields to a narrow box */}
      <div className="mb-3 flex w-full flex-col">
        <label htmlFor="newEmail" className="mb-1 text-sm">
          New email
        </label>
        <input
          id="newEmail"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          className={inputClass}
          {...register("newEmail")}
        />
        {errors.newEmail && (
          <span role="alert" className="mt-1 text-xs text-red-400">
            {errors.newEmail.message}
          </span>
        )}
      </div>
      <div className="mb-3 flex w-full flex-col">
        <label htmlFor="emailCurrentPassword" className="mb-1 text-sm">
          Your password
        </label>
        <PasswordInput
          id="emailCurrentPassword"
          autoComplete="current-password"
          autoCapitalize="none"
          className={inputClass}
          {...register("currentPassword")}
        />
        {errors.currentPassword && (
          <span role="alert" className="mt-1 text-xs text-red-400">
            {errors.currentPassword.message}
          </span>
        )}
      </div>

      <p className="mt-1 text-center text-xs text-gray-400">
        We&apos;ll email a link to your new address - your email changes when
        you click it (and for your Direct Debit too). Then log in with the new
        one.
      </p>

      <LoadingButton text="Send link" loading={loading} disabled={false} />

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
