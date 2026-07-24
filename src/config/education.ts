import type { ImageMetadata } from "astro";
import vsb from "../assets/vsb.png";

export type EducationKey = "vsb-ing" | "vsb-bc";

export type EducationEntry = {
  /** key into messages pages.education.* */
  key: EducationKey;
  link: string;
  logo: ImageMetadata;
};

export const EDUCATION: EducationEntry[] = [
  { key: "vsb-ing", link: "https://www.fei.vsb.cz/cs/index.html", logo: vsb },
  { key: "vsb-bc", link: "https://www.fei.vsb.cz/cs/index.html", logo: vsb },
];
