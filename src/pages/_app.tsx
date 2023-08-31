import "@/src/styles/global.css";
import "@fortawesome/fontawesome-svg-core/styles";

import { config } from "@fortawesome/fontawesome-svg-core";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
// Tell Font Awesome to skip adding the CSS automatically
// since it's already imported above
config.autoAddCss = false;

export default function MyApp({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />;
    </SessionProvider>
  );
}
