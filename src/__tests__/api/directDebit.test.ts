/** @jest-environment node */
import {
  DD_GRACE_DAYS,
  directDebitNotice,
  hasActiveDirectDebit,
  isInGracePeriod,
  isMembershipCardActive,
} from "@/src/lib/directDebit";

const DAY = 24 * 60 * 60 * 1000;
const now = new Date("2026-10-20T12:00:00Z");
const endedDaysAgo = (days: number) => ({
  active_mandate: false,
  direct_debit_ended: {
    at: new Date(now.getTime() - days * DAY),
    event: "cancelled",
    cause: "mandate_cancelled",
    description: "The mandate was cancelled at your customer's request.",
  },
});

describe("Direct Debit grace period", () => {
  it("Should count an active Direct Debit as active, with no notice", () => {
    const member = { active_mandate: true };
    expect(hasActiveDirectDebit(member, now)).toBe(true);
    expect(isInGracePeriod(member, now)).toBe(false);
    expect(directDebitNotice(member, now)).toBeNull();
  });

  it(`Should keep the membership active for ${DD_GRACE_DAYS} days after it stops`, () => {
    const member = endedDaysAgo(3);
    expect(hasActiveDirectDebit(member, now)).toBe(true);
    expect(isInGracePeriod(member, now)).toBe(true);

    const notice = directDebitNotice(member, now);
    expect(notice).toMatchObject({
      in_grace_period: true,
      what_happened: "cancelled",
      reason: "The mandate was cancelled at your customer's request.",
    });
    // Grace ends 14 days after it stopped (11 days from "now")
    expect(new Date(notice?.grace_ends_at ?? 0).getTime()).toBe(
      now.getTime() + 11 * DAY
    );
  });

  it("Should end the membership once the grace period is over, but still show the notice", () => {
    const member = endedDaysAgo(15);
    expect(hasActiveDirectDebit(member, now)).toBe(false);
    expect(isInGracePeriod(member, now)).toBe(false);
    expect(directDebitNotice(member, now)?.in_grace_period).toBe(false);
  });

  it("Should not count a Direct Debit that was never set up", () => {
    const member = { active_mandate: false };
    expect(hasActiveDirectDebit(member, now)).toBe(false);
    expect(directDebitNotice(member, now)).toBeNull();
  });

  it("Should ignore an old ended record once a new Direct Debit is active", () => {
    const member = { ...endedDaysAgo(30), active_mandate: true };
    expect(hasActiveDirectDebit(member, now)).toBe(true);
    expect(directDebitNotice(member, now)).toBeNull();
  });
});

describe("Membership card (QR code)", () => {
  it("Should show it during the grace period and hide it after", () => {
    expect(
      isMembershipCardActive({ ...endedDaysAgo(3), membership_type: "DD" }, now)
    ).toBe(true);
    expect(
      isMembershipCardActive(
        { ...endedDaysAgo(15), membership_type: "DD" },
        now
      )
    ).toBe(false);
  });

  it("Should hide it for a Direct Debit that was never set up, but always show it for Flexi members and GAs", () => {
    expect(
      isMembershipCardActive(
        { membership_type: "DD", active_mandate: false },
        now
      )
    ).toBe(false);
    expect(
      isMembershipCardActive(
        { membership_type: "flexi", active_mandate: false },
        now
      )
    ).toBe(true);
    expect(
      isMembershipCardActive(
        { ...endedDaysAgo(30), membership_type: "DD", role: "ga" },
        now
      )
    ).toBe(true);
  });
});
