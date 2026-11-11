import { Resend } from "resend";

import { ShopOrderEmail } from "@/src/components/emails/ShopOrderEmail";
import { describeItem, formatPence, ShopOrderRow } from "@/src/lib/shopShared";

// Members type their name and the order note, so make them safe to put in
// an HTML email (no sneaking in links or markup)
export const escapeHtml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// When a kit shop order is paid for (lib/shop.ts completeOrder): a thank-you
// to the member, and a note to the admin (ADMIN_EMAIL) saying what to order.
// Both are tried; throws the first error if either fails (the caller logs
// it - the order is saved either way and shows on the Orders page).
export async function sendShopOrderEmails(order: ShopOrderRow) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const firstName = order.member_name.split(" ")[0] || "there";

  const results = await Promise.allSettled([
    resend.sendEmail({
      from: `${process.env.FROM_EMAIL}`,
      to: order.member_email,
      subject: `Your Show Choir kit order ${order.reference}`,
      react: ShopOrderEmail({ name: firstName, order }),
    }),
    resend.sendEmail({
      from: `${process.env.FROM_EMAIL}`,
      to: `${process.env.ADMIN_EMAIL}`,
      subject: `New kit order ${order.reference}: ${order.member_name}`,
      html: `<p>A new kit shop order has been paid for.</p>
        <p><b>${escapeHtml(order.member_name)}</b> - ${escapeHtml(
        order.member_email
      )}<br>
        <b>Choir:</b> ${escapeHtml(order.venue || "not given")}</p>
        <ul>${order.items
          .map((item) => `<li>${escapeHtml(describeItem(item))}</li>`)
          .join("")}</ul>
        <p><b>Total paid:</b> ${formatPence(order.total_pence)}</p>
        ${order.note ? `<p><b>Note:</b> ${escapeHtml(order.note)}</p>` : ""}
        <p>All orders: ${
          process.env.NEXT_PUBLIC_BASE_URL
        }/members/shop-orders</p>`,
    }),
  ]);
  const failed = results.find(
    (result): result is PromiseRejectedResult => result.status === "rejected"
  );
  if (failed) throw failed.reason;
}
