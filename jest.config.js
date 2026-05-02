module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts"],
  setupFiles: ["./tests/setup.ts"],
  setupFilesAfterEnv: ["./tests/setup-after-env.ts"],
  forceExit: true,
  detectOpenHandles: false,
};
