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
          navigateTo="/monthly-membership"
          buttonText="Join Month"
        />

        <MembershipOptionInfo
          markdown={flexiInfo}
          navigateTo="flexi-membership"
          buttonText="Join Flexi"
          // navigateTo="https://www.showchoirstore.co.uk/products/advanced-payment-membership-option"
        />
      </div>
    </section>
  );
}
