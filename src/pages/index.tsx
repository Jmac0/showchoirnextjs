import Head from "next/head";

import { getHomePageData } from "@/src/lib/contentfulClient";

export default function Home() {
  const fun = async () => {
    console.log(await getHomePageData());
  };
  fun();

  return (
    <div className="flex flex-col w-full">
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="#" />
      </Head>

      <main>
        <h1>Welcome to Show Choir</h1>
      </main>

      <footer>Footer</footer>
    </div>
  );
}
