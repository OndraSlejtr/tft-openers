import { unflatten } from "devalue";
import type { Augment, Champion, Comp, CompUnit } from "../src/data/types.ts";
import { IGNORED_UNIT_IDS } from "./curation.ts";
import type { ItemCatalog } from "./items.ts";
import { ImportError, expectArray, expectBoolean, expectNumber, expectRecord, expectString } from "./shape.ts";

// SvelteKit sends each page node as a flattened devalue payload.
const decodeNodes = (academy: unknown): Record<string, unknown>[] =>
  expectArray(expectRecord(academy, "tftacademy response").nodes, "tftacademy nodes").flatMap((node, index) => {
    if (typeof node !== "object" || node === null || !("data" in node)) return [];
    const data = expectArray(node.data, `tftacademy nodes[${index}].data`);
    return [expectRecord(unflatten(data), `tftacademy nodes[${index}] data`)];
  });

export const readPatch = (academy: unknown): string => {
  const patch = decodeNodes(academy).find((node) => "patch" in node)?.patch;
  if (patch === undefined) throw new ImportError("tftacademy response has no patch");
  const patchText = expectString(patch, "tftacademy patch");
  if (patchText === "") throw new ImportError("tftacademy patch is empty");
  return patchText;
};

const readGuides = (academy: unknown): unknown[] => {
  const guides = decodeNodes(academy).find((node) => "guides" in node)?.guides;
  if (guides === undefined) throw new ImportError("tftacademy response has no guides");
  return expectArray(guides, "tftacademy guides");
};

type Lookups = {
  championIdByAnyId: Map<string, string>;
  catalog: ItemCatalog;
  augmentIds: Set<string>;
};

const readEntries = (value: unknown, path: string) =>
  expectArray(value, path).map((entry, index) => expectRecord(entry, `${path}[${index}]`));

const resolveItemId = (id: unknown, path: string, { catalog }: Lookups) => {
  const itemId = expectString(id, path);
  if (!catalog.has(itemId)) throw new ImportError(`unknown item ${itemId} at ${path}`);
  return itemId;
};

const readBoard = (value: unknown, path: string, lookups: Lookups): CompUnit[] =>
  readEntries(value, path).flatMap((unit, index) => {
    const unitPath = `${path}[${index}]`;
    const apiName = expectString(unit.apiName, `${unitPath}.apiName`);
    if (IGNORED_UNIT_IDS.includes(apiName)) return [];
    const championId = lookups.championIdByAnyId.get(apiName);
    if (championId === undefined) throw new ImportError(`unknown champion ${apiName} at ${unitPath}`);
    return [
      {
        championId,
        itemIds: expectArray(unit.items, `${unitPath}.items`).map((id, itemIndex) =>
          resolveItemId(id, `${unitPath}.items[${itemIndex}]`, lookups),
        ),
        stars: expectNumber(unit.stars, `${unitPath}.stars`),
      },
    ];
  });

const readGuide = (guide: Record<string, unknown>, lookups: Lookups): Comp => {
  const slug = expectString(guide.compSlug, "guide.compSlug");
  const path = `guide ${slug}`;
  const mainApiName = expectString(expectRecord(guide.mainChampion, `${path}.mainChampion`).apiName, `${path}.mainChampion.apiName`);
  const mainChampionId = lookups.championIdByAnyId.get(mainApiName);
  if (mainChampionId === undefined) throw new ImportError(`unknown champion ${mainApiName} at ${path}.mainChampion`);

  return {
    slug,
    title: expectString(guide.title, `${path}.title`),
    tier: expectString(guide.tier, `${path}.tier`),
    style: expectString(guide.style, `${path}.style`),
    difficulty: expectString(guide.difficulty, `${path}.difficulty`),
    mainChampionId,
    earlyBoard: readBoard(guide.earlyComp, `${path}.earlyComp`, lookups),
    finalBoard: readBoard(guide.finalComp, `${path}.finalComp`, lookups),
    carouselItemIds: readEntries(guide.carousel, `${path}.carousel`).map((entry, index) =>
      resolveItemId(entry.apiName, `${path}.carousel[${index}].apiName`, lookups),
    ),
    // Augments missing from Community Dragon are deprecated or unimplemented, so they are skipped.
    augmentIds: readEntries(guide.augments, `${path}.augments`)
      .filter((entry) => !expectBoolean(entry.disabled, `${path}.augments[].disabled`))
      .map((entry) => expectString(entry.apiName, `${path}.augments[].apiName`))
      .filter((id) => lookups.augmentIds.has(id)),
    augmentTypes: expectArray(guide.augmentTypes, `${path}.augmentTypes`).map((type, index) =>
      expectString(type, `${path}.augmentTypes[${index}]`),
    ),
    stageTips: readEntries(guide.tips, `${path}.tips`).map((tip, index) => ({
      stage: expectString(tip.stage, `${path}.tips[${index}].stage`),
      tip: expectString(tip.tip, `${path}.tips[${index}].tip`),
    })),
    updated: expectString(guide.updated, `${path}.updated`),
  };
};

export const buildComps = (
  academy: unknown,
  setNumber: number,
  champions: Champion[],
  augments: Augment[],
  catalog: ItemCatalog,
): Comp[] => {
  const lookups: Lookups = {
    championIdByAnyId: new Map(champions.flatMap(({ id, variantIds }) => variantIds.map((variantId) => [variantId, id]))),
    catalog,
    augmentIds: new Set(augments.map(({ id }) => id)),
  };
  const comps = readGuides(academy)
    .map((guide, index) => expectRecord(guide, `guides[${index}]`))
    // Guides that are not public are drafts on tftacademy.
    .filter((guide) => expectBoolean(guide.isPublic, "guide.isPublic"))
    .map((guide) => {
      if (expectNumber(guide.set, "guide.set") !== setNumber) {
        throw new ImportError(`guide ${String(guide.compSlug)} belongs to set ${String(guide.set)}`);
      }
      return readGuide(guide, lookups);
    });

  const duplicate = comps.find(({ slug }, index) => comps.findIndex((other) => other.slug === slug) !== index);
  if (duplicate !== undefined) throw new ImportError(`duplicate comp slug ${duplicate.slug}`);
  if (comps.length === 0) throw new ImportError("no public comps found");
  return comps;
};
