import { describe, expect, it } from "vitest";
import type { Champion } from "../data/types.ts";
import { filterChampions } from "./filterChampions.ts";

const champion = (name: string, traitIds: string[]): Champion => ({
  id: name,
  name,
  cost: 1,
  icon: "",
  variantIds: [name],
  traitIds,
});

const champions = [
  champion("Azir", ["DA_18_Blackthorn", "DA_18_Executioner"]),
  champion("Karma", ["DA_18_Blossom"]),
  champion("Kha'Zix", ["DA_18_Rival"]),
];

const names = (searchText: string, traitId: string | null) =>
  filterChampions(champions, { searchText, traitId }).map(({ name }) => name);

describe("filterChampions", () => {
  it("returns everything without a filter", () => {
    expect(names("", null)).toHaveLength(champions.length);
  });

  it("matches names case insensitively", () => {
    expect(names("aZiR", null)).toEqual(["Azir"]);
    expect(names("k", null)).toEqual(["Karma", "Kha'Zix"]);
  });

  it("ignores surrounding whitespace in the search", () => {
    expect(names("  azir ", null)).toEqual(["Azir"]);
  });

  it("filters by trait", () => {
    const result = names("", "DA_18_Executioner");
    expect(result).toContain("Azir");
    expect(result).not.toContain("Karma");
  });

  it("combines search and trait filter", () => {
    expect(names("azir", "DA_18_Executioner")).toEqual(["Azir"]);
    expect(names("karma", "DA_18_Executioner")).toEqual([]);
  });

  it("returns nothing when no name matches", () => {
    expect(names("zzzz", null)).toEqual([]);
  });
});
