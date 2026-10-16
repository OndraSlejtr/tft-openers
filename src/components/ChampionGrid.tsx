import { iconUrl } from "../data/bundle.ts";
import type { Champion, Cost, Trait } from "../data/types.ts";

const COSTS: Cost[] = [1, 2, 3, 4, 5];

const BORDER_BY_COST: Record<Cost, string> = {
  1: "border-cost-1",
  2: "border-cost-2",
  3: "border-cost-3",
  4: "border-cost-4",
  5: "border-cost-5",
};

type ChampionGridProps = {
  champions: Champion[];
  traitsById: Map<string, Trait>;
};

export const ChampionGrid = ({ champions, traitsById }: ChampionGridProps) => {
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
                <div className={`size-14 overflow-hidden rounded border-2 bg-black/40 ${BORDER_BY_COST[cost]}`}>
                  <img src={iconUrl(champion.icon)} alt={champion.name} loading="lazy" className="size-full object-cover" />
                </div>
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
