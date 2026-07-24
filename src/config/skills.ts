export type SkillEntry = {
  title: string;
  /** symbol id inside public/images/logos.svg */
  icon: string;
  class?: string;
};

/** Skills grid, in render order. Icon ids match the <symbol>s in the SVG sprite. */
export const SKILLS: SkillEntry[] = [
  { title: "JavaScript", icon: "js" },
  { title: "TypeScript", icon: "ts" },
  { title: "HTML", icon: "html" },
  { title: "CSS", icon: "css" },
  { title: "SCSS", icon: "sass" },
  { title: "Java", icon: "java" },
  { title: "Git", icon: "git" },
  { title: "NodeJS", icon: "nodejs" },
  { title: "React", icon: "react" },
  { title: "Redux", icon: "redux" },
  { title: "NextJS", icon: "nextjs" },
  { title: "Svelte", icon: "svelte" },
  { title: "Tailwind CSS", icon: "tailwind" },
  { title: "NestJS", icon: "nestjs" },
  { title: "Spring Boot", icon: "springboot" },
  { title: "MongoDB", icon: "mongo", class: "hidden md:block" },
  { title: "PostgreSQL", icon: "postgresql" },
  { title: "Figma", icon: "figma" },
  { title: "Adobe After Effects", icon: "afterEffects" },
  { title: "Adobe Premiere Pro", icon: "premierePro" },
  { title: "Adobe Photoshop", icon: "photoshop" },
];
