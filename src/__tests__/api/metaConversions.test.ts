/**
 * @jest-environment node
 */
import { createHash } from "crypto";
import type { NextApiRequest } from "next";

import {
  attributionFromRequest,
  sendMetaEvent,
} from "@/src/lib/metaConversions";

const request = (body: unknown) =>
  ({
    body,
    headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8", "user-agent": "Safari" },
    socket: {},
  } as unknown as NextApiRequest);

const attribution = { fbp: "fb.1.1.1", consented_at: new Date() };
const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset().mockResolvedValue({ ok: true });
  global.fetch = fetchMock;
  process.env.NEXT_PUBLIC_META_PIXEL_ID = "123";
  process.env.META_CAPI_TOKEN = "secret";
  delete process.env.META_TEST_EVENT_CODE;
});

describe("attributionFromRequest", () => {
  it.each([
    [undefined],
    [{}],
    [{ metaConsent: false }],
    [{ metaConsent: "1" }],
  ])("gives nothing without consent: %j", (body) => {
    expect(attributionFromRequest(request(body))).toBeUndefined();
  });

  it("keeps what helps Meta match them, after consent", () => {
    expect(
      attributionFromRequest(
        request({ metaConsent: true, fbp: "fb.1.1.1", fbc: "fb.1.1.abc" })
      )
    ).toMatchObject({
      fbp: "fb.1.1.1",
      fbc: "fb.1.1.abc",
      ip: "1.2.3.4",
      user_agent: "Safari",
    });
  });

  it("drops anything from the address after the page, and non-web links", () => {
    const fromUrl = (sourceUrl: string) =>
      attributionFromRequest(request({ metaConsent: true, sourceUrl }))
        ?.source_url;
    expect(fromUrl("https://www.show-choir.co.uk/walton?email=a@b.c")).toBe(
      "https://www.show-choir.co.uk/walton"
    );
    expect(fromUrl("ftp://example.com/file")).toBeUndefined();
  });

  it("ignores values that aren't short text", () => {
    expect(
      attributionFromRequest(
        request({ metaConsent: true, fbp: { $ne: 1 }, fbc: "x".repeat(501) })
      )
    ).toMatchObject({ fbp: undefined, fbc: undefined });
  });
});

describe("sendMetaEvent", () => {
  it("does nothing until it's set up", async () => {
    delete process.env.META_CAPI_TOKEN;
    await sendMetaEvent({ eventName: "Lead", email: "a@b.c", attribution });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends the email tidied and hashed, never as plain text", async () => {
    await sendMetaEvent({
      eventName: "Purchase",
      email: " Jo@Example.com ",
      attribution,
      eventId: "flexi-1",
      valuePounds: 60,
    });
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/graph\.facebook\.com\/v[\d.]+\/123\/events$/);
    expect(options.body).not.toMatch(/jo@example/i);
    const [event] = JSON.parse(options.body).data;
    expect(event).toMatchObject({
      event_name: "Purchase",
      event_id: "flexi-1",
      action_source: "website",
      custom_data: { currency: "GBP", value: 60 },
    });
    expect(event.user_data.em).toEqual([
      createHash("sha256").update("jo@example.com").digest("hex"),
    ]);
  });

  it("marks events as tests when a test code is set", async () => {
    process.env.META_TEST_EVENT_CODE = "TEST1";
    await sendMetaEvent({ eventName: "Lead", email: "a@b.c", attribution });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).test_event_code).toBe(
      "TEST1"
    );
  });

  it("never throws, whatever Meta does", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    fetchMock.mockRejectedValueOnce(new Error("network down"));
    await expect(
      sendMetaEvent({ eventName: "Lead", email: "a@b.c", attribution })
    ).resolves.toBeUndefined();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => "version retired",
    });
    await expect(
      sendMetaEvent({ eventName: "Lead", email: "a@b.c", attribution })
    ).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain("secret");
    consoleError.mockRestore();
  });
});
