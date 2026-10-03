import axios from "axios";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

import Logo from "@/src/components/Logo";

// Opened from the link in the "Confirm your new email" email (sent by
// api/members/change-email.ts). Sends the link's token to
// api/members/confirm-email.ts, which changes their email (here, in
// GoCardless and Mailchimp). Their website login was for the old email, so
// they're logged out and asked to log in with the new one.
export default function ConfirmEmail() {
  const router = useRouter();
  const { status } = useSession();
  const [result, setResult] = useState<
    { ok: true; email: string } | { ok: false; message: string } | null
  >(null);
  // Only send it once (React runs effects twice in development)
  const sent = useRef(false);

  useEffect(() => {
    if (!router.isReady || sent.current) return;
    sent.current = true;
    axios
      .post("/api/members/confirm-email", { token: router.query.token })
      .then(({ data }) => setResult({ ok: true, email: data.email }))
      .catch((error) =>
        setResult({
          ok: false,
          message:
            (axios.isAxiosError(error) && error.response?.data?.message) ||
            "Something went wrong - please try the link again",
        })
      );
  }, [router.isReady, router.query.token]);

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
        {!result && <p>Just a moment...</p>}
        {result?.ok && (
          <>
            <h1 className="p-0">Email changed</h1>
            <p>
              Your email is now <b>{result.email}</b>. Please log in with it -
              on the website and in the app.
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
