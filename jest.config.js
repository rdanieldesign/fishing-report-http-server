module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/src/tests/**/*.test.ts"],
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  setupFiles: ["./src/tests/setup.ts"],
  setupFilesAfterEnv: ["./src/tests/setup-after-env.ts"],
  forceExit: true,
  detectOpenHandles: false,
  moduleNameMapper: {
    ".*queue/usgs\\.queue.*": "<rootDir>/src/__mocks__/queue/usgs.queue.ts",
  },
};
