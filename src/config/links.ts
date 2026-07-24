import type { Locale } from "../i18n/config";

export type PageKey = "home" | "about" | "experiences" | "education" | "skills";

export type NavLink = { name: PageKey; url: string };

/** Page order — drives the navigation pills and the prev/next arrow + keyboard navigation. */
export const LINKS: NavLink[] = [
  { name: "home", url: "" },
  { name: "about", url: "about" },
  { name: "experiences", url: "experiences" },
  { name: "education", url: "education" },
  { name: "skills", url: "skills" },
];

export const getActiveLink = (page: PageKey): number => LINKS.findIndex((link) => link.name === page);

/** Locale-prefixed href for a nav url: "" → /en, "about" → /en/about */
export const localeHref = (locale: Locale | string, url: string): string =>
  url ? `/${locale}/${url}` : `/${locale}`;
