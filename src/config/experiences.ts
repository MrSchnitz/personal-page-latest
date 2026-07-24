import type { ImageMetadata } from "astro";
import kiwi from "../assets/kiwi.png";
import kiwiWhite from "../assets/kiwi_white.png";
import seznam from "../assets/seznam.png";
import seznamWhite from "../assets/seznam_white.png";
import tieto from "../assets/tieto.png";
import tietoWhite from "../assets/tieto_white.png";

export type ExperienceKey = "kiwi" | "seznam" | "tieto";

export type ExperienceEntry = {
  /** key into messages pages.experiences.* */
  key: ExperienceKey;
  link: string;
  logo: ImageMetadata;
  /** variant shown in dark mode */
  logoWhite: ImageMetadata;
};

export const EXPERIENCES: ExperienceEntry[] = [
  { key: "kiwi", link: "https://www.kiwi.com/cz/pages/content/about", logo: kiwi, logoWhite: kiwiWhite },
  { key: "seznam", link: "https://o.seznam.cz/", logo: seznam, logoWhite: seznamWhite },
  { key: "tieto", link: "https://www.tieto.com/cz/", logo: tieto, logoWhite: tietoWhite },
];
