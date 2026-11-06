import axios from "axios";
import React, { useState } from "react";

import { MetaAudienceOptIn } from "@/src/components/forms/MetaAudienceOptIn";

type Props = {
  optedIn: boolean;
  className?: string;
};

// Dashboard "Account" tab: lets a member change their answer to the optional
// Meta tick from when they created their account. Saves as soon as it changes.
export function MetaAudienceSwitch({ optedIn, className }: Props) {
  const [checked, setChecked] = useState(optedIn);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const save = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.checked;
    setChecked(next);
    setSaving(true);
    setMessage("");
    try {
      await axios.post("/api/members/meta-audience", { optIn: next });
      setIsError(false);
      setMessage("Saved");
    } catch {
      // Show what's really saved, so nobody thinks they've opted out when
      // they haven't
      setChecked(!next);
      setIsError(true);
      setMessage("That didn't save - please try again");
    }
    setSaving(false);
  };

  return (
    <div className={className}>
      <MetaAudienceOptIn
        wrapperClassName="text-gray-300"
        checked={checked}
        disabled={saving}
        onChange={save}
      />
      {message && (
        <p
          role={isError ? "alert" : "status"}
          className={`mt-3 text-sm ${
            isError ? "text-red-400" : "text-green-400"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

MetaAudienceSwitch.defaultProps = {
  className: "",
};
