// Optional: configure or set up a testing framework before each
// test.
// If you delete this file, remove `setupFilesAfterEnv` from
// `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom/extend-expect";

import { TextDecoder, TextEncoder } from "util";

// src/setupTests.js
import { server } from "./src/mocks/server";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
// Establish API mocking before all tests.
beforeAll(() => {
  server.listen();
});

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished.
afterAll(() => server.close());
