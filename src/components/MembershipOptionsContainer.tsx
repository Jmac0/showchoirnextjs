import React from "react";

import { MembershipOptionInfo } from "./MembershipOptionsInfo";

type Props = {
  flexiInfo: string;
  monthlyInfo: string;
};

export function MembershipOptionsContainer({ flexiInfo, monthlyInfo }: Props) {
  return (
    <div className="flex flex-col flex-wrap items-center justify-center md:flex-row">
      <MembershipOptionInfo
        markdown={monthlyInfo}
        navigateTo="/monthly-membership"
        buttonText=" Join Monthly"
      />

      <MembershipOptionInfo
        markdown={flexiInfo}
        navigateTo="*"
        buttonText="Join Flexi"
      />
    </div>
  );
}
