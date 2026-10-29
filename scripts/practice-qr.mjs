// Printable practice membership-card QR codes for the seeded test members
// (scripts/seed/members.json), for training welcome assistants (GAs) to scan
// people in with the app. Same QR contents as the app's membership card:
// JSON {email, first_name, last_name} (showChoirExpoApp src/app/(app)/index.tsx).
//
// npm run practice-qr  ->  ../practice-qr-codes/ (next to this repo, not in
// it): one PNG per member plus print-sheet-A4.pdf (6 to a page, cut lines).
// Needs Google Chrome installed (it draws the PNGs and the PDF).
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "../../practice-qr-codes");
const TMP = join(OUT, ".tmp");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const members = JSON.parse(
  readFileSync(join(HERE, "seed/members.json"), "utf8")
);

// What each test member is for, under their name (their state when seeded)
const LABELS = {
  "test@test.com": "Flexi - 7 sessions (admin)",
  "dd.empty@example.com": "Direct Debit - not set up yet",
  "flexi.unpaid@example.com": "Flexi - signed up, never paid",
  "dd.active@example.com": "Direct Debit - active",
  "dd.cancelled@example.com": "Direct Debit - cancelled, ended",
  "dd.grace@example.com": "Direct Debit - cancelled 5 days ago (grace)",
  "no.password@example.com": "Flexi - 10 sessions, no password yet",
  "ga@example.com": "GA (Direct Debit)",
  "concession@example.com": "Flexi concession - 0 sessions",
  "flexi.expiring@example.com": "Flexi - 4 sessions, expiring soon",
  "flexi.lapsed@example.com": "Flexi - 6 sessions, lapsed 6+ months",
  "flexi.paper@example.com": "Flexi - paper sessions to confirm",
  "flexi.invite@example.com": "Flexi - not invited yet",
  "jamiejmackenzie@gmail.com": "Flexi - 10 sessions (real inbox)",
};

const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );

const card = (svg, name, label) => `
  <div class="card">
    <div class="qr">${svg}</div>
    <div class="name">${esc(name)}</div>
    <div class="label">${esc(label)}</div>
  </div>`;

const style = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #fff; font-family: -apple-system, Helvetica, Arial, sans-serif; }
  .card { width: 600px; height: 760px; display: flex; flex-direction: column;
          align-items: center; justify-content: center; text-align: center; }
  .qr svg { width: 520px; height: 520px; display: block; }
  .name { margin-top: 18px; font-size: 44px; font-weight: 700; color: #000; }
  .label { margin-top: 8px; font-size: 24px; color: #555; }`;

rmSync(OUT, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

const cards = [];
for (const [i, m] of members.entries()) {
  const value = JSON.stringify({
    email: m.email,
    first_name: m.first_name,
    last_name: m.last_name,
  });
  // Error correction M, like react-native-qrcode-svg; a quiet zone round it
  const svg = await QRCode.toString(value, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
  });
  const name = `${m.first_name} ${m.last_name}`;
  const label = LABELS[m.email] || m.membership_type;
  cards.push({ svg, name, label });

  const file = `${String(i + 1).padStart(2, "0")}-${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}`;
  const html = join(TMP, `${file}.html`);
  writeFileSync(
    html,
    `<!doctype html><meta charset="utf-8"><style>${style}</style>${card(
      svg,
      name,
      label
    )}`
  );
  execFileSync(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=2",
      "--window-size=600,760",
      `--screenshot=${join(OUT, `${file}.png`)}`,
      `file://${html}`,
    ],
    { stdio: "ignore" }
  );
  console.log(`${file}.png  -  ${m.email}`);
}

// One A4 sheet to print: 2 across, 3 down, cut along the light lines
const sheet = `<!doctype html><meta charset="utf-8"><style>${style}
  @page { size: A4; margin: 10mm; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); }
  .grid .card { width: auto; height: 92mm; border: 1px dashed #ccc; zoom: 1; }
  .grid .qr svg { width: 60mm; height: 60mm; }
  .grid .name { font-size: 16pt; margin-top: 2mm; }
  .grid .label { font-size: 9pt; margin-top: 1mm; }
  .grid .card:nth-child(6n) { break-after: page; }
</style><div class="grid">${cards
  .map((c) => card(c.svg, c.name, c.label))
  .join("")}</div>`;
const sheetHtml = join(TMP, "print-sheet.html");
writeFileSync(sheetHtml, sheet);
execFileSync(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    `--print-to-pdf=${join(OUT, "print-sheet-A4.pdf")}`,
    `file://${sheetHtml}`,
  ],
  { stdio: "ignore" }
);

rmSync(TMP, { recursive: true, force: true });
console.log(`\n${cards.length} PNGs + print-sheet-A4.pdf in ${OUT}`);
