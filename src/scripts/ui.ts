/**
 * All page interactivity (no framework). This module is loaded once per full
 * page load; with the ClientRouter, module scripts do NOT re-run on client-side
 * navigations — so every listener is bound once at module scope (document/window
 * level) and page elements are queried lazily, per event.
 */
import { navigate } from "astro:transitions/client";
import { LINKS, localeHref } from "../config/links";
import { locales } from "../i18n/config";

const COLOR_SCHEME_KEY = "COLOR_SCHEME";
const SCROLL_THRESHOLD = 20;
const ARROW_PRESSED_MS = 300;

// ── theme toggle (event delegation survives body swaps) ──
document.addEventListener("click", (event) => {
  const toggle = event.target instanceof Element ? event.target.closest("[data-theme-toggle]") : null;
  if (!toggle) return;
  const isDark = document.documentElement.classList.toggle("dark");
  localStorage.setItem(COLOR_SCHEME_KEY, isDark ? "dark" : "light");
});

// ── ArrowLeft/ArrowRight keyboard navigation between pages ──
const parsePath = (): { locale: string; index: number } | null => {
  const [locale = "", segment = ""] = window.location.pathname.split("/").filter(Boolean);
  if (!(locales as readonly string[]).includes(locale)) return null;
  const index = LINKS.findIndex((link) => link.url === segment);
  return index === -1 ? null : { locale, index };
};

const flashArrow = (side: "left" | "right") => {
  const arrow = document.querySelector(`[data-arrow="${side}"]`);
  if (!arrow) return;
  arrow.setAttribute("data-pressed", "");
  window.setTimeout(() => arrow.removeAttribute("data-pressed"), ARROW_PRESSED_MS);
};

window.addEventListener("keydown", (event) => {
  if (event.code !== "ArrowLeft" && event.code !== "ArrowRight") return;
  const current = parsePath();
  if (!current) return;
  const delta = event.code === "ArrowRight" ? 1 : -1;
  const target = LINKS[current.index + delta];
  if (!target) return;
  flashArrow(delta === 1 ? "right" : "left");
  navigate(localeHref(current.locale, target.url));
});

// ── mobile: gradient mask behind the sticky nav once scrolled past the threshold ──
const syncScrollMask = () => {
  const nav = document.querySelector("[data-nav-scroll]");
  if (!nav) return;
  const show = window.matchMedia("(max-width: 767px)").matches && window.scrollY > SCROLL_THRESHOLD;
  nav.classList.toggle("navigation-scroll--show", show);
};

window.addEventListener("scroll", syncScrollMask, { passive: true });
document.addEventListener("astro:page-load", syncScrollMask);
