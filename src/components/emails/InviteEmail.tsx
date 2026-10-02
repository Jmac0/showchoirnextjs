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

// Email to an existing Direct Debit member, inviting them to create their
// website/app account (sent from the "DD members" admin page). Same look as
// the welcome email (EmailTemplate.tsx). The button's link carries their
// email, encrypted, so only they can use it - it opens
// pages/register/welcome.tsx.
type InviteEmailProps = {
  name: string;
  email: string;
};
export function InviteEmail({ name, email }: InviteEmailProps) {
  const hashedEmail = encryptEmail(email);
  return (
    <Html>
      <Preview>
        {name}, your Show Choir membership card is ready to set up 🎵
      </Preview>
      <Head />
      <Body>
        <Tailwind>
          <Container className="mt-2  flex w-11/12 rounded-md border-2 border-yellow-600 bg-slate-100 p-3">
            <Section className="flex pt-3 ">
              <Img
                src="https://showchoirnextjs.vercel.app/logo.png"
                alt="Show Choir Logo"
                width="150"
                height="150"
              />
              <Text className="font-bold text-gray-900">Hi {name}</Text>
            </Section>
            <Heading className="text-yellow-600">
              Show Choir is going digital!
            </Heading>

            <Text className="m-1 mt-3 px-10 text-gray-900">
              No more signing in on paper - you can now check in at choir with a
              membership card on your phone, and find all the music and lyrics
              for the songs we&apos;re learning in one place.
            </Text>
            <Text className="m-1 px-10 text-gray-900">
              You already pay by Direct Debit, and nothing changes there - you
              don&apos;t need to pay or set anything up again. Just click the
              button below, check your details, choose your home choir and a
              password, and you&apos;re all set.
            </Text>
            <Text className="m-1 px-10 text-gray-900">
              Then show your membership card at the door next time you come
              along. See you soon!
            </Text>
            <Section className="mt-4 flex flex-row justify-center">
              <Button
                className="w-full rounded bg-yellow-600 p-3 text-center text-black"
                href={`${process.env.NEXT_PUBLIC_BASE_URL}/register/welcome?token=${hashedEmail}`}
              >
                Set Up My Account
              </Button>
            </Section>
          </Container>
        </Tailwind>
      </Body>
    </Html>
  );
}
