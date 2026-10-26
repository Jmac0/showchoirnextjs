import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useId, useState } from "react";

type Props = {
  question: string;
  answer: string;
};

// One FAQ item: the question is always shown, with a plus to its left;
// clicking it (or the plus) opens the answer underneath. The plus turns into
// a cross while open. Fills the width it's given - the page sets the width.
export default function QuestionAndAnswer({ question, answer }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  // links the button to the answer it opens, for screen readers
  const answerId = useId();

  return (
    <div className="w-full border-b border-lightGold/50 py-3">
      <h3 className="m-0 p-0">
        {/* the whole question is the button, not just the icon, so it's
            easy to tap on a phone */}
        <button
          type="button"
          className="flex w-full items-center gap-3 text-left hover:text-lightGold"
          aria-expanded={isOpen}
          aria-controls={answerId}
          onClick={() => setIsOpen((open) => !open)}
        >
          <FontAwesomeIcon
            className={`shrink-0 text-lightGold transition-transform ${
              isOpen ? "rotate-45" : ""
            }`}
            icon={faPlus}
          />
          {question}
        </button>
      </h3>
      {/* pre-line keeps any line breaks in the answer text */}
      <p
        id={answerId}
        hidden={!isOpen}
        className="whitespace-pre-line font-bold text-white"
      >
        {answer}
      </p>
    </div>
  );
}
