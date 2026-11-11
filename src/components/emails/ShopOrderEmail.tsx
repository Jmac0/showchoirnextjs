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

import { formatPence, ShopOrderRow } from "../../lib/shopShared";

// Images come from the live site, so they show in every email (including
// ones sent from a preview or a dev machine)
const SITE = "https://www.show-choir.co.uk";

// Sent to a member when their kit shop order is paid for
// (lib/email/sendShopOrderEmails.ts) - what they ordered, which choir it's
// going to, and a link to "Your orders" to see how it's getting on
export function ShopOrderEmail({
  name,
  order,
}: {
  name: string;
  order: ShopOrderRow;
}) {
  return (
    <Html>
      <Preview>Thanks for your Show Choir kit order {order.reference}</Preview>
      <Head />
      <Body>
        <Tailwind>
          <Container className="mt-2 flex w-11/12 rounded-md border-2 border-yellow-600 bg-slate-100 p-3">
            <Section className="flex pt-3">
              <Img
                src={`${SITE}/logo.png`}
                alt="Show Choir Logo"
                width="150"
                height="150"
              />
              <Text className="font-bold text-gray-900">Hi {name}</Text>
            </Section>
            <Heading className="text-yellow-600">
              Thanks for your order!
            </Heading>
            <Text className="m-1 px-10 text-gray-900">
              We&apos;ve got your order <b>{order.reference}</b> and it&apos;s
              paid for. Everything is made to order, so it can take a few weeks
              - we&apos;ll bring it to your choir
              {order.venue ? ` (${order.venue})` : ""} when it&apos;s ready.
            </Text>
            <Section className="px-10">
              {order.items.map((item) => (
                <Text
                  key={`${item.product_id}-${item.size}`}
                  className="m-0 text-gray-900"
                >
                  {item.name}
                  {item.size ? ` (${item.size})` : ""} × {item.quantity} -{" "}
                  {formatPence(item.unit_pence * item.quantity)}
                </Text>
              ))}
              <Text className="font-bold text-gray-900">
                Total paid: {formatPence(order.total_pence)}
              </Text>
              {order.note && (
                <Text className="text-gray-900">Your note: {order.note}</Text>
              )}
            </Section>
            <Section className="mt-4 flex flex-row justify-center">
              <Button
                className="w-full rounded bg-yellow-600 p-3 text-center text-black"
                href={`${process.env.NEXT_PUBLIC_BASE_URL}/members/shop`}
              >
                See your orders
              </Button>
            </Section>
          </Container>
        </Tailwind>
      </Body>
    </Html>
  );
}
