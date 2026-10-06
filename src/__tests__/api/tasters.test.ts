/** @jest-environment node */
import { testApiHandler } from "next-test-api-route-handler";

// No real database or login
jest.mock("../../lib/models/tasterBooking", () => ({
  __esModule: true,
  default: {
    findOneAndUpdate: jest.fn(),
    updateOne: jest.fn(),
    findById: jest.fn(),
  },
}));
jest.mock("../../lib/email/sendTasterFollowUpEmail", () => ({
  sendTasterFollowUpEmail: jest.fn(),
}));
jest.mock("../../lib/auth/requireGA", () => ({ requireGA: jest.fn() }));

/* eslint-disable import/first */
import { requireGA } from "@/src/lib/auth/requireGA";
import { sendTasterFollowUpEmail } from "@/src/lib/email/sendTasterFollowUpEmail";
import TasterBookings from "@/src/lib/models/tasterBooking";
import { saveTasterBooking } from "@/src/lib/tasters";
import { ukDate } from "@/src/lib/ukDate";
import tasterCheckIn from "@/src/pages/api/member-resources/taster-check-in";
import tasterEmail from "@/src/pages/api/member-resources/taster-email";
/* eslint-enable import/first */

const bookings = TasterBookings as unknown as Record<string, jest.Mock>;
const BOOKING = "64b000000000000000000001";

const post = (body: object, handler: typeof tasterCheckIn = tasterCheckIn) =>
  new Promise<{ status: number; body: Record<string, string> }>((resolve) => {
    testApiHandler({
      handler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        resolve({ status: res.status, body: await res.json() });
      },
    });
  });

beforeEach(() => {
  jest.clearAllMocks();
  (requireGA as jest.Mock).mockResolvedValue({ _id: "ga1" });
});

describe("Taster bookings", () => {
  it("Should save a booking, updating an existing one for the same choir instead of adding another", async () => {
    await saveTasterBooking({
      firstName: " Tara ",
      lastName: "Taster",
      email: " Tara@Example.com ",
      location: "Dorking",
    });
    const [filter, update, options] = bookings.findOneAndUpdate.mock.calls[0];
    // Matches their existing not-yet-attended booking at this choir
    expect(filter.email).toBe("tara@example.com");
    expect(filter.attended_at).toBeNull();
    expect(filter.choir.test("dorking")).toBe(true);
    expect(update).toMatchObject({ first_name: "Tara", choir: "Dorking" });
    expect(options).toEqual({ upsert: true });
  });

  it("Should check someone in at today's rehearsal - once", async () => {
    bookings.findOneAndUpdate.mockResolvedValue({
      first_name: "Tara",
      last_name: "Taster",
    });
    const res = await post({ booking_id: BOOKING, venue: "dorking" });
    expect(res.status).toBe(200);
    const [filter, update] = bookings.findOneAndUpdate.mock.calls[0];
    // Only if they haven't come yet
    expect(filter.attended_at).toBeNull();
    expect(update).toMatchObject({
      attended_date: ukDate(),
      attended_venue: "dorking",
      checked_in_by: "ga1",
    });

    bookings.findOneAndUpdate.mockResolvedValue(null);
    expect((await post({ booking_id: BOOKING, venue: "dorking" })).status).toBe(
      409
    );
  });

  it("Should only undo today's check-ins", async () => {
    bookings.updateOne.mockResolvedValue({ modifiedCount: 1 });
    expect((await post({ booking_id: BOOKING, undo: true })).status).toBe(200);
    expect(bookings.updateOne.mock.calls[0][0]).toEqual({
      _id: BOOKING,
      attended_date: ukDate(),
    });

    bookings.updateOne.mockResolvedValue({ modifiedCount: 0 });
    expect((await post({ booking_id: BOOKING, undo: true })).status).toBe(404);
  });

  it("Should be GAs only", async () => {
    (requireGA as jest.Mock).mockImplementation(async (_req, res) => {
      res.status(403).json({ message: "Forbidden" });
      return null;
    });
    expect((await post({ booking_id: BOOKING, venue: "dorking" })).status).toBe(
      403
    );
    expect(bookings.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("Should only send the follow-up email once they've been checked in, and record it", async () => {
    bookings.findById.mockResolvedValue({ _id: BOOKING, first_name: "Toby" });
    const notYet = await post({ booking_id: BOOKING }, tasterEmail);
    expect(notYet.status).toBe(400);
    expect(sendTasterFollowUpEmail).not.toHaveBeenCalled();

    bookings.findById.mockResolvedValue({
      _id: BOOKING,
      first_name: "Tara",
      attended_at: new Date(),
    });
    const sent = await post({ booking_id: BOOKING }, tasterEmail);
    expect(sent.status).toBe(200);
    expect(sendTasterFollowUpEmail).toHaveBeenCalled();
    expect(bookings.updateOne.mock.calls[0][1]).toMatchObject({
      follow_up_by: "ga1",
      $inc: { follow_up_count: 1 },
    });
  });
});
