import type { Component, CompletedItem } from "../src/data/types.ts";
import { COMPONENT_SIDES, EMBLEM_CATEGORIES, EXCLUDED_ITEM_IDS, ITEM_CATEGORIES } from "./curation.ts";
import { ImportError, expectArray, expectRecord, expectString, toIconPath } from "./shape.ts";

export type CatalogEntry = {
  apiName: string;
  // Many unused catalog entries have no name, so it is checked where an entry is used.
  name: unknown;
  icon: unknown;
  desc: string;
  composition: string[];
  associatedTraits: string[];
  tags: string[];
};

export type ItemCatalog = Map<string, CatalogEntry>;

const readStrings = (value: unknown, path: string) =>
  expectArray(value, path).map((entry, index) => expectString(entry, `${path}[${index}]`));

// The top level item list holds items and augments of every set.
export const readItemCatalog = (cdragonRoot: Record<string, unknown>): ItemCatalog =>
  new Map(
    expectArray(cdragonRoot.items, "items").map((raw, index) => {
      const path = `items[${index}]`;
      const entry = expectRecord(raw, path);
      const apiName = expectString(entry.apiName, `${path}.apiName`);
      return [
        apiName,
        {
          apiName,
          name: entry.name,
          icon: entry.icon,
          desc: typeof entry.desc === "string" ? entry.desc : "",
          composition: readStrings(entry.composition, `${path}.composition`),
          associatedTraits: readStrings(entry.associatedTraits, `${path}.associatedTraits`),
          tags: readStrings(entry.tags, `${path}.tags`),
        },
      ];
    }),
  );

export const readSetIds = (setEntry: Record<string, unknown>, key: "items" | "augments"): string[] =>
  readStrings(setEntry[key], `setData[].${key}`);

export const lookup = (catalog: ItemCatalog, id: string, context: string): CatalogEntry => {
  const entry = catalog.get(id);
  if (entry === undefined) throw new ImportError(`${context} references unknown id ${id}`);
  return entry;
};

export const nameOf = ({ apiName, name }: CatalogEntry): string => expectString(name, `name of ${apiName}`);

export const iconOf = ({ apiName, icon }: CatalogEntry): string =>
  toIconPath(expectString(icon, `icon of ${apiName}`), `icon of ${apiName}`);

const EXCLUDED_ITEM_NAME = /artifact|radiant/i;

const isComponent = ({ apiName, tags }: CatalogEntry) => apiName.startsWith("DA_") && tags.includes("component");

const isExcludedItem = ({ apiName, name }: CatalogEntry) =>
  EXCLUDED_ITEM_IDS.includes(apiName) || EXCLUDED_ITEM_NAME.test(apiName) || EXCLUDED_ITEM_NAME.test(String(name));

const isEmblem = ({ apiName, name }: CatalogEntry) => /emblem/i.test(apiName) || /emblem/i.test(String(name));

const isCompletedItem = (entry: CatalogEntry) =>
  entry.apiName.startsWith("DA_") && entry.composition.length === 2 && !isExcludedItem(entry);

export const buildItems = (
  setEntry: Record<string, unknown>,
  catalog: ItemCatalog,
): { components: Component[]; items: CompletedItem[] } => {
  const setEntries = readSetIds(setEntry, "items").map((id) => lookup(catalog, id, "set items"));
  const componentEntries = setEntries.filter(isComponent);
  if (componentEntries.length === 0) throw new ImportError("no components found");
  const componentIds = new Set(componentEntries.map(({ apiName }) => apiName));

  const items = setEntries.filter(isCompletedItem).map((entry): CompletedItem => {
    const [first, second] = entry.composition.map((componentId) => {
      if (!componentIds.has(componentId)) {
        throw new ImportError(`item ${entry.apiName} is built from unknown component ${componentId}`);
      }
      return componentId;
    });
    const emblem = isEmblem(entry);
    const categories = emblem ? EMBLEM_CATEGORIES : (ITEM_CATEGORIES[entry.apiName] ?? []);
    return {
      id: entry.apiName,
      name: nameOf(entry),
      icon: iconOf(entry),
      emblem,
      componentIds: [first, second],
      categories,
      guessed: categories.length > 0,
    };
  });
  if (items.length === 0) throw new ImportError("no completed items found");

  const components = componentEntries.map((entry): Component => {
    const side = COMPONENT_SIDES[entry.apiName] ?? null;
    return {
      id: entry.apiName,
      name: nameOf(entry),
      icon: iconOf(entry),
      side,
      guessed: side !== null,
      builtInto: items.filter(({ componentIds: parts }) => parts.includes(entry.apiName)).map(({ id }) => id),
    };
  });

  return { components, items };
};
