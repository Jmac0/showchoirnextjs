import axios from "axios";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { signOut, useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";

import { LoadingButton } from "@/src/components/LoadingButton";
import Logo from "@/src/components/Logo";

// Opened from the link in the "Confirm your new email" email (sent by
// api/members/change-email.ts). Pressing the button sends the link's token
// to api/members/confirm-email.ts, which changes their email (here, in
// GoCardless and Mailchimp). Their website login was for the old email, so
// they're logged out and asked to log in with the new one.
//
// It waits for the button on purpose: email apps and link checkers (iPhone
// Mail previews, Gmail, Outlook Safe Links) open links by themselves before
// the member does. Changing it as the page loaded meant that visit used the
// link up - the email changed unasked, and the member's own click then said
// "expired or already used". Those checkers don't press buttons.
export default function ConfirmEmail() {
  const router = useRouter();
  const { status } = useSession();
  const [result, setResult] = useState<
    { ok: true; email: string } | { ok: false; message: string } | null
  >(null);
  const [isSending, setIsSending] = useState(false);

  const confirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      const { data } = await axios.post("/api/members/confirm-email", {
        token: router.query.token,
      });
      setResult({ ok: true, email: data.email });
    } catch (error) {
      setResult({
        ok: false,
        message:
          (axios.isAxiosError(error) && error.response?.data?.message) ||
          "Something went wrong - please try the link again",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Changed: end the old login (it was for the old email)
  useEffect(() => {
    if (result?.ok && status === "authenticated") {
      signOut({ redirect: false });
    }
  }, [result, status]);

  return (
    <div className="flex min-h-screen flex-col items-center">
      <Head>
        <title>Confirm your new email</title>
      </Head>
      <Logo color="gold" />
      <div className="mt-48 flex w-11/12 max-w-md flex-col items-center gap-4 rounded-xl border-2 border-lightGold bg-lightBlack/90 p-6 text-center text-gray-200">
        {!result && (
          <>
            <h1 className="p-0">Confirm your new email</h1>
            <p>Press the button to start using your new email address.</p>
            <form onSubmit={confirm} className="flex w-full flex-col">
              <LoadingButton
                text="Confirm my new email"
                loading={isSending}
                disabled={!router.isReady}
              />
            </form>
          </>
        )}
        {result?.ok && (
          <>
            <h1 className="p-0">Email changed</h1>
            <p>
              Your email is now <b>{result.email}</b>. Use it to log in on the
              website from now on - the app stays logged in.
            </p>
            <Link
              href="/auth/signin"
              className="rounded-md bg-lightGold px-4 py-2 font-bold text-black hover:bg-white"
            >
              Log in
            </Link>
          </>
        )}
        {result && !result.ok && (
          <>
            <h1 className="p-0">Email not changed</h1>
            <p>{result.message}</p>
          </>
        )}
      </div>
    </div>
  );
}
