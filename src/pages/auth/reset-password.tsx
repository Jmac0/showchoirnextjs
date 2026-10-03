import axios from "axios";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState } from "react";

import { PasswordInput } from "@/src/components/forms/PasswordInput";
import { LoadingButton } from "@/src/components/LoadingButton";
import Logo from "@/src/components/Logo";
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_TOO_SHORT,
} from "@/src/lib/passwordRules";

// Opened from the "Reset your Show Choir password" email
// (api/members/forgot-password.ts). They choose a new password, which is
// sent with the link's token to api/members/reset-password.ts.
export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(PASSWORD_TOO_SHORT);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post("/api/members/reset-password", {
        token: router.query.token,
        password,
      });
      setDone(data.message);
    } catch (err) {
      setError(
        (axios.isAxiosError(err) && err.response?.data?.message) ||
          "Something went wrong - please try again"
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full rounded py-1 pl-1 text-base text-black";

  return (
    <div className="flex min-h-screen flex-col items-center">
      <Head>
        <title>Choose a new password</title>
      </Head>
      <Logo color="gold" />
      <form
        onSubmit={submit}
        className="mt-40 flex w-11/12 flex-col gap-3 rounded-md border-2 border-lightGold bg-gradient-to-br from-lightBlack/75 to-black/75 p-5 text-gray-50 md:w-1/2 lg:w-1/3"
        noValidate
      >
        <h2 className="self-center p-0">Choose a new password</h2>
        {done ? (
          <>
            <p role="status" className="text-center">
              {done}
            </p>
            <Link
              href="/auth/signin"
              className="self-center rounded-md bg-lightGold px-4 py-2 font-bold text-black hover:bg-white"
            >
              Log in
            </Link>
          </>
        ) : (
          <>
            <label htmlFor="password" className="text-sm">
              New password
            </label>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              autoCapitalize="none"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label htmlFor="confirm" className="text-sm">
              Confirm new password
            </label>
            <PasswordInput
              id="confirm"
              autoComplete="new-password"
              autoCapitalize="none"
              className={inputClass}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <p className="text-xs text-gray-400">
              At least {MIN_PASSWORD_LENGTH} characters. You&apos;ll be logged
              out of the app on every phone - log back in with the new one.
            </p>
            {error && (
              <p role="alert" className="text-sm text-red-400">
                {error}
                {error.includes("expired") && (
                  <>
                    {" "}
                    <Link
                      href="/auth/forgot-password"
                      className="text-lightGold underline"
                    >
                      Get a new link
                    </Link>
                  </>
                )}
              </p>
            )}
            <LoadingButton
              text="Save password"
              disabled={false}
              loading={loading}
            />
          </>
        )}
      </form>
    </div>
  );
}
