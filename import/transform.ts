import { unflatten } from "devalue";
import type { Champion, Cost, DataBundle } from "../src/data/types.ts";
import { ImportError, expectArray, expectNumber, expectRecord, expectString } from "./shape.ts";

export const SET_NUMBER = 18;
const SET_MUTATOR = `TFTSet${SET_NUMBER}`;

export type RawSources = {
  // Parsed en_us.json from Community Dragon.
  cdragon: unknown;
  // Parsed __data.json from the tftacademy comp tier list.
  academy: unknown;
};

const toIconPath = (gamePath: string, path: string) => {
  if (!gamePath.endsWith(".tex")) throw new ImportError(`unexpected icon path "${gamePath}" at ${path}`);
  return gamePath.toLowerCase().replace(/\.tex$/, ".png");
};

type RawChampion = { apiName: string; name: string; cost: number; icon: string };

const readChampions = (setEntry: Record<string, unknown>): RawChampion[] =>
  expectArray(setEntry.champions, "setData[].champions").map((raw, index) => {
    const path = `champions[${index}]`;
    const champion = expectRecord(raw, path);
    return {
      apiName: expectString(champion.apiName, `${path}.apiName`),
      name: expectString(champion.name, `${path}.name`),
      cost: expectNumber(champion.cost, `${path}.cost`),
      // Entries without a shop icon are not shop units, so a missing icon is read as empty.
      icon: typeof champion.tileIcon === "string" ? champion.tileIcon : "",
    };
  });

const isShopChampion = ({ apiName, cost, icon }: RawChampion) =>
  apiName.startsWith("DA_") && Number.isInteger(cost) && cost >= 1 && cost <= 5 && icon !== "";

const VARIANT_NAME = /^(.+) \(.+\)$/;

const baseNameOf = ({ name }: RawChampion) => VARIANT_NAME.exec(name)?.[1];

// Variants are named "Base (Trait)". They collapse into the entry named "Base".
const collapseVariants = (champions: RawChampion[]): Champion[] => {
  const baseNames = new Set(champions.filter((champion) => baseNameOf(champion) === undefined).map(({ name }) => name));
  const isVariant = (champion: RawChampion) => {
    const baseName = baseNameOf(champion);
    return baseName !== undefined && baseNames.has(baseName);
  };
  const variants = champions.filter(isVariant);
  return champions
    .filter((champion) => !isVariant(champion))
    .map(({ apiName, name, cost, icon }) => ({
      id: apiName,
      name,
      cost: cost as Cost,
      icon: toIconPath(icon, `champion ${apiName} tileIcon`),
      variantIds: [apiName, ...variants.filter((variant) => baseNameOf(variant) === name).map((variant) => variant.apiName)],
    }));
};

const readPatch = (academy: unknown): string => {
  const root = expectRecord(academy, "tftacademy response");
  const [layoutNode] = expectArray(root.nodes, "tftacademy nodes");
  const layout = expectRecord(layoutNode, "tftacademy nodes[0]");
  const decoded = expectRecord(unflatten(expectArray(layout.data, "tftacademy nodes[0].data")), "tftacademy layout data");
  const patch = expectString(decoded.patch, "tftacademy patch");
  if (patch === "") throw new ImportError("tftacademy patch is empty");
  return patch;
};

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

  const champions = collapseVariants(readChampions(setEntry).filter(isShopChampion)).toSorted(costOrder);
  if (champions.length === 0) throw new ImportError("no shop champions found");

  return { setNumber: SET_NUMBER, patch: readPatch(academy), champions };
};
