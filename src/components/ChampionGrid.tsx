import { PLACEHOLDER_ICON, iconUrl } from "../data/bundle.ts";
import { BORDER_BY_COST } from "./ChampionTile.tsx";
import type { Champion, Cost, Trait } from "../data/types.ts";

const COSTS: Cost[] = [1, 2, 3, 4, 5];

type ChampionGridProps = {
  champions: Champion[];
  traitsById: Map<string, Trait>;
  selectedChampionIds: readonly string[];
  onToggleChampion: (championId: string) => void;
};

export const ChampionGrid = ({ champions, traitsById, selectedChampionIds, onToggleChampion }: ChampionGridProps) => {
  const tiers = COSTS.map((cost) => ({ cost, tier: champions.filter((champion) => champion.cost === cost) })).filter(
    ({ tier }) => tier.length > 0,
  );
  if (tiers.length === 0) return <p className="text-sm text-gray-400">No champions match.</p>;

  return (
    <div className="flex flex-col gap-3">
      {tiers.map(({ cost, tier }, index) => (
        <section key={cost} className={index > 0 ? "border-t border-white/10 pt-3" : ""}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{cost} cost</h2>
          <ul className="flex flex-wrap gap-2">
            {tier.map((champion) => (
              <li key={champion.id} className="group relative">
                <button
                  type="button"
                  aria-pressed={selectedChampionIds.includes(champion.id)}
                  onClick={() => onToggleChampion(champion.id)}
                  className={`block size-14 overflow-hidden rounded border-2 bg-black/40 ${BORDER_BY_COST[cost]} ${
                    selectedChampionIds.includes(champion.id) ? "ring-2 ring-white" : "opacity-80 hover:opacity-100"
                  }`}
                >
                  <img src={iconUrl(champion.icon ?? PLACEHOLDER_ICON)} alt={champion.name} loading="lazy" className="size-full object-cover" />
                </button>
                <div
                  role="tooltip"
                  className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 hidden -translate-x-1/2 rounded border border-white/10 bg-gray-900 p-2 text-xs shadow-lg group-hover:block"
                >
                  <p className="whitespace-nowrap font-semibold">{champion.name}</p>
                  <ul className="mt-1 flex flex-col gap-1">
                    {champion.traitIds.map((traitId) => {
                      const trait = traitsById.get(traitId);
                      return (
                        <li key={traitId} className="flex items-center gap-1 whitespace-nowrap">
                          {trait && <img src={iconUrl(trait.icon)} alt="" className="size-4" />}
                          {trait?.name ?? traitId}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
};
