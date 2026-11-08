import Head from "next/head";
import React from "react";

import { faqJsonLd } from "../lib/structuredData";
import styles from "../styles/stage.module.css";
import { jsonLdScript } from "./JsonLd";

export const questions = [
  {
    question: "Do I have to audition or sing on my own?",
    answer:
      "Nope, there are no auditions, and you never have to sing on your own, it's all about being part of a group! However there are plenty of opportunities for those of you who do want to sing a solo or two!",
  },
  {
    question: "I want to sing but I don't know if I can?",
    answer:
      "Well that's exactly why Show Choir was set up in the first place, to give everyone the chance to sing no matter how much or little you've done before. Singing is all about practice, so if you come regularly you will be singing like a lark in no time!",
  },
  {
    question: "What if I come on my own and I don't know anyone?",
    answer:
      "Don't worry we are a very friendly bunch & we all remember our first rehearsal! So you'll get a warm welcome from the choir and the leader, & honestly you will be so busy singing you will forget to think about it! You are guaranteed to make some great new friends just by coming along.",
  },
  {
    question: "What usually happens at a rehearsal?",
    answer:
      "On your first visit we will get you some lyrics (we don't use sheet music) and get you settled in to a section that you are happy with. We always start with a few fun warmups, then it's onto some learning. We usually go through 4-5 songs, some you might know, some might be totally new but we all learn together - we like to keep it relaxed, it's supposed to be fun after all!",
  },
  {
    question: "Do I have to perform?",
    answer:
      "No, performing is always optional, you can just come along to rehearsals and never set foot on a stage. However Show Choir is such a confidence booster you might find your inner diva or divo and we'll have to drag you off that stage 😂",
  },
  {
    question: "How do I learn all the songs?",
    answer:
      "No problem, we learn at rehearsals by ear and repetition. We also provide lyrics and recordings of all the songs for you to sing along to at home. Learning songs is a fantastic workout for your brain 🧠 & doing it socially while having fun makes it even better!",
  },
];

// The common worries, each on a gold-edged card like the ones on the Walton
// page. Always open rather than click-to-reveal, as this page is here to
// answer them and people can read straight down it.
export default function TasterPageQuestions() {
  return (
    <section className="bg-black px-4 py-16 md:px-10 md:py-24">
      {/* the same questions as structured data, so AI tools can quote the
          answers - kept here so they always match what's shown */}
      <Head>{jsonLdScript(faqJsonLd(questions), "faq-jsonld")}</Head>
      <div className="mx-auto max-w-6xl">
        <h2
          className={`${styles.display} ${styles.sectionTitle} mb-12 text-center text-white`}
        >
          I know what you are{" "}
          <span className={styles.goldText}>thinking...</span>
        </h2>
        <div className="grid gap-5 md:grid-cols-2">
          {questions.map(({ question, answer }) => (
            <article
              key={question}
              className="rounded-2xl border-2 border-lightGold bg-lightBlack p-6 transition hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(222,204,120,0.45)] md:p-8"
            >
              <h3 className={`${styles.display} mb-3 text-3xl text-lightGold`}>
                {question}
              </h3>
              <p className="m-0 text-lg text-gray-100">{answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
