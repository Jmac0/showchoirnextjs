import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";

import { LeaderApplicationEmailTemplate } from "@/src/components/emails/LeaderApplicationEmailTemplate";
import { rejectSpam } from "@/src/lib/helpers/formSpamCheck";
import {
  isEmail,
  isPostcodeArea,
  isUkPhone,
  MAX_EXPERIENCE_LENGTH,
  MAX_FULL_NAME_LENGTH,
  MAX_TOWN_LENGTH,
  MIN_EXPERIENCE_LENGTH,
  postcodeArea,
} from "@/src/lib/helpers/leaderApplicationShared";

const SUCCESS_MESSAGE =
  "Thank you for applying - we'll be in touch if you're shortlisted";

// Choir leader applications (Work with us page): checked here, then emailed
// to the admin inbox
export default async function HandleLeaderApplication(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method is not supported" });
    return;
  }

  const { name, phone, email, town, postcode, experience } = req.body ?? {};

  // hidden field, fill-in time, links and sends per address
  if (
    rejectSpam({
      req,
      res,
      form: "leader",
      texts: [name, phone, email, town, postcode, experience],
      successMessage: SUCCESS_MESSAGE,
    })
  ) {
    return;
  }

  // The form already checks all of this, but a request sent straight to the
  // API skips the form. Anything that isn't text is refused first, so the
  // checks below can treat every value as a string.
  const values = [name, phone, email, town, postcode, experience];
  if (values.some((value) => typeof value !== "string")) {
    res.status(400).json({ message: "Please fill in every field" });
    return;
  }

  const problem = (() => {
    if (!name.trim() || name.length > MAX_FULL_NAME_LENGTH)
      return "Please check your name";
    if (!isUkPhone(phone)) return "Please enter a UK phone number";
    // .ru addresses: the same block as the other forms (validateFormData)
    if (!isEmail(email.trim()) || /\.ru$/i.test(email.trim()))
      return "Please check your email address";
    if (!town.trim() || town.length > MAX_TOWN_LENGTH)
      return "Please tell us the town you live in";
    if (!isPostcodeArea(postcode))
      return "Please enter the first part of your postcode, e.g. KT12";
    if (experience.trim().length < MIN_EXPERIENCE_LENGTH)
      return "Please tell us a bit more about your experience";
    if (experience.length > MAX_EXPERIENCE_LENGTH)
      return `Please keep your experience under ${MAX_EXPERIENCE_LENGTH} characters`;
    return null;
  })();
  if (problem) {
    res.status(400).json({ message: problem });
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const applicantEmail = email.trim().toLowerCase();
  try {
    await resend.sendEmail({
      from: process.env.FROM_EMAIL as string,
      to: process.env.ADMIN_EMAIL as string,
      // "Reply" in the inbox goes straight to the applicant
      reply_to: applicantEmail,
      subject: `Choir leader application: ${name.trim()}`,
      react: LeaderApplicationEmailTemplate({
        name: name.trim(),
        phone: phone.trim(),
        email: applicantEmail,
        town: town.trim(),
        postcode: postcodeArea(postcode),
        experience: experience.trim(),
      }),
    });
    res.status(200).json({ message: SUCCESS_MESSAGE });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ message: "Sorry there was an error" });
  }
}
