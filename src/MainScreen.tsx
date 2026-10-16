import { Link } from "react-router";
import { useMemo, useState } from "react";
import { ChampionGrid } from "./components/ChampionGrid.tsx";
import { CompsWithChampions } from "./components/CompsWithChampions.tsx";
import { bundle } from "./data/bundle.ts";
import { filterChampions } from "./domain/filterChampions.ts";
import { store, useStoreState } from "./domain/useStore.ts";

const traitsById = new Map(bundle.traits.map((trait) => [trait.id, trait]));
const sortedTraits = bundle.traits.toSorted((a, b) => a.name.localeCompare(b.name));

export const MainScreen = () => {
  const { selectedChampionIds } = useStoreState();
  const [searchText, setSearchText] = useState("");
  const [traitId, setTraitId] = useState<string | null>(null);
  const visibleChampions = useMemo(
    () => filterChampions(bundle.champions, { searchText, traitId }),
    [searchText, traitId],
  );

  return (
    <div className="mx-auto max-w-6xl p-4">
      <header className="mb-4 flex items-baseline justify-between">
        <h1 className="text-xl font-semibold">TFT openers</h1>
        <div className="flex items-baseline gap-4 text-sm text-gray-400">
          <Link to="/data" className="hover:text-gray-200">
            Data
          </Link>
          <span>
            Set {bundle.setNumber}, patch {bundle.patch}
          </span>
        </div>
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
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div>
          <ChampionGrid
            champions={visibleChampions}
            traitsById={traitsById}
            selectedChampionIds={selectedChampionIds}
            onToggleChampion={store.toggleChampion}
          />
        </div>
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={store.clearSelection}
            disabled={selectedChampionIds.length === 0}
            className="self-start rounded border border-white/10 bg-black/40 px-3 py-1 text-sm disabled:opacity-40"
          >
            Clear selection ({selectedChampionIds.length})
          </button>
          <CompsWithChampions
            matches={store.compsWithSelectedChampions()}
            hasSelection={selectedChampionIds.length > 0}
          />
        </div>
      </div>
    </div>
  );
};
