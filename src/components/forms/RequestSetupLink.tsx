import axios from "axios";
import React, { useState } from "react";

import { LoadingButton } from "@/src/components/LoadingButton";

// Under the log in form: for existing Direct Debit members who haven't got
// (or have lost) their invite email - they type their email and the set-up
// link is sent again (api/signup/resend-invite). Starts as a single link.
export function RequestSetupLink() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post("/api/signup/resend-invite", {
        email,
      });
      setMessage(data.message);
    } catch (error) {
      setMessage(
        (axios.isAxiosError(error) && error.response?.data?.message) ||
          "Something went wrong - please try again"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-6 text-center text-sm text-lightGold underline"
      >
        Already pay by Direct Debit but not set up your account yet?
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mt-6 flex w-11/12 flex-col gap-2 rounded-md border-2 border-lightGold bg-gradient-to-br from-lightBlack/75 to-black/75 p-5 text-gray-300 md:w-2/3"
    >
      <p className="text-sm">
        Enter the email you pay your Direct Debit with and we&apos;ll send you a
        link to set up your account.
      </p>
      <label className="sr-only" htmlFor="setup_email">
        Email
      </label>
      <input
        id="setup_email"
        type="email"
        required
        autoCapitalize="none"
        className="w-full rounded py-1 pl-1 text-sm text-black"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setMessage("");
        }}
      />
      <LoadingButton text="Send my link" disabled={false} loading={loading} />
      {message && (
        <p role="status" className="text-center text-sm">
          {message}
        </p>
      )}
    </form>
  );
}
