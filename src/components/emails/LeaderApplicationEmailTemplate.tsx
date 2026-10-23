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

// Email to the admin inbox with a choir leader application
type EmailTemplateProps = {
  name: string;
  phone: string;
  email: string;
  town: string;
  postcode: string;
  experience: string;
};
export function LeaderApplicationEmailTemplate({
  name,
  phone,
  email,
  town,
  postcode,
  experience,
}: EmailTemplateProps) {
  return (
    <Html>
      <Preview>New choir leader application from {name}</Preview>
      <Head />
      <Body>
        <Tailwind>
          <Container>
            <Section className="pt-3">
              <Text className="font-bold">
                Choir leader application from: {name}
              </Text>
            </Section>
            <Text className="m-1 px-10 text-gray-900">Email: {email}</Text>
            <Text className="m-1 px-10 text-gray-900">Phone: {phone}</Text>
            <Text className="m-1 px-10 text-gray-900">
              Lives in: {town} ({postcode})
            </Text>
            <Text className="m-1 mt-3 px-10 font-bold">Experience</Text>
            {/* pre-wrap keeps the applicant's paragraphs */}
            <Text className="m-1 whitespace-pre-wrap px-10 text-gray-900">
              {experience}
            </Text>
          </Container>
        </Tailwind>
      </Body>
    </Html>
  );
}
