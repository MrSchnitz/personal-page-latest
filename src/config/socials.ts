import { SITE } from "./site";
import { icons, type IconData } from "./icons";

export type SocialLink = { name: string; href: string; icon: IconData; blank: boolean };

/** Footer social links, in render order. */
export const SOCIALS: SocialLink[] = [
  { name: "LinkedIn", href: SITE.linkedin, icon: icons.linkedin, blank: true },
  { name: "Email", href: `mailto:${SITE.contactEmail}`, icon: icons.google, blank: false },
  { name: "GitHub", href: SITE.github, icon: icons.github, blank: true },
  { name: "YouTube", href: SITE.youtube, icon: icons.youtube, blank: true },
];
