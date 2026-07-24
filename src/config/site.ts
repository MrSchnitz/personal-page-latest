/**
 * Central site facts — the ONLY place app code reads import.meta.env.
 * Values come from .env (see .env.example); fallbacks keep the build working
 * without one. The canonical site URL is `Astro.site` (fed from PUBLIC_SITE_URL
 * in astro.config.ts), not duplicated here.
 */
export const SITE = {
  contactEmail: import.meta.env.PUBLIC_CONTACT_EMAIL ?? "janbauer.cv@gmail.com",
  linkedin: import.meta.env.PUBLIC_LINKEDIN_URL ?? "https://linkedin.com/in/jan-bauer-b21735b5",
  github: import.meta.env.PUBLIC_GITHUB_URL ?? "https://github.com/MrSchnitz",
  youtube: import.meta.env.PUBLIC_YOUTUBE_URL ?? "https://www.youtube.com/@janbauer9576",
} as const;
