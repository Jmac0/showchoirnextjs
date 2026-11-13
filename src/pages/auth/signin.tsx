import Head from "next/head";
import { useRouter } from "next/router";
import { signOut, useSession } from "next-auth/react";
import { useEffect } from "react";

import LoginForm from "@/src/components/forms/LoginForm";
import { RequestSetupLink } from "@/src/components/forms/RequestSetupLink";
import Logo from "@/src/components/Logo";
import { Nav } from "@/src/components/Navigation/Nav";
import {
  CONTENTFUL_REVALIDATE_SECONDS,
  getPageData,
} from "@/src/lib/contentfulClient";
import { PageItemType } from "@/src/types/types";

function SignIn({ pathData }: PageItemType) {
  const router = useRouter();
  const { data: session, status } = useSession();
  useEffect(() => {
    if (status !== "authenticated" || !session || !router.isReady) return;
    if (router.query.expired) {
      // Their login is for an email they've since changed - end it, so they
      // can log in with the new one (see pages/members/dashboard.tsx)
      signOut({ redirect: false });
    } else {
      router.replace("/members/dashboard");
    }
  }, [router, session, status]);

  return (
    <div className="flex flex-col">
      <Head>
        <title>Login</title>
        <meta
          name="Login "
          content="Show Choir Surrey's premier musical theatre choir"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Logo color="gold" />
      <Nav pathData={pathData} />
      <div
        className="mt-28 flex w-11/12 flex-col items-center justify-evenly self-center md:mt-40
      md:max-w-xl md:items-center  lg:max-w-2xl"
      >
        {/* Their login was just ended (lib/auth/signInRedirect.ts) */}
        {router.query.ended ? (
          <p
            role="status"
            className="mb-4 w-full rounded-lg border border-lightGold/60 bg-lightBlack p-4 text-center text-gray-200"
          >
            You&apos;ve been logged out - please log in again. If you&apos;ve
            recently changed your password, use the new one.
          </p>
        ) : null}
        <LoginForm />
        {/* Existing Direct Debit members who need their invite again */}
        <RequestSetupLink />
      </div>
    </div>
  );
}
export async function getStaticProps() {
  /* get paths for each page from Contentful */
  const res = await getPageData();
  const { items } = res;
  const pathData = items.map(
    (item: {
      fields: { slug: string; displayText: string; order: number };
    }) => ({
      slug: item.fields.slug,
      displayText: item.fields.displayText,
      order: item.fields.order,
    })
  );

  return { props: { pathData }, revalidate: CONTENTFUL_REVALIDATE_SECONDS };
}
export default SignIn;
