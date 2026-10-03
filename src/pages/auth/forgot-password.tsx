import axios from "axios";
import Head from "next/head";
import Link from "next/link";
import React, { useState } from "react";

import { LoadingButton } from "@/src/components/LoadingButton";
import Logo from "@/src/components/Logo";

// "Forgot your password?" - linked from the website's login form and the
// app's login screen. They give their email and get a link to reset it
// (api/members/forgot-password.ts). The answer is the same whether or not
// the email is a member's.
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post("/api/members/forgot-password", {
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

  return (
    <div className="flex min-h-screen flex-col items-center">
      <Head>
        <title>Forgot your password?</title>
      </Head>
      <Logo color="gold" />
      <form
        onSubmit={submit}
        className="mt-40 flex w-11/12 flex-col gap-3 rounded-md border-2 border-lightGold bg-gradient-to-br from-lightBlack/75 to-black/75 p-5 text-gray-50 md:w-1/2 lg:w-1/3"
      >
        <h2 className="self-center p-0">Forgot your password?</h2>
        {message ? (
          <p role="status" className="text-center">
            {message}
          </p>
        ) : (
          <>
            <p className="text-sm text-gray-300">
              Enter your email and we&apos;ll send you a link to choose a new
              password.
            </p>
            <label htmlFor="email" className="text-sm">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              autoCapitalize="none"
              className="w-full rounded py-1 pl-1 text-base text-black"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <LoadingButton
              text="Send link"
              disabled={false}
              loading={loading}
            />
          </>
        )}
        <Link
          href="/auth/signin"
          className="mt-2 self-center text-sm text-lightGold underline"
        >
          Back to log in
        </Link>
      </form>
    </div>
  );
}
