import { signOut } from "next-auth/react";
import React from "react";

export default function LogOutBtn() {
  // sign user out and render login form
  const userSignOut = async () => {
    await signOut({
      redirect: false,
    });
  };

  return (
    <button
      className=" mt-auto flex h-24 w-full flex-col items-center justify-center place-self-end font-heading shadow-inner transition-colors hover:bg-slate-100 hover:bg-opacity-30 hover:shadow-none"
      type="button"
      onClick={() => userSignOut()}
    >
      Log out
    </button>
  );
}
