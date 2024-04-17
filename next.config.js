module.exports = {
  images: {
    domains: ["images.ctfassets.net"],
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
