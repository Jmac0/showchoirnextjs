import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import React from "react";

import { encryptEmail } from "../../lib/encryptEmail";
// Images come from the live site, so they show in every email (including
// ones sent from a preview or a dev machine)
const SITE = "https://www.show-choir.co.uk";

// How they joined - a couple of lines differ: Flexi members are told about
// their sessions, Direct Debit members that there's nothing to pay at the door
export type WelcomeMembership = "flexi" | "DD";

// Email component, sent to new members, with encrypted email, to setup a new account
type EmailTemplateProps = {
  name: string;
  email: string;
  membership: WelcomeMembership;
};
export function EmailTemplate({ name, email, membership }: EmailTemplateProps) {
  const hashedEmail = encryptEmail(email);
  const isFlexi = membership === "flexi";
  return (
    <Html>
      <Preview>{name}, we are so glad to have you singing with us! 🎵</Preview>
      <Head />
      <Body>
        <Tailwind>
          <Container className="mt-2  flex w-11/12 rounded-md border-2 border-yellow-600 bg-slate-100 p-3">
            <Section className="flex pt-3 ">
              <Img
                src={`${SITE}/logo.png`}
                alt="Show Choir Logo"
                width="150"
                height="150"
              />
              <Text className="font-bold text-gray-900">Hi {name}</Text>
            </Section>
            <Heading className="text-yellow-600">
              Welcome to the Show Choir Family
            </Heading>

            <Text className="rounded-m m-1 mt-3 p-3 px-10 text-gray-900">
              Thank you for joining Show Choir - we can&apos;t wait to sing with
              you! Your membership is all set up and ready to go.
            </Text>
            <Text className="m-1 px-10 text-gray-900">
              The last step is to create your account. Just click the button
              below and choose a password. Once you&apos;re in, you&apos;ll be
              able to see your membership card
              {isFlexi ? ", how many sessions you have left," : ""} and all the
              music and lyrics for the songs we&apos;re learning.
            </Text>
            {isFlexi ? (
              <Text className="m-1 px-10 text-gray-900">
                You can come along to any of our choirs, any week - just show
                your membership card at the door. See you soon!
              </Text>
            ) : (
              <Text className="m-1 px-10 text-gray-900">
                Your monthly Direct Debit is all set up, so there&apos;s nothing
                to pay at the door. Come along to any of our choirs, any week -
                just show your membership card. See you soon!
              </Text>
            )}
            <Section className="mt-4 flex flex-row justify-center">
              <Button
                className="w-full rounded bg-yellow-600 p-3 text-center text-black"
                href={`${process.env.NEXT_PUBLIC_BASE_URL}/register/create-account?email=${hashedEmail}`}
              >
                Create Account
              </Button>
            </Section>
          </Container>
        </Tailwind>
      </Body>
    </Html>
  );
}
