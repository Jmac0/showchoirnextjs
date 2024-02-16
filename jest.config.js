// eslint-disable-next-line @typescript-eslint/no-var-requires
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and
  // .env files in your test environment
  dir: "./",
});

const config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  // Add more setup options before each test is run
  displayName: "UI",
  transformIgnorePatterns: ["!node_modules/"],

  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleDirectories: ["node_modules", "<rootDir>/"],
  testRegex: "/__tests__/.*/.*\\.test\\.[jt]sx?$",
  moduleNameMapper: {
    // "next/router": "<rootDir>/__mocks__/next/router.js",

    "^.+\\.module\\.(css|sass|scss)$": "identity-obj-proxy",
    "^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$":
      "<rootDir>/__mocks__/file-mock.js",
    "react-markdown":
      "<rootDir>/node_modules/react-markdown/react-markdown.min.js",
  },
};

// createJestConfig is exported this way to ensure that next/jest can
// load the Next.js config which is async
module.exports = createJestConfig(config);
// export default config;
