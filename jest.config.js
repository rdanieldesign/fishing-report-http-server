module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/src/tests/**/*.test.ts"],
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  setupFiles: ["./src/tests/setup.ts"],
  setupFilesAfterEnv: ["./src/tests/setup-after-env.ts"],
  moduleNameMapper: {
    ".*queue/usgs\\.queue.*": "<rootDir>/src/__mocks__/queue/usgs.queue.ts",
    ".*queue/weather\\.queue.*":
      "<rootDir>/src/__mocks__/queue/weather.queue.ts",
  },
};
