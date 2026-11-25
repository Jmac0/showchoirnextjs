import { Head, Html, Main, NextScript } from "next/document";

// The page skeleton every page shares. Its only job here is lang="en-GB":
// it tells search engines, browsers and screen readers the site is in
// British English (screen readers then use the right voice and spelling)
export default function Document() {
  return (
    <Html lang="en-GB">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
