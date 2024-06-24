import Image from "next/image";
import ReactMarkdown from "react-markdown";

import fringeSteps from "@/public/fringe-steps.jpg";
import oklahoma from "@/public/oklahoma.jpg";
import { blurData } from "@/src/lib/blurData";

import { ContentfulImageType } from "../types/types";
// pass in body text & relevant data fields from Contentful
type Props = {
  title: string;
  heroTextOne: string;
  whatToExpectTxt: string;
  feelGoodFactorTxt: string;
  mainImage: ContentfulImageType;
};

export function AboutComponentContainer({
  title,
  whatToExpectTxt,
  feelGoodFactorTxt,
  heroTextOne,
  mainImage,
}: Props) {
  return (
    <div className="mb-10 flex flex-col flex-wrap items-center justify-center">
      <h1 className="mb-5">{title}</h1>
      <div className="flex w-full flex-col-reverse bg-gradient-to-br from-lightBlack/75 to-black/75 md:flex-row">
        <section className="mb-5 px-2 md:mb-0 md:w-1/2 md:px-8 md:pt-8 ">
          {heroTextOne}
        </section>

        <Image
          className="h-[700px] w-full object-cover md:mb-0 md:w-1/2"
          width={750}
          height={550}
          alt={mainImage.fields.title ?? "Image of Show Choir leader"}
          src={`https:${mainImage.fields.file.url}`}
          priority
        />
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
