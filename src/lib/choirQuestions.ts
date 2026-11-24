import { richTextLines, splitAddress } from "./structuredData";
import { choirName } from "./venues";

// The questions and answers on the choir pages (and the Walton page). Shown
// on the page and given to search engines and AI tools as FAQ data
// (faqJsonLd in lib/structuredData.ts), from the same list so the two always
// match.
//
// This file runs in the browser too, so it must not import server-only code.

export type Question = { question: string; answer: string };

// The same on every choir page: what people worry about before coming
export const GENERAL_QUESTIONS: Question[] = [
  {
    question: "I want to sing but I don't know if I can?",
    answer:
      "That's exactly why Show Choir was set up, to give everyone the chance to sing no matter how much or how little they've done before. Singing is all about practice, so come regularly and you'll be singing like a lark in no time!",
  },
  {
    question: "What if I come on my own and don't know anyone?",
    answer:
      "We're a very friendly bunch and we all remember our first rehearsal! You'll get a warm welcome from the choir and the leader, and you'll be so busy singing you'll forget to think about it.",
  },
  {
    question: "Do I have to perform?",
    answer:
      "No, performing is always optional. You can come along to rehearsals and never set foot on a stage. Although Show Choir is such a confidence booster that you might find your inner diva or divo, and we'll have to drag you off that stage!",
  },
  {
    question: "How do I learn all the songs?",
    answer:
      "We learn at rehearsals by ear and repetition. We also provide lyrics and recordings of all the songs for you to sing along to at home.",
  },
];

// £30, or £9.50 when there are pence
export const formatPounds = (pounds: number) =>
  `£${Number.isInteger(pounds) ? pounds : pounds.toFixed(2)}`;

type ChoirFacts = {
  location: string;
  choirDayOfWeek?: string;
  time?: string;
  address?: Parameters<typeof richTextLines>[0];
  parking?: string;
  // the monthly Direct Debit price, in pounds
  monthlyPrice: number;
  // a 10-session Flexi pack, in pounds (left out if not set)
  flexiPrice?: number;
};

// Questions answered from the choir's own details in Contentful - the facts
// people ask search engines and AI tools ("when does the Dorking choir
// meet?"), and text that no other choir page has. A question is left out when
// the choir doesn't have that detail yet
export function choirQuestions({
  location,
  choirDayOfWeek,
  time,
  address,
  parking,
  monthlyPrice,
  flexiPrice,
}: ChoirFacts): Question[] {
  const town = choirName(location);
  const questions: Question[] = [];

  if (choirDayOfWeek) {
    questions.push({
      question: `When does ${location} rehearse?`,
      answer: `Every ${choirDayOfWeek}${
        time ? `, ${time}` : ""
      }. Come along to a free taster session to see what it's like.`,
    });
  }

  const { placeName, streetAddress, postalCode } = splitAddress(
    richTextLines(address),
    town
  );
  const where = [placeName, streetAddress, town, postalCode].filter(Boolean);
  // just the town on its own isn't worth a question
  if (where.length > 1) {
    questions.push({
      question: `Where does ${location} meet?`,
      answer: `${where.join(", ")}.`,
    });
  }

  const parkingText = parking?.trim();
  if (parkingText) {
    questions.push({
      question: `Is there parking in ${town}?`,
      // Contentful's parking notes are written without a full stop
      answer: /[.!?]$/.test(parkingText) ? parkingText : `${parkingText}.`,
    });
  }

  questions.push({
    question: "How much does it cost?",
    answer: `Your first session is a free taster. After that, monthly membership is ${formatPounds(
      monthlyPrice
    )} a month by Direct Debit, and you can come to any of our choirs across Surrey at no extra cost.${
      flexiPrice
        ? ` Or there's Flexi: ${formatPounds(
            flexiPrice
          )} for 10 sessions, if you need to take lots of breaks.`
        : ""
    }`,
  });

  return questions;
}
