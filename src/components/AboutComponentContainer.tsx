import Image from "next/image";
import ReactMarkdown from "react-markdown";

import fringeSteps from "@/public/fringe-steps.jpg";
import oklahoma from "@/public/oklahoma.jpg";
import { blurData } from "@/src/lib/blurData";
// pass in body text & relevant data fields from Contentful
type Props = {
  title: string;
  bodyTxt: string;
  whatToExpectTxt: string;
  feelGoodFactorTxt: string;
};

export function AboutComponentContainer({
  title,
  whatToExpectTxt,
  feelGoodFactorTxt,
  bodyTxt,
}: Props) {
  return (
    <div className="flex flex-col flex-wrap items-center justify-center">
      <h1 className="mb-5">{title}</h1>
      <div className="mb-6 flex w-full flex-col px-2 md:flex-row md:space-x-11 md:pl-16">
        {bodyTxt}
      </div>
      <section className="flex w-full flex-col rounded-md bg-gradient-to-br from-lightBlack/75 to-black/75 p-0 md:flex-row">
        <Image
          priority
          placeholder="blur"
          // tiny base64 image in code as placeholder for larger image
          blurDataURL={blurData.fringeSteps}
          src={fringeSteps}
          alt="show choir on theatre steps"
          className="mb-5 mt-6 h-[700px] object-cover md:mb-0 md:w-1/2"
        />
        <ReactMarkdown className="space mb-5 px-2 md:mb-0  md:w-1/2 md:px-16 lg:mt-28">
          {whatToExpectTxt}
        </ReactMarkdown>
      </section>

      <section className="flex w-full flex-col rounded-md bg-gradient-to-br from-lightBlack/75 to-black/75 p-0 md:flex-row">
        <ReactMarkdown className="space order-2 px-2 md:order-1 md:w-1/2 md:px-16 lg:mt-28">
          {feelGoodFactorTxt}
        </ReactMarkdown>
        <Image
          alt="show choir on stage"
          placeholder="blur"
          // tiny base64 image in code as placeholder for larger image
          blurDataURL={blurData.choirOnStage}
          src={oklahoma}
          priority
          className="order-1 h-[700px] object-cover md:order-2 md:w-1/2"
        />
      </section>
    </div>
  );
}
