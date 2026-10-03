/** @jest-environment node */
import {
  flexiExpiresAt,
  flexiExpiryNotice,
  parseDay,
} from "@/src/lib/flexiExpiry";

const day = (text: string) => parseDay(text) as Date;

describe("Flexi session expiry", () => {
  const startsFrom = day("2027-01-01");

  it("Should read the date formats members and check-ins are saved in", () => {
    const expected = new Date(Date.UTC(2026, 2, 14, 12)).getTime();
    expect(parseDay("2026-03-14")?.getTime()).toBe(expected);
    expect(parseDay("14-03-2026")?.getTime()).toBe(expected);
    expect(parseDay("14/03/2026")?.getTime()).toBe(expected);
    expect(parseDay("")).toBeNull();
    expect(parseDay("soon")).toBeNull();
  });

  it("Should expire 6 months after their last check-in", () => {
    const expires = flexiExpiresAt(
      day("2027-03-10"),
      day("2025-01-01"),
      startsFrom
    );
    expect(expires?.toISOString().slice(0, 10)).toBe("2027-09-10");
  });

  it("Should use the date they joined if they've never checked in", () => {
    const expires = flexiExpiresAt(null, day("2027-02-01"), startsFrom);
    expect(expires?.toISOString().slice(0, 10)).toBe("2027-08-01");
  });

  it("Should never expire before the start date, however long ago they came", () => {
    const expires = flexiExpiresAt(day("2025-05-01"), null, startsFrom);
    expect(expires?.toISOString().slice(0, 10)).toBe("2027-01-01");
    expect(flexiExpiresAt(null, null, startsFrom)?.getTime()).toBe(
      startsFrom.getTime()
    );
  });

  it("Should not expire anyone when there's no start date", () => {
    expect(flexiExpiresAt(day("2020-01-01"), null, null)).toBeNull();
  });

  it("Should warn them from a month before", () => {
    const expires = day("2027-09-10");
    expect(flexiExpiryNotice(expires, day("2027-08-01")).in_warning).toBe(
      false
    );
    expect(flexiExpiryNotice(expires, day("2027-08-15")).in_warning).toBe(true);
  });
});
