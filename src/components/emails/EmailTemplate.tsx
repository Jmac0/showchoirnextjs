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
// Email component, sent to new members, with encrypted email, to setup a new account
type EmailTemplateProps = {
  name: string;
  email: string;
};
export function EmailTemplate({ name, email }: EmailTemplateProps) {
  const hashedEmail = encryptEmail(email);
  return (
    <Html>
      <Preview>{name} we are so glad to have you singing with us! 🎵 </Preview>;
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
              Welcome to the Show Choir Family
            </Heading>

            <Text className="rounded-m m-1 mt-3 p-3 px-10 text-gray-900">
              `Hi ipsum dolor sit amet, consectetur adipisicing elit. A
              aspernatur at aut eos ex odit rem, sed sint veritatis voluptatem.
              Aspernatur blanditiis corporis, distinctio impedit labore nisi
              ratione ullam voluptas?`
            </Text>
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
