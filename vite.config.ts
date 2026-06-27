import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // nitro/vite builds from this
    server: { 
      entry: "server",
      // Añadimos esto para mapear los assets públicos en producción
      publicAssets: [
        {
          dir: "./.output/public"
        }
      ]
    },
  },
});