import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

import Logo from "@/src/components/Logo";

// Where GoCardless sends a member after "Set up a new Direct Debit" (from
// their Account page or the app - see api/gocardless/restart.ts), or if they
// back out of its form (?cancelled=1). Public and simple, because members
// coming from the app aren't logged in on the website.
export default function DirectDebitThanks() {
  const { query } = useRouter();
  const cancelled = query.cancelled === "1";

  return (
    <div className="flex min-h-screen flex-col items-center">
      <Head>
        <title>Direct Debit</title>
      </Head>
      <Logo color="gold" />
      <div className="mt-48 flex w-11/12 max-w-md flex-col items-center gap-4 rounded-xl border-2 border-lightGold bg-lightBlack/90 p-6 text-center text-gray-200">
        <h1 className="p-0">{cancelled ? "No changes made" : "Thank you!"}</h1>
        <p>
          {cancelled
            ? "Your Direct Debit wasn't set up. You can try again any time from your Account page or the app."
            : "Your new Direct Debit is being set up - your membership will show as active again in a minute or two."}
        </p>
        <p className="text-sm text-gray-400">
          Using the app? You can close this page and go back to it (pull down on
          the home screen to refresh).
        </p>
        <Link
          href="/members/dashboard?component=account"
          className="rounded-md bg-lightGold px-4 py-2 font-bold text-black hover:bg-white"
        >
          Go to my account
        </Link>
      </div>
    </div>
  );
}
