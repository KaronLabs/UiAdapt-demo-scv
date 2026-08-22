import react from "@vitejs/plugin-react";
import { execFileSync } from "node:child_process";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";
import { resolveBuildId } from "./config/build-id.ts";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const buildId = resolveBuildId(
    env.VITE_UIADAPT_BUILD_ID,
    () =>
      execFileSync("git", ["rev-parse", "--short=7", "HEAD"], {
        encoding: "utf8",
      }),
  );

  return {
    plugins: [react()],
    base: "/uiadapt_demo/",
    define: {
      "import.meta.env.VITE_UIADAPT_BUILD_ID": JSON.stringify(buildId),
    },
    server: { host: "127.0.0.1" },
    preview: { host: "127.0.0.1", port: 8766 },
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      css: true,
      include: ["src/**/*.test.{ts,tsx}"],
    },
  };
});
