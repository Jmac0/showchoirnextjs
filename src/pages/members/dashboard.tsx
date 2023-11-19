/* eslint-disable react-hooks/exhaustive-deps */
import axios from "axios";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";

import { Lyrics } from "@/src/components/members/Lyrics";
import { MemberAccountInfo } from "@/src/components/members/MemberAccountInfo";
import { MemberNotifications } from "@/src/components/members/MemberNotifications";
import { MembershipCard } from "@/src/components/members/MembershipCard";
import MemberNav from "@/src/components/Navigation/MemberNav";
import { Nav } from "@/src/components/Navigation/Nav";
import { getPageData } from "@/src/lib/contentfulClient";
import { PageItemType, userDataType } from "@/src/types/types";

function Dashboard({ pathData }: PageItemType) {
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
  const [activeComponent, setActiveComponent] = useState<string>("Lyrics");
  const [userData, setUserData] = useState<userDataType>({
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
    }
    // If user is authenticated, get user data from DB
    if (session?.user.email) {
      axios
        .post(`/api/members/fetch-member`, {
          email: session.user.email,
        })
        .then((res) => {
          setUserData(res.data.member);
        })
        .catch((err) => {
          // Check the error type this will stop the error being set on rerender
          if (err.name !== "CanceledError") {
            throw new Error(err.message);
          }
        });
    }
  }, [session, status]);

  // only render logo and nav if not authenticated, stops flash load of Dashboard
  if (!session) {
    return (
      <div>
        <Nav pathData={pathData} />
      </div>
    );
  }
  const setComponent = (component: string) => {
    setActiveComponent(component);
  };
  // Functionality to print the membership card qr code

  return (
    <div className="flex h-screen w-full flex-row">
      <Head>
        <title>Dashboard</title>
        <meta
          name="create account"
          content="Show Choir Surrey's premier musical theatre choir"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <MemberNav setComponent={setComponent} />
      <section
        className="mt-10 flex h-full w-screen justify-center
        "
      >
        {/* <p className="self-center justify-self-center">
          {`Welcome ${session && session.user.name}`}
        </p> */}
        {/* Switch visible component based on state */}
        {activeComponent === "Lyrics" && <Lyrics />}
        {activeComponent === "Notifications" && <MemberNotifications />}
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
export async function getServerSideProps() {
  /* get paths for each page from Contentful */

  const res = await getPageData();

  // await dbConnect();
  // const user =  await Members.findOne({session.user.email })
  const { items } = res;
  const pathData = items.map(
    (item: {
      fields: { slug: string; displayText: string; order: number };
    }) => ({
      slug: item.fields.slug,
      displayText: item.fields.displayText,
      order: item.fields.order,
    })
  );

  return { props: { pathData } };
}
export default Dashboard;
