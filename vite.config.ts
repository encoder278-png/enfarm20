
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),

      VitePWA({
        registerType: "autoUpdate",

        manifest: {
          name: "EnFarm - Agricultural Intelligence",
          short_name: "EnFarm",
          description:
            "Agricultural monitoring and intelligence platform for agricultural officers.",
          theme_color: "#F5F6F2",
          background_color: "#F5F6F2",
          display: "standalone",
          orientation: "any",
          start_url: "/",
          scope: "/",
        },

        devOptions: {
          enabled: false,
        },
      }),
    ],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },

    server: {
      hmr: process.env.DISABLE_HMR !== "true",
      watch:
        process.env.DISABLE_HMR === "true" ? null : {},
    },
  };
});
