import React from "react";

type Props = {
  text: string;
  handleClick: () => void;
  setActiveComponent: (componentName: string) => void;
};
export default function MemberBtn({
  text,
  setActiveComponent,
  handleClick,
}: Props) {
  // sign user out and render login form
  const handleComponentChange = () => {
    setActiveComponent(text);
    handleClick();
  };
  return (
    <button
      onClick={handleComponentChange}
      className="flex h-24 w-full flex-col items-center justify-center font-heading shadow-inner transition-colors hover:bg-slate-100 hover:bg-opacity-30 hover:shadow-none"
      type="button"
    >
      {text}
    </button>
  );
}
