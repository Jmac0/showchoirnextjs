import { useEffect, useState } from "react";

import { choirStartText } from "@/src/lib/venues";

// When a new choir opens, if it hasn't yet. Worked out in the browser only: the
// pages are built once in advance, so a check made then would still show the
// date after opening night.
export function useChoirStart(location: string) {
  const [startText, setStartText] = useState<string | null>(null);

  useEffect(() => {
    setStartText(choirStartText(location));
  }, [location]);

  return startText;
}
