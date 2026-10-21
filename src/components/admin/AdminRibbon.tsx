import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

type RibbonButton = { label: string; href: string };
type RibbonTab = { label: string; buttons: RibbonButton[] };

// Every admin tool, grouped Word-ribbon style: a row of tabs, and the
// selected tab's buttons underneath. Add new reports and tools here.
export const RIBBON_TABS: RibbonTab[] = [
  {
    label: "Reports",
    buttons: [
      { label: "Active members", href: "/members/reports?report=active" },
      { label: "Attendance", href: "/members/reports?report=attendance" },
      { label: "Flexi sessions", href: "/members/reports?report=flexi" },
    ],
  },
  {
    label: "Members",
    buttons: [
      { label: "DD members", href: "/members/dd-members" },
      { label: "Flexi members", href: "/members/flexi-members" },
    ],
  },
  {
    label: "Music",
    buttons: [{ label: "Music admin", href: "/members/music-admin" }],
  },
  {
    label: "Holidays",
    buttons: [{ label: "Holidays", href: "/members/holidays" }],
  },
];

// The reports page with no ?report= shows the first report
const DEFAULT_REPORT = "active";

// Whether a ribbon button is the page we're on: same path, and for the
// reports page the same ?report=
const isCurrent = (href: string, pathname: string, report: string) => {
  const [path, search = ""] = href.split("?");
  if (path !== pathname) return false;
  const buttonReport = new URLSearchParams(search).get("report");
  return !buttonReport || buttonReport === report;
};

// The ribbon across the top of every admin page
export function AdminRibbon() {
  const { pathname, query } = useRouter();
  const report =
    typeof query.report === "string" ? query.report : DEFAULT_REPORT;

  const currentTab =
    RIBBON_TABS.find((tab) =>
      tab.buttons.some((button) => isCurrent(button.href, pathname, report))
    ) ?? RIBBON_TABS[0];

  return (
    <nav aria-label="Admin" className="w-full border-b-2 border-lightGold">
      {/* Tabs - each opens its first tool. Scrolls sideways on phones. */}
      <div className="flex gap-1 overflow-x-auto bg-lightBlack px-2 pt-2">
        {RIBBON_TABS.map((tab) => {
          const selected = tab === currentTab;
          return (
            <Link
              key={tab.label}
              href={tab.buttons[0].href}
              aria-current={selected ? "page" : undefined}
              className={`whitespace-nowrap rounded-t-md px-4 py-2 font-heading transition-colors ${
                selected
                  ? "bg-gradient-to-br from-yellow-200 to-yellow-500 text-black"
                  : "text-gray-200 hover:bg-slate-100/10"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
      {/* The selected tab's buttons */}
      <div className="flex gap-2 overflow-x-auto bg-gradient-to-br from-yellow-200 to-yellow-500 px-3 py-2">
        {currentTab.buttons.map((button) => {
          const current = isCurrent(button.href, pathname, report);
          return (
            <Link
              key={button.href}
              href={button.href}
              aria-current={current ? "page" : undefined}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-bold text-black transition-colors ${
                current ? "bg-black/20 shadow-inner" : "hover:bg-slate-100/40"
              }`}
            >
              {button.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
