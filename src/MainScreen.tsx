import { useMemo, useState } from "react";
import { ChampionGrid } from "./components/ChampionGrid.tsx";
import { bundle } from "./data/bundle.ts";
import { filterChampions } from "./domain/filterChampions.ts";

const traitsById = new Map(bundle.traits.map((trait) => [trait.id, trait]));
const sortedTraits = bundle.traits.toSorted((a, b) => a.name.localeCompare(b.name));

export const MainScreen = () => {
  const [searchText, setSearchText] = useState("");
  const [traitId, setTraitId] = useState<string | null>(null);
  const visibleChampions = useMemo(
    () => filterChampions(bundle.champions, { searchText, traitId }),
    [searchText, traitId],
  );

  return (
    <div className="mx-auto max-w-5xl p-4">
      <header className="mb-4 flex items-baseline justify-between">
        <h1 className="text-xl font-semibold">TFT openers</h1>
        <span className="text-sm text-gray-400">
          Set {bundle.setNumber}, patch {bundle.patch}
        </span>
      </header>
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="search"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search champions"
          aria-label="Search champions"
          className="min-w-0 flex-1 rounded border border-white/10 bg-black/40 px-3 py-1.5 text-sm"
        />
        <select
          value={traitId ?? ""}
          onChange={(event) => setTraitId(event.target.value === "" ? null : event.target.value)}
          aria-label="Filter by trait"
          className="rounded border border-white/10 bg-black/40 px-3 py-1.5 text-sm"
        >
          <option value="">All traits</option>
          {sortedTraits.map(({ id, name }) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <ChampionGrid champions={visibleChampions} traitsById={traitsById} />
    </div>
  );
};
