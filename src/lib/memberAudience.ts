import { joinChoirAudience, leaveChoirAudience } from "@/src/lib/mailchimp";
import Members from "@/src/lib/models/member";

// Moves a member between the Mailchimp audiences (lib/mailchimp.ts) and
// remembers which one they're in (mailchimp_audience), so the daily job
// (api/cron/daily.ts) knows who to move back when a membership ends.
// Server only; never throws.

type AudienceMember = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  home_choir?: string;
};

// Their membership has started -> Choir audience
export async function memberJoined(member: AudienceMember) {
  if (await joinChoirAudience(member)) {
    await Members.updateOne(
      { _id: member.id },
      { mailchimp_audience: "choir" }
    );
  }
}

// Their membership has ended -> back to the Prospects audience
export async function memberLeft(member: AudienceMember) {
  if (await leaveChoirAudience(member)) {
    await Members.updateOne(
      { _id: member.id },
      { mailchimp_audience: "prospects" }
    );
  }
}
