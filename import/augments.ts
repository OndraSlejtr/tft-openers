import type { Augment, AugmentCategory, Champion } from "../src/data/types.ts";
import { type CatalogEntry, type ItemCatalog, lookup, nameOf, readSetIds } from "./items.ts";
import { expectString, toIconPath } from "./shape.ts";

const MIN_HERO_NAME_LENGTH = 4;
const ECON_WORDING = /\bgold\b|\binterest\b|\bxp\b|\bexperience\b/;
const ITEM_WORDING = /\bcomponents?\b|\bitems?\b/;
const PLACEHOLDER_ICON = /\/missing[-_.]/;

// Removes markup and @Variable@ placeholders so only the readable wording is matched.
const plainText = ({ name, desc }: CatalogEntry) =>
  `${String(name)} ${desc}`
    .replace(/<[^>]*>/g, " ")
    .replace(/@[^@]*@/g, " ")
    .replace(/&nbsp;/g, " ")
    .toLowerCase();

const heroNames = (champions: Champion[]) =>
  champions
    .map(({ name }) => name.replace(/[^A-Za-z]/g, "").toLowerCase())
    .filter((name) => name.length >= MIN_HERO_NAME_LENGTH);

const isSpecial = (entry: CatalogEntry, heroes: string[]) =>
  entry.associatedTraits.length > 0 || heroes.some((hero) => entry.apiName.toLowerCase().includes(hero));

const guessCategory = (entry: CatalogEntry, heroes: string[]): AugmentCategory => {
  if (isSpecial(entry, heroes)) return "special";
  const text = plainText(entry);
  if (ECON_WORDING.test(text)) return "econ";
  if (ITEM_WORDING.test(text)) return "item";
  return "combat";
};

const augmentIcon = (entry: CatalogEntry): string | null => {
  const icon = expectString(entry.icon, `icon of ${entry.apiName}`);
  return PLACEHOLDER_ICON.test(icon) ? null : toIconPath(icon, `icon of ${entry.apiName}`);
};

export const buildAugments = (
  setEntry: Record<string, unknown>,
  catalog: ItemCatalog,
  champions: Champion[],
): Augment[] => {
  const heroes = heroNames(champions);
  return readSetIds(setEntry, "augments").map((id) => {
    const entry = lookup(catalog, id, "set augments");
    return {
      id,
      name: nameOf(entry),
      icon: augmentIcon(entry),
      categories: [guessCategory(entry, heroes)],
      guessed: true,
    };
  });
};

