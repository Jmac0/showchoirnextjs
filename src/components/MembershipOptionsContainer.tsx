import React from "react";

import { MembershipOptionInfo } from "./MembershipOptionsInfo";

type Props = {
  flexiInfo: string;
  monthlyInfo: string;
};

export function MembershipOptionsContainer({ flexiInfo, monthlyInfo }: Props) {
  return (
    <section className="flex flex-col">
      <div className="flex flex-col flex-wrap items-center justify-center md:flex-row">
        <MembershipOptionInfo
          markdown={monthlyInfo}
          // navigateTo="/monthly-membership"  <- This needs to be put back in and the url below needs to be removed when
          // the goCardless integration is live
          navigateTo="https://pay.gocardless.com/AL0005KAGBVDB3"
          buttonText=" Join Monthly"
        />

        <MembershipOptionInfo
          markdown={flexiInfo}
          // navigateTo="flexi-membership" <- This needs to be put back in and the url below needs to be removed when
          // the Stripe integration is live
          buttonText="Join Flexi"
          navigateTo="https://www.showchoirstore.co.uk/products/advanced-payment-membership-option"
        />
      </div>
    </section>
  );
}
