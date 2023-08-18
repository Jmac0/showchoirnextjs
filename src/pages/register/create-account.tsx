import type { GetServerSideProps } from "next";
import Head from "next/head";

import CreateAccountForm from "@/src/components/forms/CreateAccountForm";
import Logo from "@/src/components/Logo";
import { Nav } from "@/src/components/Navigation/Nav";
import { getPageData } from "@/src/lib/contentfulClient";
import { decryptEmail } from "@/src/lib/encryptEmail";
import { PageItemType } from "@/src/types/types";

function CreateAccountPage({ pathData, email }: PageItemType) {
  return (
    <div className="flex flex-col">
      <Head>
        <title>Create Account</title>
        <meta
          name="create account"
          content="Show Choir Surrey's premier musical theatre choir"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Logo />
      <Nav pathData={pathData} />
      <div
        className="mt-64 flex w-11/12 flex-col items-center justify-evenly self-center
      md:w-2/3 lg:w-1/3"
      >
        {!email ? (
          <div className="flex flex-col items-center rounded-md bg-gray-600 p-5">
            <h1 className="mb-5">This page is not available!</h1>
            <p className="w-11/12">
              You are seeing this message because you have landed here using an
              malformed link!
            </p>
          </div>
        ) : (
          <CreateAccountForm email={email} />
        )}
      </div>
    </div>
  );
}
interface ContextProps extends GetServerSideProps {
  query: { email: string };
}
export async function getServerSideProps(context: ContextProps) {
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
  // get encoded email from query sting and decrypt on server
  const { email } = context.query;
  const plainTextEmail: string = decryptEmail(email);

  return { props: { pathData, email: plainTextEmail } };
}
export default CreateAccountPage;
