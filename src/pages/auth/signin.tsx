import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

import LoginForm from "@/src/components/forms/LoginForm";
import Logo from "@/src/components/Logo";
import { Nav } from "@/src/components/Navigation/Nav";
import { getPageData } from "@/src/lib/contentfulClient";
import { PageItemType } from "@/src/types/types";

function SignIn({ pathData }: PageItemType) {
  const router = useRouter();
  const { data: session, status } = useSession();
  useEffect(() => {
    if (status === "authenticated" && session) {
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
      <Logo />
      <Nav pathData={pathData} />
      <div
        className="mt-28 flex w-11/12 flex-col items-center justify-evenly self-center md:mt-40
      md:max-w-xl md:items-center  lg:max-w-2xl"
      >
        <LoginForm />
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

  return { props: { pathData } };
}
export default SignIn;
