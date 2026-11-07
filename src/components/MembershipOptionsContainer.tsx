import React from "react";

import { MembershipOptionInfo } from "./MembershipOptionsInfo";

type Props = {
  flexiInfo: string;
  monthlyInfo: string;
};

export function MembershipOptionsContainer({ flexiInfo, monthlyInfo }: Props) {
  return (
    // A grid keeps the two cards the same height, side by side from tablet size
    <section className="mx-auto my-10 grid w-full max-w-5xl gap-6 px-4 md:grid-cols-2 md:px-10">
      <MembershipOptionInfo
        badge="Monthly membership"
        markdown={monthlyInfo}
        // navigateTo="/monthly-membership"  <- This needs to be put back in and the url below needs to be removed when
        // the goCardless integration is live
        navigateTo="https://pay.gocardless.com/AL0005KAGBVDB3"
        buttonText="Join Monthly"
      />

      <MembershipOptionInfo
        badge="Flexi membership"
        markdown={flexiInfo}
        // navigateTo="flexi-membership" <- This needs to be put back in and the url below needs to be removed when
        // the Stripe integration is live
        buttonText="Join Flexi"
        navigateTo="https://www.showchoirstore.co.uk/products/advanced-payment-membership-option"
      />
    </section>
  );
}
