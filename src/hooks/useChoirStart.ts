import { useEffect, useState } from "react";

import { choirStartDate, choirStartText } from "@/src/lib/venues";

// When a new choir opens, if it hasn't yet. Checked again in the browser: the
// pages are built in advance, so a check made then would still show the
// date after opening night.
export function useChoirStart(location: string) {
  const [startText, setStartText] = useState<string | null>(null);

  useEffect(() => {
    setStartText(choirStartText(location));
  }, [location]);

  return startText;
}

// The opening day on its own ("Tuesday 19th January"). Starts from the value
// worked out when the page was built (so it's in the HTML search engines
// read), then the browser checks it hasn't passed since
export function useChoirStartDate(location: string, builtWith: string | null) {
  const [startDate, setStartDate] = useState<string | null>(builtWith);

  useEffect(() => {
    setStartDate(choirStartDate(location));
  }, [location]);

  return startDate;
}
