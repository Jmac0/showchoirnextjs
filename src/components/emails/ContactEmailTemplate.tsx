import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import React from "react";

// Email component, sent to new members, with encrypted email, to setup a new account
type EmailTemplateProps = {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
};
export function ContactEmailTemplate({
  firstName,
  lastName,
  email,
  message,
}: EmailTemplateProps) {
  return (
    <Html>
      <Preview>New contact form submission from SC</Preview>;
      <Head />
      <Body>
        <Tailwind>
          <Container className="">
            <Section className="flex pt-3 ">
              <Text className="text-gra font-bold">
                Message from: {firstName} {lastName}
              </Text>
            </Section>
            <Text className="rounded-m m-1 mt-3 p-3 px-10 text-gray-900">
              {email}
            </Text>

            <Text className="rounded-m m-1 mt-3 p-3 px-10 text-gray-900">
              {message}
            </Text>
          </Container>
        </Tailwind>
      </Body>
    </Html>
  );
}
