import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      include: ["**/src/**/*.ts"],
      exclude: ["**/*.test.ts", "**/*.spec.ts", "client/", "cms/", "**/index.ts", "**/routes.ts", "**/types.ts"],
      reportsDirectory: "./coverage",
      reporter: ["text", "html"],
      reportOnFailure: true,
    },
  },
});
