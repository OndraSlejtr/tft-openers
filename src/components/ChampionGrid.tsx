import { iconUrl } from "../data/bundle.ts";
import type { Champion, Cost } from "../data/types.ts";

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
};

export const ChampionGrid = ({ champions }: ChampionGridProps) => (
  <div className="flex flex-col gap-3">
    {COSTS.map((cost) => ({ cost, tier: champions.filter((champion) => champion.cost === cost) }))
      .filter(({ tier }) => tier.length > 0)
      .map(({ cost, tier }, index) => (
        <section key={cost} className={index > 0 ? "border-t border-white/10 pt-3" : ""}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{cost} cost</h2>
          <ul className="flex flex-wrap gap-2">
            {tier.map((champion) => (
              <li key={champion.id}>
                <div
                  title={champion.name}
                  className={`size-14 overflow-hidden rounded border-2 bg-black/40 ${BORDER_BY_COST[cost]}`}
                >
                  <img src={iconUrl(champion.icon)} alt={champion.name} loading="lazy" className="size-full object-cover" />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
  </div>
);
