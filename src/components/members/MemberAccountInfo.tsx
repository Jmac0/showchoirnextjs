import React from "react";

type Props = {
  userData: {
    email?: string;
    flexi_sessions?: number;
    active_member?: boolean;
    active_mandate?: boolean;
    flexi_type?: string;
    membership_type?: string;
    first_name?: string;
  };
};

export function MemberAccountInfo({ userData = {} }: Props) {
  return (
    <section className="mx-10 my-10 flex flex-col items-center md:mx-20">
      <h1>Member Account Info</h1>
      <ul className="inner-shadow rounded-md bg-slate-600 p-16">
        <li>Membership type: {userData.membership_type}</li>
        {userData.membership_type === "Flexi" ? (
          <li>{`Flexi sessions remaining: ${userData.flexi_sessions}`}</li>
        ) : (
          ""
        )}
        <li>User email: {userData.email}</li>
      </ul>
    </section>
  );
}
