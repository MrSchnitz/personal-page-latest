/**
 * Single source of truth for locales.
 * (The 2023 app duplicated this list across middleware.ts, i18n.ts and utils/navigation.ts.)
 * Imported by astro.config.ts too — keep this file free of JSON/env imports.
 */
export const locales = ["en", "cz"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** URL locale → ISO language code (used for <html lang>, hreflang and og:locale). */
export const hreflang: Record<Locale, string> = { en: "en", cz: "cs" };
