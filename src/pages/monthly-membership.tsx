import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Logo from "src/components/Logo";

import type { NewMemberFormData } from "@/src/components/forms/NewMemberSignupForm";
import { NewMemberSignUpForm } from "@/src/components/forms/NewMemberSignupForm";
import { Nav } from "@/src/components/Navigation/Nav";
import { getPageData } from "@/src/lib/contentfulClient";

import useHttp from "../hooks/useHttp";

type Props = {
  pathData: [{ slug: string; displayText: string; order: number }];
};

export default function MonthlyMembership({ pathData }: Props) {
  const router = useRouter();
  const {
    loading,
    message,
    sendRequest,
    showUserMessage,
    setMessage,
    responseData,
    isErrorMessage,
    setIsErrorMessage,
  } = useHttp({
    url: `${process.env.NEXT_PUBLIC_GOCARDLESS_SIGNUP_URL}`,
    method: "POST",
    withCredentials: false,
  });
  const submitForm = async (data: NewMemberFormData): Promise<void> => {
    await sendRequest(data);
  };
  // send user to the redirect url from gocardless
  useEffect(() => {
    const redirectUser = async () => {
      if (responseData && responseData.authorisation_url) {
        setMessage("Redirecting");
        await router.push(responseData.authorisation_url);
      }
    };
    if (responseData?.authorisation_url) {
      redirectUser();
    }
    // eslint disable next-line/exhaustive/deps
  }, [
    responseData?.authorisation_url,
    responseData,
    router,
    setIsErrorMessage,
    setMessage,
  ]);

  return (
    <div className="flex flex-col">
      <Head>
        <title>Join Show Choir</title>
        <meta
          name="Join Show Choir"
          content="Show Choir Surrey's premier musical theatre choir"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Logo />

      <Nav pathData={pathData} />

      <main className="mt-16 flex w-screen flex-col items-center bg-transparent p-3 ">
        <header>
          <h1>Monthly Membership Form </h1>
        </header>
        <NewMemberSignUpForm
          loading={loading}
          submitForm={submitForm}
          message={message}
          isErrorMessage={isErrorMessage}
          showUserMessage={showUserMessage}
        />
      </main>
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
