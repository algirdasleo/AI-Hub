import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/app.ts"],
  format: ["esm"],
  clean: true,
  splitting: false,
  sourcemap: true,
  target: "node20",
  // Leave node_modules dependencies external; only bundle our source
  skipNodeModulesBundle: true,
  shims: true,
});
