import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["cli/**/*.test.ts", "lib/**/*.test.ts"],
    clearMocks: true,
  },
});
