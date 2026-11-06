import { sendMetaEvent } from "@/src/lib/metaConversions";
import Members, { MemberType } from "@/src/lib/models/member";

// Tells Meta someone has really joined. Payment is only confirmed later, by a
// webhook with no browser involved, so the sign-up saves their cookie consent
// and details on their record (meta_attribution) and this uses them once.
// Anyone without that record - no consent, invited or imported members, Direct
// Debit restarts - is never sent, and neither are top-ups. Not in
// lib/memberAudience.ts's memberJoined, which also runs for those people.
// Server only; never throws.

const STALE_AFTER_DAYS = 30;

type NewMember = {
  memberId: string;
  eventName: "Purchase" | "Subscribe";
  eventId: string;
  valuePounds: number;
};

export async function tellMetaMemberJoined({
  memberId,
  eventName,
  eventId,
  valuePounds,
}: NewMember) {
  try {
    const member = await Members.findById(memberId)
      .select("email age_confirm +meta_attribution")
      .lean<MemberType>();
    if (!member?.meta_attribution) return;
    // Membership is for over-18s, so nobody else goes into ad audiences
    if (member.age_confirm === true) {
      await sendMetaEvent({
        eventName,
        eventId,
        valuePounds,
        email: member.email,
        attribution: member.meta_attribution,
      });
    }
    // Only needed for this one event, so don't keep it
    await Members.updateOne(
      { _id: memberId },
      { $unset: { meta_attribution: 1 } }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("💥 Meta join event failed:", (error as Error).message);
  }
}

// For the daily job: sign-ups never finished, so never sent. Returns how many.
export async function clearStaleMetaAttribution() {
  const cutoff = new Date(Date.now() - STALE_AFTER_DAYS * 24 * 60 * 60 * 1000);
  const { modifiedCount } = await Members.updateMany(
    { "meta_attribution.consented_at": { $lt: cutoff } },
    { $unset: { meta_attribution: 1 } }
  );
  return modifiedCount;
}
