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

// ── direction-aware page transitions ──
// Stamp the travel direction on <html> so the view-transition CSS can slide the
// content left or right. The swap replaces <html> attributes with the new
// page's, so the stamp must be re-applied on astro:after-swap (which runs
// before the transition animates) — before-preparation alone gets wiped.
let navDir = "fwd";
document.addEventListener("astro:before-preparation", (event) => {
  const { from, to } = event as unknown as { from?: URL; to?: URL };
  const linkIndex = (url?: URL) => {
    const [, segment = ""] = url?.pathname.split("/").filter(Boolean) ?? [];
    return LINKS.findIndex((link) => link.url === segment);
  };
  navDir = linkIndex(to) >= linkIndex(from) ? "fwd" : "back";
});
document.addEventListener("astro:after-swap", () => {
  document.documentElement.dataset.navDir = navDir;
});

// ── typewriter for the home hero (initial full load only) ──
// Types out each [data-typewriter] element in order. Skipped on client-side
// navigations (.intro-done) and for reduced-motion users, where the static
// server-rendered text stays as-is.
const typewriterIntro = () => {
  if (document.documentElement.classList.contains("intro-done")) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-typewriter]")).sort(
    (a, b) => Number(a.dataset.typewriter) - Number(b.dataset.typewriter),
  );
  if (targets.length === 0) return;
  const texts = targets.map((el) => el.textContent ?? "");
  targets.forEach((el) => (el.textContent = ""));
  let element = 0;
  let char = 0;
  const typeNext = () => {
    if (element >= targets.length) return;
    const target = targets[element];
    char += 1;
    target.textContent = texts[element].slice(0, char);
    if (char >= texts[element].length) {
      element += 1;
      char = 0;
      window.setTimeout(typeNext, 350);
      return;
    }
    window.setTimeout(typeNext, Number(target.dataset.typeSpeed) || 70);
  };
  // start after the intro has revealed the content — the desktop frame opens
  // 1.3–2.3s and the content fade ends at 2s, so typing begins once visible
  window.setTimeout(typeNext, window.matchMedia("(min-width: 768px)").matches ? 2200 : 900);
};
typewriterIntro();

// ── mobile: gradient mask behind the sticky nav once scrolled past the threshold ──
const syncScrollMask = () => {
  const nav = document.querySelector("[data-nav-scroll]");
  if (!nav) return;
  const show = window.matchMedia("(max-width: 767px)").matches && window.scrollY > SCROLL_THRESHOLD;
  nav.classList.toggle("navigation-scroll--show", show);
};

window.addEventListener("scroll", syncScrollMask, { passive: true });
document.addEventListener("astro:page-load", syncScrollMask);
