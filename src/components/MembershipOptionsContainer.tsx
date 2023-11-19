import React from "react";

import { MembershipOptionInfo } from "./MembershipOptionsInfo";

type Props = {
  bodyTxt: string;
  flexiInfo: string;
  monthlyInfo: string;
};

export function MembershipOptionsContainer({
  bodyTxt,
  flexiInfo,
  monthlyInfo,
}: Props) {
  return (
    <section className="flex flex-col">
      {/* <h1>{title}</h1> */}
      <div className="mb-6 self-center text-center">{bodyTxt}</div>
      <div className="flex flex-col flex-wrap items-center justify-center md:flex-row">
        <MembershipOptionInfo
          markdown={monthlyInfo}
          navigateTo="/monthly-membership"
          buttonText=" Join Monthly"
        />

        <MembershipOptionInfo
          markdown={flexiInfo}
          navigateTo="flexi-membership"
          buttonText="Join Flexi"
        />
      </div>
    </section>
  );
}
