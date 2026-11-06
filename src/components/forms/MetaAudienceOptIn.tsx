import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  // For the box around it: everything else goes on the tick box itself
  wrapperClassName?: string;
};

// The optional tick for sharing a member's email with Meta. Never ticked to
// start with and never required, as consent has to be a free choice. Changing
// these words? Update META_AUDIENCE_WORDING_VERSION in lib/metaAudience.ts.
export const MetaAudienceOptIn = React.forwardRef<HTMLInputElement, Props>(
  ({ wrapperClassName, ...input }, ref) => (
    <div className={`flex items-start gap-3 ${wrapperClassName}`}>
      <input
        ref={ref}
        className="mt-1 shrink-0"
        type="checkbox"
        id="metaAudienceOptIn"
        {...input}
      />
      <label htmlFor="metaAudienceOptIn" className="text-sm">
        <b>Help us find more people like you (optional).</b> We may share a
        scrambled copy of your email address with Meta (Facebook and Instagram).
        This helps us show our ads to people with similar interests, and avoid
        showing them to you. It doesn&apos;t affect your membership, and you can
        change your mind at any time on your Account page.
      </label>
    </div>
  )
);

MetaAudienceOptIn.displayName = "MetaAudienceOptIn";
MetaAudienceOptIn.defaultProps = {
  wrapperClassName: "",
};
