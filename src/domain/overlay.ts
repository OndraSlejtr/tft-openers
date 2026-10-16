import type { AugmentCategory, BacklineDamage, Opener, RequiredItems } from "../data/types.ts";

// Everything the user changed, stored on top of the bundled defaults.
export type Overlay = {
  version: 1;
  openers: Opener[];
};

export const emptyOverlay = (): Overlay => ({ version: 1, openers: [] });

const AUGMENT_CATEGORIES: AugmentCategory[] = ["econ", "item", "combat", "special"];
const BACKLINE_VALUES: BacklineDamage[] = ["AD", "AP", "flexible"];

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const fail = (path: string, expected: string): never => {
  throw new Error(`Invalid data at ${path}, expected ${expected}`);
};

const readString = (record: UnknownRecord, key: string, path: string) => {
  const value = record[key];
  return typeof value === "string" ? value : fail(`${path}.${key}`, "a string");
};

const readStringList = (record: UnknownRecord, key: string, path: string) => {
  const value = record[key];
  return Array.isArray(value) && value.every((entry) => typeof entry === "string")
    ? (value as string[])
    : fail(`${path}.${key}`, "a list of strings");
};

const readOneOf = <T extends string>(record: UnknownRecord, key: string, path: string, allowed: readonly T[]): T => {
  const value = record[key];
  return allowed.find((option) => option === value) ?? fail(`${path}.${key}`, `one of ${allowed.join(", ")}`);
};

const readRequiredItems = (record: UnknownRecord, path: string): RequiredItems[] => {
  const value = record.requiredItems;
  if (!Array.isArray(value)) return fail(`${path}.requiredItems`, "a list");
  return value.map((entry: unknown, index) => {
    const entryPath = `${path}.requiredItems[${index}]`;
    if (!isRecord(entry)) return fail(entryPath, "an object");
    return { championId: readString(entry, "championId", entryPath), itemIds: readStringList(entry, "itemIds", entryPath) };
  });
};

const readAugmentPriority = (record: UnknownRecord, path: string): AugmentCategory[] => {
  const priority = readStringList(record, "augmentPriority", path);
  const isPermutation =
    priority.length === AUGMENT_CATEGORIES.length && AUGMENT_CATEGORIES.every((category) => priority.includes(category));
  return isPermutation ? (priority as AugmentCategory[]) : fail(`${path}.augmentPriority`, "all four augment categories once");
};

const readOpener = (value: unknown, path: string): Opener => {
  if (!isRecord(value)) return fail(path, "an object");
  const editedAtPatch = value.editedAtPatch;
  if (editedAtPatch !== null && typeof editedAtPatch !== "string") return fail(`${path}.editedAtPatch`, "a string or null");
  return {
    id: readString(value, "id", path),
    name: readString(value, "name", path),
    coreChampionIds: readStringList(value, "coreChampionIds", path),
    targetChampionIds: readStringList(value, "targetChampionIds", path),
    backline: readOneOf(value, "backline", path, BACKLINE_VALUES),
    requiredItems: readRequiredItems(value, path),
    augmentPriority: readAugmentPriority(value, path),
    keyAugmentIds: readStringList(value, "keyAugmentIds", path),
    compSlugs: readStringList(value, "compSlugs", path),
    notes: readString(value, "notes", path),
    source: readOneOf(value, "source", path, ["tftacademy", "user"]),
    status: readOneOf(value, "status", path, ["draft", "active"]),
    editedAtPatch,
  };
};

// Parses stored or imported JSON text. Throws on any mismatch, nothing is applied partially.
export const parseOverlay = (text: string): Overlay => {
  const data: unknown = JSON.parse(text);
  if (!isRecord(data)) return fail("overlay", "an object");
  if (data.version !== 1) return fail("overlay.version", "1");
  if (!Array.isArray(data.openers)) return fail("overlay.openers", "a list");
  return { version: 1, openers: data.openers.map((opener: unknown, index) => readOpener(opener, `openers[${index}]`)) };
};

export const serializeOverlay = (overlay: Overlay) => JSON.stringify(overlay);
