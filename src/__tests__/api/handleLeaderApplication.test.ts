import { testApiHandler } from "next-test-api-route-handler";

import { resetSpamCounts } from "@/src/lib/helpers/formSpamCheck";
import { postcodeArea } from "@/src/lib/helpers/leaderApplicationShared";
import handleLeaderApplication from "@/src/pages/api/handleLeaderApplication";

// Stand-in for the email service, so we can see whether an application got
// through and what was sent
const mockSendEmail = jest.fn().mockResolvedValue({ id: "email-id" });
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({ sendEmail: mockSendEmail })),
}));

// A genuine-looking application
const application = {
  name: "Jane Smith",
  phone: "07700 900123",
  email: "Jane@Example.com ",
  town: "Walton-on-Thames",
  postcode: "KT12 1AB",
  canDrive: true,
  experience:
    "I have led a community choir for six years and teach singing at a local stage school.",
  motivation: "Bringing people together through musical theatre.",
  questions: "",
  company: "",
  elapsed_ms: 60000,
};

const post = (body: object) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

beforeEach(() => {
  jest.clearAllMocks();
  resetSpamCounts();
});

describe("choir leader application", () => {
  it("emails a genuine application, replying to the applicant", async () => {
    await testApiHandler({
      handler: handleLeaderApplication,
      test: async ({ fetch }) => {
        const res = await fetch(post(application));
        expect(res.status).toBe(200);
        expect(mockSendEmail).toHaveBeenCalledTimes(1);
        const sent = mockSendEmail.mock.calls[0][0];
        expect(sent.reply_to).toBe("jane@example.com");
      },
    });
  });

  it("accepts an application with no questions field at all", async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { questions, ...withoutQuestions } = application;
    await testApiHandler({
      handler: handleLeaderApplication,
      test: async ({ fetch }) => {
        const res = await fetch(post(withoutQuestions));
        expect(res.status).toBe(200);
        expect(mockSendEmail).toHaveBeenCalledTimes(1);
      },
    });
  });

  it.each([
    ["the hidden field is filled in", { company: "Acme" }],
    ["it was sent too quickly", { elapsed_ms: 500 }],
  ])("pretends to succeed but sends nothing when %s", async (_, change) => {
    await testApiHandler({
      handler: handleLeaderApplication,
      test: async ({ fetch }) => {
        const res = await fetch(post({ ...application, ...change }));
        expect(res.status).toBe(200);
        expect(mockSendEmail).not.toHaveBeenCalled();
      },
    });
  });

  it.each([
    [
      "a link in the experience",
      { experience: `${application.experience} https://spam.example` },
    ],
    ["a missing field", { phone: undefined }],
    ["a field that isn't text", { name: { $ne: "" } }],
    ["a non-UK phone number", { phone: "12345" }],
    ["a bad email", { email: "not-an-email" }],
    ["a .ru email", { email: "jane@example.ru" }],
    ["a bad postcode", { postcode: "Surrey" }],
    ["too little experience", { experience: "I sing" }],
    ["no answer about the role", { motivation: "  " }],
    ["a car answer that isn't yes/no", { canDrive: "yes" }],
    ["a missing car answer", { canDrive: undefined }],
    ["a link in a question", { questions: "see www.spam.example" }],
    ["an over-long answer", { motivation: "a".repeat(2001) }],
  ])("refuses %s", async (_, change) => {
    await testApiHandler({
      handler: handleLeaderApplication,
      test: async ({ fetch }) => {
        const res = await fetch(post({ ...application, ...change }));
        expect(res.status).toBe(400);
        expect(mockSendEmail).not.toHaveBeenCalled();
      },
    });
  });

  it("keeps only the first part of the postcode", () => {
    expect(postcodeArea(" kt12 1ab ")).toBe("KT12");
    expect(postcodeArea("KT121AB")).toBe("KT12");
    expect(postcodeArea("SW1A")).toBe("SW1A");
  });

  it("refuses anything but POST", async () => {
    await testApiHandler({
      handler: handleLeaderApplication,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" });
        expect(res.status).toBe(405);
      },
    });
  });
});
