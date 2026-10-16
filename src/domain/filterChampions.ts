import type { Champion } from "../data/types.ts";

export type ChampionFilter = {
  searchText: string;
  traitId: string | null;
};

// Case insensitive name search combined with an optional trait filter.
export const filterChampions = (champions: Champion[], { searchText, traitId }: ChampionFilter): Champion[] => {
  const normalizedSearch = searchText.trim().toLowerCase();
  return champions.filter(
    ({ name, traitIds }) =>
      name.toLowerCase().includes(normalizedSearch) && (traitId === null || traitIds.includes(traitId)),
  );
};
