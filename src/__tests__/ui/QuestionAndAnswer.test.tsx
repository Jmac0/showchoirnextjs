import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import QuestionAndAnswer from "@/src/components/QuestionAndAnswer";

describe("Question and answer (FAQ item)", () => {
  it("shows the question with the answer hidden, and opens and closes on click", async () => {
    const user = userEvent.setup();
    render(
      <QuestionAndAnswer question="What's the pay?" answer="£85 per session" />
    );
    const question = screen.getByRole("button", { name: "What's the pay?" });
    expect(question).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("£85 per session")).not.toBeVisible();

    await user.click(question);
    expect(question).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("£85 per session")).toBeVisible();

    await user.click(question);
    expect(screen.getByText("£85 per session")).not.toBeVisible();
  });
});
