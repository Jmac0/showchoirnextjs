/** @jest-environment node */
import { testApiHandler } from "next-test-api-route-handler";

// No real database or login
jest.mock("../../lib/dbConnect", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../lib/models/holiday", () => ({
  __esModule: true,
  default: { find: jest.fn(), findOne: jest.fn(), create: jest.fn() },
}));
jest.mock("../../lib/auth/requireAdmin", () => ({ requireAdmin: jest.fn() }));

/* eslint-disable import/first */
import { requireAdmin } from "@/src/lib/auth/requireAdmin";
import { currentHoliday, isRealDate } from "@/src/lib/holidays";
import { formatHolidayDate, holidayMessage } from "@/src/lib/holidaysShared";
import Holidays from "@/src/lib/models/holiday";
import adminHolidays from "@/src/pages/api/admin/holidays";
/* eslint-enable import/first */

const holidays = Holidays as unknown as Record<string, jest.Mock>;

// A query that ends in .lean() (and maybe .sort() first)
const query = (result: unknown) => {
  const chain: { sort: jest.Mock; lean: jest.Mock } = {
    sort: jest.fn(() => chain),
    lean: jest.fn().mockResolvedValue(result),
  };
  return chain;
};

const post = (body: object) =>
  new Promise<{ status: number; body: Record<string, string> }>((resolve) => {
    testApiHandler({
      handler: adminHolidays,
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
  (requireAdmin as jest.Mock).mockResolvedValue({ _id: "admin1" });
  holidays.find.mockReturnValue(query([]));
});

describe("Holidays", () => {
  it("Should write the back date the way the banner says it", () => {
    expect(formatHolidayDate("2026-10-26")).toBe("Monday 26th October");
    expect(formatHolidayDate("2026-01-01")).toBe("Thursday 1st January");
    expect(formatHolidayDate("2026-12-22")).toBe("Tuesday 22nd December");
    expect(formatHolidayDate("2026-06-13")).toBe("Saturday 13th June");
    expect(holidayMessage("2026-10-26")).toBe(
      "We are on holiday until Monday 26th October"
    );
  });

  it("Should only accept real dates", () => {
    expect(isRealDate("2026-10-26")).toBe(true);
    expect(isRealDate("2028-02-29")).toBe(true);
    expect(isRealDate("2026-02-30")).toBe(false);
    expect(isRealDate("2026-13-01")).toBe(false);
    expect(isRealDate("26/10/2026")).toBe(false);
    expect(isRealDate({ $gt: "" })).toBe(false);
  });

  it("Should find a holiday that has started and not ended, from the first day off up to the day before the return", async () => {
    holidays.findOne.mockReturnValue(query({ back_on: "2026-10-26" }));
    expect(await currentHoliday("2026-10-19")).toEqual({
      back_on: "2026-10-26",
    });
    expect(holidays.findOne).toHaveBeenCalledWith({
      start: { $lte: "2026-10-19" },
      back_on: { $gt: "2026-10-19" },
    });
  });

  it("Should say there's no holiday when none is on", async () => {
    holidays.findOne.mockReturnValue(query(null));
    expect(await currentHoliday("2026-11-02")).toBeNull();
  });

  it("Should add a holiday", async () => {
    const res = await post({
      start: "2026-12-21",
      back_on: "2027-01-04",
      note: " Christmas ",
    });
    expect(res.status).toBe(201);
    expect(holidays.create).toHaveBeenCalledWith({
      start: "2026-12-21",
      back_on: "2027-01-04",
      note: "Christmas",
    });
  });

  it("Should refuse a return date that isn't after the first day off", async () => {
    const res = await post({ start: "2026-10-26", back_on: "2026-10-26" });
    expect(res.status).toBe(400);
    expect(holidays.create).not.toHaveBeenCalled();
  });

  it("Should refuse dates that aren't real dates", async () => {
    const res = await post({ start: "2026-02-30", back_on: { $gt: "" } });
    expect(res.status).toBe(400);
    expect(holidays.create).not.toHaveBeenCalled();
  });

  it("Should be for admins only", async () => {
    (requireAdmin as jest.Mock).mockImplementation(async (_req, res) => {
      res.status(403).json({ message: "Admins only" });
      return null;
    });
    const res = await post({ start: "2026-12-21", back_on: "2027-01-04" });
    expect(res.status).toBe(403);
    expect(holidays.create).not.toHaveBeenCalled();
  });
});
