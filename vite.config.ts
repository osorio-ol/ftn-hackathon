import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
