// Subsets the three.js typeface font from the 2023 site (553 KB, full charset)
// down to the 3 glyphs the background scene actually renders: < / >
// Usage: node scripts/subset-typeface.mjs [path-to-source-typeface.json]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source =
  process.argv[2] ??
  resolve(root, "../personal-page-2023/public/source_code_pro_font.json");
const target = resolve(root, "public/fonts/source-code-pro-subset.typeface.json");
const KEEP = ["<", "/", ">"];

const font = JSON.parse(readFileSync(source, "utf8"));
const missing = KEEP.filter((ch) => !(ch in font.glyphs));
mkdirSync(dirname(target), { recursive: true });
if (missing.length > 0) {
  console.error(`Glyphs ${JSON.stringify(missing)} missing in ${source} — copying the full font instead.`);
  writeFileSync(target, JSON.stringify(font));
  process.exit(0);
}
font.glyphs = Object.fromEntries(KEEP.map((ch) => [ch, font.glyphs[ch]]));
const out = JSON.stringify(font);
writeFileSync(target, out);
console.log(`Wrote ${target} (${(out.length / 1024).toFixed(1)} KB)`);
