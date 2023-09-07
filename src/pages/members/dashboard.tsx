import Head from "next/head";
import { useRouter } from "next/router";
import { signOut, useSession } from "next-auth/react";
import { useEffect } from "react";

import Logo from "@/src/components/Logo";
import { Nav } from "@/src/components/Navigation/Nav";
import { getPageData } from "@/src/lib/contentfulClient";
import { PageItemType } from "@/src/types/types";

function Dashboard({ pathData }: PageItemType) {
  const { data: session, status } = useSession();
  const router = useRouter();
  // redirect to login if not authenticated
  useEffect(() => {
    let isMounted = true;
    if (status === "unauthenticated" && !session)
      router.replace("/auth/signin");
    // cleanup side effects before unmounting
    return () => {
      isMounted = false;
    };
  }, [router, session, status]);
  // sign user out and render login form
  const userSignOut = async () => {
    await signOut({
      redirect: false,
    });
  };
  // only render logo and nav if not authenticated, stops flash load of Dashboard
  if (!session) {
    return (
      <div>
        <Logo />
        <Nav pathData={pathData} />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Head>
        <title>Dashboard</title>
        <meta
          name="create account"
          content="Show Choir Surrey's premier musical theatre choir"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {/* <Logo /> */}
      <Nav pathData={pathData} />
      <div
        className="mt-32 flex w-11/12 flex-col items-center justify-evenly self-center md:mt-72
      md:max-w-xl md:items-center  lg:max-w-2xl"
      >
        <h1>DASHBOARD</h1>
        <p>Welcome {session && session.user.name}</p>
        <button type="button" onClick={() => userSignOut()}>
          Sign out
        </button>
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
export default Dashboard;
