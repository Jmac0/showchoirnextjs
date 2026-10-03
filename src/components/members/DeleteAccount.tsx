import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import { signOut } from "next-auth/react";
import React, { useState } from "react";

import { PasswordInput } from "@/src/components/forms/PasswordInput";

type Props = {
  // Their Direct Debit is still active - deleting the account doesn't stop
  // it, so they're warned to cancel it with their bank
  hasActiveDirectDebit: boolean;
};

// "Danger zone" at the bottom of the dashboard's Account tab: permanently
// delete their account (api/members/delete-account.ts). Starts as a single
// button; opens to ask for their password, then a last "are you sure?".
export function DeleteAccount({ hasActiveDirectDebit }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const deleteAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!password) {
      setError("Please enter your password");
      return;
    }
    if (
      // eslint-disable-next-line no-alert
      !window.confirm(
        "Permanently delete your account?\n\nYour details, membership and check-in history will be deleted. This can't be undone."
      )
    ) {
      return;
    }
    setIsDeleting(true);
    try {
      await axios.post("/api/members/delete-account", {
        currentPassword: password,
      });
      // Gone - log out and go to the home page
      await signOut({ callbackUrl: "/" });
    } catch (err) {
      setError(
        (axios.isAxiosError(err) && err.response?.data?.message) ||
          "Something went wrong, please try again."
      );
      setIsDeleting(false);
    }
  };

  return (
    <section className="mt-24 flex w-full max-w-md flex-col items-center rounded-xl border-2 border-red-500 bg-red-100 p-6">
      <h2 className="mb-3 p-0 text-lg font-bold uppercase tracking-widest text-red-700">
        Danger zone
      </h2>

      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-3 text-xl font-bold text-red-700 hover:text-red-900"
        >
          <FontAwesomeIcon icon={faTrashCan} />
          Delete my account
        </button>
      ) : (
        <form
          onSubmit={deleteAccount}
          className="flex w-full flex-col"
          noValidate
        >
          <p className="mb-3 text-base text-gray-800">
            This permanently deletes your account: your details, membership and
            check-in history. It can&apos;t be undone.
          </p>
          {hasActiveDirectDebit && (
            <p className="mb-3 rounded-md border border-amber-500 bg-amber-50 p-3 text-base text-amber-900">
              Deleting your account <b>doesn&apos;t stop your Direct Debit</b> -
              please cancel it with your bank as well, or you&apos;ll keep being
              charged.
            </p>
          )}
          <label
            htmlFor="deletePassword"
            className="mb-1 text-base text-gray-800"
          >
            Your password
          </label>
          <PasswordInput
            id="deletePassword"
            autoComplete="current-password"
            className="w-full rounded-md border-2 border-red-500/60 bg-white py-2 pl-2 text-base text-black focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <p role="alert" className="mt-2 text-base text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isDeleting}
            className="mt-4 rounded-md bg-red-600 px-4 py-3 text-lg font-bold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {isDeleting ? "Deleting..." : "Permanently delete my account"}
          </button>
          <button
            type="button"
            onClick={() => {
              setPassword("");
              setError("");
              setIsOpen(false);
            }}
            className="mt-4 self-center text-base text-gray-700 underline hover:text-black"
          >
            Cancel
          </button>
        </form>
      )}
    </section>
  );
}
