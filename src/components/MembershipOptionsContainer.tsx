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
          //the goCardless integration is live
          navigateTo="https://pay.gocardless.com/billing/static/collect-customer-details?id=BRF01KZ6H5VQZ1AN02V8R8GBRP21V77N&initial=%2Fcollect-customer-details"
          buttonText=" Join Monthly"
        />

        <MembershipOptionInfo
          markdown={flexiInfo}
          // navigateTo="flexi-membership" <- This needs to be put back in and the url below needs to be removed when
          //the Stripe integration is live
          buttonText="Join Flexi"
          navigateTo="https://www.showchoirstore.co.uk/products/advanced-payment-membership-option"
        />
      </div>
    </section>
  );
}
