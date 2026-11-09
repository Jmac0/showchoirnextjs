module.exports = {
  images: {
    domains: ["images.ctfassets.net"],
    // Vercel charges every time it resizes an image and saves the result.
    // Keep the results for 31 days instead of the default 1 hour – our images
    // rarely change, and a replaced Contentful image gets a new URL anyway.
    minimumCacheTTL: 2678400,
    // Fewer widths per image = fewer resized copies to make and store
    // (the default list goes up to 3840px).
    deviceSizes: [640, 828, 1200, 1920],
  },
  // Search engines may only list the live site. Everything else - the dev
  // site (app.show-choir.co.uk), Vercel previews and local dev - tells them
  // not to, so copies of the site never compete with the real one. Vercel
  // sets VERCEL_ENV to "production" only for the main branch's deploys.
  // (The app's API calls are unaffected - this only speaks to search engines)
  async headers() {
    if (process.env.VERCEL_ENV === "production") return [];
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(mp3|mp4|m4a|ma4)$/i,
      use: [
        {
          loader: "url-loader",
          options: {
            limit: 8192, // Limiting the file size to 8KB. Adjust as needed.
            fallback: "file-loader",
            publicPath: "/_next/",
            outputPath: "static/media/",
            name: "[name].[hash:8].[ext]",
          },
        },
      ],
    });

    return config;
  },
};
