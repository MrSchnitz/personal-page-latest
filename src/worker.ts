/**
 * Cloudflare Worker in front of the static assets. Per wrangler.jsonc
 * (assets.run_worker_first: ["/"]) it is invoked ONLY for the root path:
 * visitors get redirected to their language — Czech browsers to /cz, everyone
 * else to /en. All other paths are served straight from static assets without
 * a Worker invocation.
 */
import { defaultLocale, hreflang, locales } from "./i18n/config";

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

const czechLocale = locales.find((locale) => hreflang[locale] === "cs") ?? defaultLocale;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/") {
      const acceptLanguage = request.headers.get("accept-language") ?? "";
      const locale = /\bcs\b/i.test(acceptLanguage) ? czechLocale : defaultLocale;
      return new Response(null, {
        status: 302,
        headers: {
          location: new URL(`/${locale}`, url).toString(),
          vary: "Accept-Language",
        },
      });
    }
    return env.ASSETS.fetch(request);
  },
};
