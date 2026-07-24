import en from "./messages/en.json";
import cz from "./messages/cz.json";
import { locales, type Locale } from "./config";

export { locales, defaultLocale, hreflang, type Locale } from "./config";

/** Widen JSON literal types so both locales' values satisfy one shape. */
type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? Widen<U>[]
    : { [K in keyof T]: Widen<T[K]> };

type Messages = Widen<typeof en>;

/** Dot-paths to leaves of type Leaf, e.g. "pages.home.title". */
type LeafPaths<T, Leaf> = {
  [K in keyof T & string]: T[K] extends Leaf
    ? K
    : T[K] extends readonly unknown[]
      ? never
      : T[K] extends object
        ? `${K}.${LeafPaths<T[K], Leaf>}`
        : never;
}[keyof T & string];

export type MessageKey = LeafPaths<Messages, string>;
export type MessageListKey = LeafPaths<Messages, string[]>;

const messages: Record<Locale, Messages> = { en, cz };

const resolve = (locale: Locale, key: string): unknown =>
  key.split(".").reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], messages[locale]);

/** Translate helper bound to a locale: `const t = useTranslations("en"); t("pages.home.title")` */
export function useTranslations(locale: Locale) {
  return (key: MessageKey): string => {
    const value = resolve(locale, key);
    if (typeof value !== "string") throw new Error(`Missing message "${key}" for locale "${locale}"`);
    return value;
  };
}

/** List messages (experience bullet points): `tList("en", "pages.experiences.kiwi.description")` */
export function tList(locale: Locale, key: MessageListKey): string[] {
  const value = resolve(locale, key);
  if (!Array.isArray(value)) throw new Error(`Missing list message "${key}" for locale "${locale}"`);
  return value;
}

/** Validated cast for Astro.params.locale. */
export function asLocale(value: string | undefined): Locale {
  if (!locales.includes(value as Locale)) throw new Error(`Invalid locale "${value}"`);
  return value as Locale;
}

/** Shared getStaticPaths for every /[locale]/ page. */
export const getLocaleStaticPaths = () => locales.map((locale) => ({ params: { locale } }));
