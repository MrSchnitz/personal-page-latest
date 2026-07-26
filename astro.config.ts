import { defineConfig } from "astro/config";
import { loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import { locales, defaultLocale, hreflang } from "./src/i18n/config";

const { PUBLIC_SITE_URL } = loadEnv(process.env.NODE_ENV ?? "production", process.cwd(), "");

export default defineConfig({
  site: PUBLIC_SITE_URL || "https://personal-page.workers.dev",
  output: "static",
  // URL parity with the old Next.js site: /en/about, no trailing slash
  build: { format: "file" },
  i18n: {
    locales: [...locales],
    defaultLocale,
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
  // Meta-refresh fallback for `astro preview`; in production the Worker handles "/"
  redirects: { "/": `/${defaultLocale}` },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale,
        locales: Object.fromEntries(locales.map((l) => [l, hreflang[l]])),
      },
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
