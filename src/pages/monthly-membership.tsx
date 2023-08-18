import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Logo from "src/components/Logo";

import type { NewMemberFormData } from "@/src/components/forms/NewMemberSignupForm";
import { NewMemberSignUpForm } from "@/src/components/forms/NewMemberSignupForm";
import { Nav } from "@/src/components/Navigation/Nav";
import { getPageData } from "@/src/lib/contentfulClient";

import useHttp from "../hooks/useHttp";
import type { PageItemType } from "../types/types";

/* Next js page that renders a form to setup a monthly subscription and redirects the user to the Go Cardless sign up page. */
export default function MonthlyMembership({ pathData }: PageItemType) {
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
      if (responseData && responseData.authorization_url) {
        setMessage("Redirecting");
        await router.push(responseData.authorization_url);
      }
    };
    if (responseData?.authorization_url) {
      redirectUser();
    }
    // eslint disable next-line/exhaustive/deps
  }, [
    responseData?.authorization_url,
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

      <main className="flex w-screen flex-col items-center bg-transparent p-3 md:mt-20 ">
        <header className="mb-10">
          <h1>Monthly Membership</h1>
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
