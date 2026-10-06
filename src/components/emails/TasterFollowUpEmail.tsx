import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import React from "react";

// Follow-up email to someone who came (or booked) a free taster session -
// sent by a GA from the app's "Taster bookings" screen
// (api/member-resources/taster-email.ts). "It was great to meet you - here's
// how to join".
//
// ✏️ The wording marked "TO WRITE" is a placeholder - change the text here.
// Their name and choir are filled in automatically.

// Images come from the live site (emails can't load from localhost)
const SITE = "https://www.show-choir.co.uk";

type Props = {
  firstName: string;
  // The choir they booked, e.g. "Dorking"
  choir: string;
  // Where "Join Show Choir" goes - the monthly membership sign-up
  joinUrl: string;
};

// A gold tick and a line of text, for the "what you get" list
function Benefit({ children }: { children: React.ReactNode }) {
  return (
    <Row className="mb-2">
      <Column className="w-8 align-top text-lg font-bold text-yellow-600">
        ✓
      </Column>
      <Column>
        <Text className="m-0 text-base text-gray-800">{children}</Text>
      </Column>
    </Row>
  );
}

export function TasterFollowUpEmail({ firstName, choir, joinUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>
        {firstName}, it was great to meet you at Show Choir {choir}! 🎵
      </Preview>
      <Tailwind>
        <Body className="font-sans bg-gray-100 py-6">
          <Container className="mx-auto max-w-xl overflow-hidden rounded-xl border-2 border-solid border-yellow-600 bg-white">
            {/* --- Black banner with the logo --- */}
            <Section className="bg-black px-6 py-6 text-center">
              <Img
                src={`${SITE}/logo.png`}
                alt="Show Choir"
                width="120"
                height="120"
                className="mx-auto"
              />
            </Section>

            {/* --- Gold strip --- */}
            <Section className="bg-yellow-600 px-6 py-3 text-center">
              <Text className="m-0 text-sm font-bold uppercase tracking-widest text-black">
                Show Choir {choir}
              </Text>
            </Section>

            {/* --- Welcome --- */}
            <Section className="px-8 pt-6">
              <Heading className="mb-2 text-2xl font-bold text-gray-900">
                It was great to meet you, {firstName}!
              </Heading>
              {/* TO WRITE: opening paragraph */}
              <Text className="text-base leading-6 text-gray-800">
                Thank you for coming along to your free taster session at Show
                Choir {choir}. We hope you enjoyed singing with us as much as we
                enjoyed having you there.
              </Text>
              {/* TO WRITE: second paragraph */}
              <Text className="text-base leading-6 text-gray-800">
                If you&apos;d like to keep singing, joining is easy - and you
                can come along to any of our choirs, any week.
              </Text>
            </Section>

            {/* --- What membership includes --- */}
            <Section className="mx-8 my-4 rounded-lg bg-gray-50 px-6 py-4">
              <Text className="mb-3 mt-0 text-lg font-bold text-gray-900">
                As a member you get
              </Text>
              {/* TO WRITE: change or add benefits */}
              <Benefit>Any choir, any week - Banstead to West Byfleet</Benefit>
              <Benefit>All the music and lyrics in the Show Choir app</Benefit>
              <Benefit>Your membership card on your phone</Benefit>
              <Benefit>A friendly, no-audition choir family</Benefit>
            </Section>

            {/* --- Join button --- */}
            <Section className="px-8 py-4 text-center">
              {/* TO WRITE: price line, e.g. "Just £30 a month" */}
              <Text className="mb-4 mt-0 text-base text-gray-800">
                Monthly membership by Direct Debit - set up in a couple of
                minutes.
              </Text>
              <Button
                href={joinUrl}
                className="rounded-lg bg-yellow-600 px-8 py-4 text-lg font-bold text-black"
              >
                Join Show Choir
              </Button>
            </Section>

            {/* --- Sign-off with Ange's signature --- */}
            <Section className="px-8 pb-6 pt-2">
              {/* TO WRITE: closing line */}
              <Text className="text-base leading-6 text-gray-800">
                Any questions, just reply to this email. I&apos;d love to see
                you again soon!
              </Text>
              <Img
                src={`${SITE}/signature.png`}
                alt="Ange"
                width="120"
                className="mt-2"
              />
            </Section>

            <Hr className="mx-8 border-gray-200" />
            <Section className="px-8 pb-6">
              <Text className="m-0 text-center text-xs text-gray-500">
                Show Choir · Surrey&apos;s musical theatre choir ·{" "}
                <a href={SITE} className="text-yellow-700">
                  show-choir.co.uk
                </a>
              </Text>
              <Text className="m-0 mt-1 text-center text-xs text-gray-400">
                You&apos;re getting this because you booked a free taster
                session with us.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
