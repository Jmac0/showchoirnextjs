import { testApiHandler } from "next-test-api-route-handler";

import {
  MAX_SENDS_PER_HOUR,
  resetSpamCounts,
} from "@/src/lib/helpers/formSpamCheck";
import handleContactSubmission from "@/src/pages/api/handleContactSubmission";
import bookTasterSession from "@/src/pages/api/mailchimp/bookTasterSession";

// Stand-ins for the email and Mailchimp services, so we can see whether a
// submission got through
const mockSendEmail = jest.fn().mockResolvedValue({ id: "email-id" });
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({ sendEmail: mockSendEmail })),
}));
// The taster route also saves the booking - keep the tests off the database
jest.mock("../../lib/dbConnect", () => jest.fn().mockResolvedValue(undefined));
const mockSaveTasterBooking = jest.fn().mockResolvedValue(undefined);
jest.mock("../../lib/tasters", () => ({
  saveTasterBooking: (...args: unknown[]) => mockSaveTasterBooking(...args),
}));
const mockAddListMember = jest.fn().mockResolvedValue({});
jest.mock("@mailchimp/mailchimp_marketing", () => ({
  setConfig: jest.fn(),
  lists: {
    getListInterestCategories: jest.fn().mockResolvedValue({ categories: [] }),
    addListMember: (...args: unknown[]) => mockAddListMember(...args),
  },
}));

// A genuine-looking contact form send
const contact = {
  firstName: "Jane",
  lastName: "Smith",
  email: "jane@example.com",
  message: "Hello, when do you rehearse?",
  company: "",
  elapsed_ms: 20000,
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

describe("contact form spam checks", () => {
  it("sends a genuine message", async () => {
    await testApiHandler({
      handler: handleContactSubmission,
      test: async ({ fetch }) => {
        const res = await fetch(post(contact));
        expect(res.status).toBe(200);
        expect(mockSendEmail).toHaveBeenCalledTimes(1);
      },
    });
  });

  it.each([
    ["the hidden field is filled in", { company: "Acme" }],
    ["it was sent too quickly", { elapsed_ms: 500 }],
    ["it didn't come from the form", { elapsed_ms: undefined }],
  ])("pretends to send but doesn't when %s", async (_, change) => {
    await testApiHandler({
      handler: handleContactSubmission,
      test: async ({ fetch }) => {
        const res = await fetch(post({ ...contact, ...change }));
        expect(res.status).toBe(200);
        const { message } = await res.json();
        expect(message).toMatch(/has been sent/i);
        expect(mockSendEmail).not.toHaveBeenCalled();
      },
    });
  });

  it("refuses links in the message", async () => {
    await testApiHandler({
      handler: handleContactSubmission,
      test: async ({ fetch }) => {
        const res = await fetch(
          post({ ...contact, message: "Cheap SEO at https://spam.example" })
        );
        expect(res.status).toBe(400);
        const { message } = await res.json();
        expect(message).toMatch(/remove any links/i);
        expect(mockSendEmail).not.toHaveBeenCalled();
      },
    });
  });

  it("refuses an empty or very long message", async () => {
    await testApiHandler({
      handler: handleContactSubmission,
      test: async ({ fetch }) => {
        const empty = await fetch(post({ ...contact, message: "  " }));
        expect(empty.status).toBe(400);
        const long = await fetch(
          post({ ...contact, message: "a".repeat(5000) })
        );
        expect(long.status).toBe(400);
        expect(mockSendEmail).not.toHaveBeenCalled();
      },
    });
  });

  it("limits sends from one address", async () => {
    await testApiHandler({
      handler: handleContactSubmission,
      test: async ({ fetch }) => {
        for (let i = 0; i < MAX_SENDS_PER_HOUR; i += 1) {
          // eslint-disable-next-line no-await-in-loop
          expect((await fetch(post(contact))).status).toBe(200);
        }
        const res = await fetch(post(contact));
        expect(res.status).toBe(429);
        expect(mockSendEmail).toHaveBeenCalledTimes(MAX_SENDS_PER_HOUR);
      },
    });
  });
});

describe("taster form spam checks", () => {
  const taster = {
    firstName: "Jane",
    lastName: "Smith",
    email: "jane@example.com",
    location: "Dorking",
    company: "",
    elapsed_ms: 20000,
  };

  it("books a genuine taster", async () => {
    await testApiHandler({
      handler: bookTasterSession,
      test: async ({ fetch }) => {
        const res = await fetch(post(taster));
        expect(res.status).toBe(200);
        expect(mockAddListMember).toHaveBeenCalledTimes(1);
        expect(mockSaveTasterBooking).toHaveBeenCalledTimes(1);
      },
    });
  });

  it("pretends to book but doesn't when posted straight to the API", async () => {
    await testApiHandler({
      handler: bookTasterSession,
      test: async ({ fetch }) => {
        const res = await fetch(post({ ...taster, elapsed_ms: undefined }));
        expect(res.status).toBe(200);
        const { message } = await res.json();
        expect(message).toMatch(/booked/i);
        expect(mockAddListMember).not.toHaveBeenCalled();
        expect(mockSaveTasterBooking).not.toHaveBeenCalled();
      },
    });
  });

  it("refuses links in a name", async () => {
    await testApiHandler({
      handler: bookTasterSession,
      test: async ({ fetch }) => {
        const res = await fetch(
          post({ ...taster, firstName: "www.spam.example" })
        );
        expect(res.status).toBe(400);
        expect(mockAddListMember).not.toHaveBeenCalled();
      },
    });
  });
});
