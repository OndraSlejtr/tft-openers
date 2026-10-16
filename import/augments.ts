import type { Augment, AugmentCategory, Champion } from "../src/data/types.ts";
import { AUGMENT_CATEGORY_OVERRIDES } from "./curation.ts";
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
    .map(({ name }) => name.toLowerCase())
    .filter((name) => name.replace(/[^a-z]/g, "").length >= MIN_HERO_NAME_LENGTH);

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// A hero is named in the id or in the readable text of the augment.
const isTiedToHero = (entry: CatalogEntry, heroes: string[]) => {
  const id = entry.apiName.toLowerCase();
  const text = plainText(entry);
  return heroes.some(
    (hero) =>
      id.includes(hero.replace(/[^a-z]/g, "")) || new RegExp(`\\b${escapeRegExp(hero)}\\b`).test(text),
  );
};

const isSpecial = (entry: CatalogEntry, heroes: string[]) =>
  entry.associatedTraits.length > 0 || isTiedToHero(entry, heroes);

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
      categories: AUGMENT_CATEGORY_OVERRIDES[id] ?? [guessCategory(entry, heroes)],
      guessed: true,
    };
  });
};

