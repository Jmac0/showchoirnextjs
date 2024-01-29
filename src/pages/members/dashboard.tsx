/* eslint-disable react-hooks/exhaustive-deps */
/* eslint camelcase: ["warn", {properties: "never"}] */
import type { GetServerSidePropsContext } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { getServerSession } from "next-auth/next";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";

import { Lyrics } from "@/src/components/members/Lyrics";
import { MemberAccountInfo } from "@/src/components/members/MemberAccountInfo";
import { MemberNotifications } from "@/src/components/members/MemberNotifications";
import { MembershipCard } from "@/src/components/members/MembershipCard";
import MemberNav from "@/src/components/Navigation/MemberNav";
import { getNotificationData } from "@/src/lib/contentfulClient";
import dbConnect from "@/src/lib/dbConnect";
import { authOptions } from "@/src/pages/api/auth/[...nextauth]";
import type { DashboardPropsType } from "@/src/types/types";
import { UserDataType } from "@/src/types/types";

import Members from "../../lib/models/member";

export default function Dashboard({ user, notifications }: DashboardPropsType) {
  // function to print QR code
  const handlePrint = () => {
    const content = document.getElementById("code");
    if (!content) {
      throw new Error("Element with ID 'code' not found.");
    }
    const iframe = document.createElement("iframe");
    iframe.setAttribute("style", "height: 0px; width: 0px; position: absolute");

    document.body.appendChild(iframe);
    const iframeWindow = iframe.contentWindow;

    if (!iframeWindow) {
      throw new Error("Failed to create the iframe's content window.");
    }

    iframeWindow.document.open();
    iframeWindow.document.write(content.innerHTML);
    iframeWindow.document.close();
    iframeWindow.focus();
    iframeWindow.print();
  };

  // state for controlling viability of component
  const [activeComponent, setActiveComponent] =
    useState<string>("Notifications");
  const [userData, setUserData] = useState<UserDataType>({
    email: "",
    flexi_sessions: 0,
    active_member: false,
    active_mandate: false,
    flexi_type: "",
    membership_type: "",
    first_name: "",
  });
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // redirect to login if not authenticated
    if (status === "unauthenticated" && !session) {
      router.replace("/auth/signin");
    } else if (user) {
      setUserData(user);
    }
  }, [session, status]);
  // Render empty div as there is a very short flash when redirecting if no session.
  if (!session) {
    return <div className="h-screen w-full content-center justify-center" />;
  }
  const setComponent = (component: string) => {
    setActiveComponent(component);
  };

  return (
    <div className="m-0 flex w-full p-0">
      <Head>
        <title>Dashboard</title>
        <meta
          name="member dashboard"
          content="Show Choir Surrey's premier musical theatre choir"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <MemberNav setComponent={setComponent} />
      <section
        className="mt-10 flex h-full w-full justify-center
        "
      >
        {/* <p className="self-center justify-self-center">
          {`Welcome ${session && session.user.name}`}
        </p> */}
        {/* Switch visible component based on state */}
        {activeComponent === "Lyrics" && <Lyrics />}
        {activeComponent === "Notifications" && (
          <MemberNotifications notifications={notifications} />
        )}
        {activeComponent === "Account" && (
          <MemberAccountInfo userData={userData} />
        )}
        {activeComponent === "Membership Card" && (
          <MembershipCard handlePrint={handlePrint} email={userData.email} />
        )}
      </section>
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  let user = {};

  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) {
    return {
      redirect: {
        destination: "/auth/signin",
        permanent: false,
      },
    };
  }
  await dbConnect();
  const {
    user: { email },
  } = session;
  // get user data on server side from DB
  await Members.findOne({ email })
    .then((res) => {
      user = {
        email,
        active_member: res.active_member,
        flexi_sessions: res.flexi_sessions,
        flexi_type: res.flexi_type,
        active_mandate: res.active_mandate,
        first_name: res.first_name,
        membership_type: res.membership_type,
      };
    })
    .catch((err) => {
      const errorMessage = { message: err.message };
      // eslint-disable-next-line no-console
      console.error(`💥${errorMessage.message}`);
    });
  // sort notifications first by date then pinned status
  const notifications = await getNotificationData();
  notifications.items.sort((a, b) => (a.fields.date > b.fields.date ? +1 : -1));
  notifications.items.sort((a, b) =>
    a.fields.pinned > b.fields.pinned ? -1 : +1
  );

  return { props: { user, notifications } };
}
