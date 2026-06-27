import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { 
      entry: "server",
      publicAssets: [
        {
          baseURL: "/",
          dir: "./.output/public"
        },
        {
          baseURL: "/assets",
          dir: "./.output/public/assets"
        }
      ]
    },
  },
  base: "/",
});