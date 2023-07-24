import "@/src/styles/global.css";
import "@fortawesome/fontawesome-svg-core/styles";

import { config } from "@fortawesome/fontawesome-svg-core";
import type { AppProps } from "next/app";
// Tell Font Awesome to skip adding the CSS automatically
// since it's already imported above
config.autoAddCss = false;

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
