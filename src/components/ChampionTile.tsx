import { PLACEHOLDER_ICON, iconUrl } from "../data/bundle.ts";
import type { Champion, Cost } from "../data/types.ts";

export const BORDER_BY_COST: Record<Cost, string> = {
  1: "border-cost-1",
  2: "border-cost-2",
  3: "border-cost-3",
  4: "border-cost-4",
  5: "border-cost-5",
};

export const ChampionIcon = ({ champion, className = "size-12" }: { champion: Champion; className?: string }) => (
  <span className={`block overflow-hidden rounded border-2 bg-black/40 ${BORDER_BY_COST[champion.cost]} ${className}`}>
    <img src={iconUrl(champion.icon ?? PLACEHOLDER_ICON)} alt={champion.name} loading="lazy" className="size-full object-cover" />
  </span>
);
