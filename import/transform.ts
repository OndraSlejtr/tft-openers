import type { Champion, Cost, DataBundle, Trait } from "../src/data/types.ts";
import { buildAugments } from "./augments.ts";
import { buildComps, readPatch } from "./comps.ts";
import { buildItems, readItemCatalog } from "./items.ts";
import { ImportError, expectArray, expectNumber, expectRecord, expectString, toIconPath } from "./shape.ts";

export const SET_NUMBER = 18;
const SET_MUTATOR = `TFTSet${SET_NUMBER}`;

export type RawSources = {
  // Parsed en_us.json from Community Dragon.
  cdragon: unknown;
  // Parsed __data.json from the tftacademy comp tier list.
  academy: unknown;
};

type RawChampion = { apiName: string; name: string; cost: number; icon: string | null; traitNames: string[] };

const readChampions = (setEntry: Record<string, unknown>): RawChampion[] =>
  expectArray(setEntry.champions, "setData[].champions").map((raw, index) => {
    const path = `champions[${index}]`;
    const champion = expectRecord(raw, path);
    return {
      apiName: expectString(champion.apiName, `${path}.apiName`),
      name: expectString(champion.name, `${path}.name`),
      cost: expectNumber(champion.cost, `${path}.cost`),
      icon: typeof champion.tileIcon === "string" ? champion.tileIcon : null,
      traitNames: expectArray(champion.traits, `${path}.traits`).map((trait, traitIndex) =>
        expectString(trait, `${path}.traits[${traitIndex}]`),
      ),
    };
  });

const isShopChampion = ({ apiName, cost }: RawChampion) =>
  apiName.startsWith("DA_") && Number.isInteger(cost) && cost >= 1 && cost <= 5;

// A champion without a usable icon stays in the grid and gets the placeholder in the app.
const toChampionIcon = (icon: string | null, apiName: string) =>
  icon !== null && icon.endsWith(".tex") ? toIconPath(icon, `champion ${apiName} tileIcon`) : null;

const VARIANT_NAME = /^(.+) \(.+\)$/;

const baseNameOf = ({ name }: RawChampion) => VARIANT_NAME.exec(name)?.[1];

// Variants are named "Base (Trait)". They collapse into the entry named "Base".
const collapseVariants = (champions: RawChampion[], traitIdByName: Map<string, string>): Champion[] => {
  const baseNames = new Set(champions.filter((champion) => baseNameOf(champion) === undefined).map(({ name }) => name));
  const isVariant = (champion: RawChampion) => {
    const baseName = baseNameOf(champion);
    return baseName !== undefined && baseNames.has(baseName);
  };
  const variants = champions.filter(isVariant);
  return champions
    .filter((champion) => !isVariant(champion))
    .map(({ apiName, name, cost, icon, traitNames }) => ({
      id: apiName,
      name,
      cost: cost as Cost,
      icon: toChampionIcon(icon, apiName),
      traitIds: traitNames.map((traitName) => {
        const traitId = traitIdByName.get(traitName);
        if (traitId === undefined) throw new ImportError(`champion ${apiName} has unknown trait "${traitName}"`);
        return traitId;
      }),
      variantIds: [apiName, ...variants.filter((variant) => baseNameOf(variant) === name).map((variant) => variant.apiName)],
    }));
};

const readTraits = (setEntry: Record<string, unknown>): Trait[] =>
  expectArray(setEntry.traits, "setData[].traits").map((raw, index) => {
    const path = `traits[${index}]`;
    const trait = expectRecord(raw, path);
    return {
      id: expectString(trait.apiName, `${path}.apiName`),
      name: expectString(trait.name, `${path}.name`),
      icon: toIconPath(expectString(trait.icon, `${path}.icon`), `${path}.icon`),
    };
  });

const costOrder = (a: Champion, b: Champion) => a.cost - b.cost || a.name.localeCompare(b.name);

export const transform = ({ cdragon, academy }: RawSources): DataBundle => {
  const root = expectRecord(cdragon, "cdragon response");
  const setEntry = expectArray(root.setData, "setData")
    .map((entry, index) => expectRecord(entry, `setData[${index}]`))
    .find((entry) => entry.mutator === SET_MUTATOR);
  if (setEntry === undefined) throw new ImportError(`no set data with mutator ${SET_MUTATOR}`);
  if (expectNumber(setEntry.number, "set number") !== SET_NUMBER) {
    throw new ImportError(`${SET_MUTATOR} has an unexpected set number ${String(setEntry.number)}`);
  }

  const traits = readTraits(setEntry);
  const traitIdByName = new Map(traits.map(({ id, name }) => [name, id]));
  const champions = collapseVariants(readChampions(setEntry).filter(isShopChampion), traitIdByName).toSorted(costOrder);
  // A variant name that does not collapse means the naming scheme changed.
  const uncollapsed = champions.find(({ name }) => VARIANT_NAME.test(name));
  if (uncollapsed !== undefined) {
    throw new ImportError(`champion "${uncollapsed.name}" looks like a variant but has no base champion`);
  }
  if (champions.length === 0) throw new ImportError("no shop champions found");

  const catalog = readItemCatalog(root);
  const { components, items } = buildItems(setEntry, catalog);
  const augments = buildAugments(setEntry, catalog, champions);

  const comps = buildComps(academy, SET_NUMBER, champions, augments, catalog);

  return { setNumber: SET_NUMBER, patch: readPatch(academy), traits, champions, components, items, augments, comps };
};
