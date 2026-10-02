import axios from "axios";
import type { GetServerSidePropsContext } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { signIn } from "next-auth/react";
import { useState } from "react";

import type {
  CompleteAccountFormData,
  NewMemberFormData,
} from "@/src/components/forms/NewMemberSignupForm";
import { NewMemberSignUpForm } from "@/src/components/forms/NewMemberSignupForm";
import Logo from "@/src/components/Logo";
import { Nav } from "@/src/components/Navigation/Nav";
import { getChoirVenues, getPageData } from "@/src/lib/contentfulClient";
import dbConnect from "@/src/lib/dbConnect";
import { decryptEmail } from "@/src/lib/encryptEmail";
import Members, { MemberType } from "@/src/lib/models/member";
import { ChoirVenue } from "@/src/lib/venues";
import { PageItemType } from "@/src/types/types";

/* "Complete your account" - for existing Direct Debit members (who used to
sign in on paper), from the link in their invite email (sent from the "DD
members" admin page). They're already members, imported from GoCardless, so
this is the normal sign-up form with their details filled in, their email
fixed, a password to choose, and no payment step. Then they're logged in.

The link's ?token= is their email, encrypted - only someone with the email
can use it (checked again by api/signup/complete-account). */

type Props = PageItemType & {
  venues: ChoirVenue[];
  token: string;
  // Why the form isn't shown, if it isn't
  problem: "invalid" | "already_done" | null;
  defaultValues: Partial<NewMemberFormData>;
};

function Welcome({ pathData, venues, token, problem, defaultValues }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const submitForm = async (data: NewMemberFormData) => {
    const { password } = data as CompleteAccountFormData;
    setLoading(true);
    setMessage("");
    try {
      await axios.post("/api/signup/complete-account", { ...data, token });
      // Log them straight in, to their dashboard (membership card etc.)
      setIsError(false);
      setMessage("All done - logging you in");
      const result = await signIn("credentials", {
        email: defaultValues.email,
        password,
        redirect: false,
      });
      router.push(result?.error ? "/auth/signin" : "/members/dashboard");
    } catch (error) {
      setIsError(true);
      setMessage(
        (axios.isAxiosError(error) && error.response?.data?.message) ||
          "Something went wrong - please try again"
      );
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <Head>
        <title>Set up your account</title>
        <meta
          name="Set up your account"
          content="Show Choir Surrey's premier musical theatre choir"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Logo color="gold" />
      <Nav pathData={pathData} />

      <main className="mb-0 mt-16 flex w-full flex-col items-center bg-transparent md:mt-2">
        {problem ? (
          <div className="mt-48 flex w-11/12 flex-col items-center rounded-md border-2 border-lightGold bg-gradient-to-br from-lightBlack/75 to-black/75 p-5 text-center text-gray-300 md:w-1/2">
            {problem === "already_done" ? (
              <>
                <h1 className="mb-5">You&apos;re all set up!</h1>
                <p>You&apos;ve already created your account.</p>
                <Link
                  href="/auth/signin"
                  className="mt-4 rounded bg-lightGold px-6 py-2 font-bold text-black"
                >
                  Log in
                </Link>
              </>
            ) : (
              <>
                <h1 className="mb-5">This link isn&apos;t valid</h1>
                <p>
                  Please use the button in your invite email. If it still
                  doesn&apos;t work, ask for a new link on the log in page.
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            <header className="mb-4 w-11/12 text-center md:w-2/3">
              <h1>Welcome to the new Show Choir!</h1>
              <p className="mt-3 text-gray-300">
                Check your details, choose your home choir and a password, and
                you&apos;ll have your membership card for check-in and all the
                music and lyrics.
              </p>
            </header>
            <NewMemberSignUpForm
              existingMember
              defaultValues={defaultValues}
              loading={loading}
              submitForm={submitForm}
              message={message}
              isErrorMessage={isError}
              showUserMessage={!!message}
              showFlexiOptions={false}
              venues={venues}
            />
          </>
        )}
      </main>
    </div>
  );
}

// "+44 7700 900123" -> "07700900123" (the form's phone check wants UK style)
const ukPhone = (phone: unknown) =>
  String(phone || "")
    .replace(/^\+44\s*(\(0\))?/, "0")
    .replace(/[\s-]/g, "");

export async function getServerSideProps(context: GetServerSidePropsContext) {
  /* get paths for each page from Contentful */
  const res = await getPageData();
  const pathData = res.items.map(
    (item: {
      fields: { slug: string; displayText: string; order: number };
    }) => ({
      slug: item.fields.slug,
      displayText: item.fields.displayText,
      order: item.fields.order,
    })
  );
  const venues = await getChoirVenues();

  const token =
    typeof context.query.token === "string" ? context.query.token : "";
  const email = token ? decryptEmail(token) : "";
  const props = { pathData, venues, token, defaultValues: {} };

  if (!email) return { props: { ...props, problem: "invalid" } };
  await dbConnect();
  const member = (await Members.findOne({ email })
    .select("+password")
    .lean()) as MemberType | null;
  if (!member) return { props: { ...props, problem: "invalid" } };
  if (member.password) return { props: { ...props, problem: "already_done" } };

  // Their details so far (from GoCardless) - the form starts with these
  const defaultValues: Partial<NewMemberFormData> = {
    firstName: member.first_name || "",
    lastName: member.last_name || "",
    streetAddress: member.street_address || "",
    townOrCity: member.town_city || "",
    county: member.county || "",
    postCode: member.post_code || "",
    phoneNumber: ukPhone(member.phone_number),
    email,
    homeChoir: member.home_choir || "",
  };
  return { props: { ...props, problem: null, defaultValues } };
}

export default Welcome;
