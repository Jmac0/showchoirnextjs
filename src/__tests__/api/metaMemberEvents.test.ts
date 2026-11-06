import { sendMetaEvent } from "@/src/lib/metaConversions";
import {
  clearStaleMetaAttribution,
  tellMetaMemberJoined,
} from "@/src/lib/metaMemberEvents";
import Members from "@/src/lib/models/member";

jest.mock("../../lib/metaConversions", () => ({
  sendMetaEvent: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../../lib/models/member", () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    updateOne: jest.fn().mockResolvedValue({}),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 2 }),
  },
}));

const attribution = { fbp: "fb.1.1.1", consented_at: new Date() };
const memberFound = (member: unknown) =>
  (Members.findById as jest.Mock).mockReturnValue({
    select: () => ({ lean: async () => member }),
  });
const join = () =>
  tellMetaMemberJoined({
    memberId: "m1",
    eventName: "Purchase",
    eventId: "flexi-m1",
    valuePounds: 60,
  });

beforeEach(() => jest.clearAllMocks());

describe("tellMetaMemberJoined", () => {
  it("sends the event once, then forgets the details", async () => {
    memberFound({
      email: "a@b.c",
      age_confirm: true,
      meta_attribution: attribution,
    });
    await join();
    expect(sendMetaEvent).toHaveBeenCalledWith({
      eventName: "Purchase",
      eventId: "flexi-m1",
      valuePounds: 60,
      email: "a@b.c",
      attribution,
    });
    expect(Members.updateOne).toHaveBeenCalledWith(
      { _id: "m1" },
      { $unset: { meta_attribution: 1 } }
    );
  });

  it("sends nothing for anyone without saved consent", async () => {
    // Rejected cookies, invited or imported members, restarts, a repeat webhook
    memberFound({ email: "a@b.c", age_confirm: true });
    await join();
    expect(sendMetaEvent).not.toHaveBeenCalled();
    expect(Members.updateOne).not.toHaveBeenCalled();
  });

  it("sends nothing for anyone not confirmed as over 18", async () => {
    memberFound({
      email: "a@b.c",
      age_confirm: false,
      meta_attribution: attribution,
    });
    await join();
    expect(sendMetaEvent).not.toHaveBeenCalled();
    expect(Members.updateOne).toHaveBeenCalled();
  });

  it("never throws, so a payment webhook can't fail because of Meta", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    (Members.findById as jest.Mock).mockImplementation(() => {
      throw new Error("database down");
    });
    await expect(join()).resolves.toBeUndefined();
    consoleError.mockRestore();
  });
});

describe("clearStaleMetaAttribution", () => {
  it("clears unfinished sign-ups older than 30 days", async () => {
    await expect(clearStaleMetaAttribution()).resolves.toBe(2);
    const [filter, update] = (Members.updateMany as jest.Mock).mock.calls[0];
    const cutoff = filter["meta_attribution.consented_at"].$lt.getTime();
    const days = (Date.now() - cutoff) / (24 * 60 * 60 * 1000);
    expect(Math.round(days)).toBe(30);
    expect(update).toEqual({ $unset: { meta_attribution: 1 } });
  });
});
