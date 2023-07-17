import Link from "next/link";
import React from "react";
import ReactMarkdown from "react-markdown";

type Props = {
  markdown: string;
  navigateTo: string;
};

export const MembershipOptionInfo = ({ markdown, navigateTo }: Props) => (
  <div
    className="m-2 flex min-h-[700px] w-11/12 flex-col items-center justify-evenly rounded-md border-2
     border-lightGold p-2 pl-5 text-gray-50 md:w-5/12"
  >
    <ReactMarkdown>{markdown}</ReactMarkdown>

    <Link
      className="m-2 flex h-9 w-9/12 content-center items-center justify-center rounded-md border-2
       border-lightGold text-white hover:bg-lightGold hover:text-black"
      href={navigateTo}
    >
      Join the Fun
    </Link>
  </div>
);
