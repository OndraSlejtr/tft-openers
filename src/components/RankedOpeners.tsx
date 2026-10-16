import { bundle } from "../data/bundle.ts";
import type { RankedOpener } from "../domain/store.ts";
import { OpenerActions } from "./OpenerList.tsx";

const championNameById = new Map(bundle.champions.map(({ id, name }) => [id, name]));

type RankedOpenersProps = {
  rankedOpeners: RankedOpener[];
  hasSelection: boolean;
};

export const RankedOpeners = ({ rankedOpeners, hasSelection }: RankedOpenersProps) => (
  <section>
    <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400">Openers</h2>
    {!hasSelection && <p className="text-sm text-gray-400">Select champions to rank your openers.</p>}
    {hasSelection && rankedOpeners.length === 0 && <p className="text-sm text-gray-400">No opener matches these champions.</p>}
    <ul className="flex flex-col gap-2">
      {rankedOpeners.map(({ opener, displayName, coreMatchCount, targetMatchCount, bestTier }) => (
        <li key={opener.id} className="rounded border border-white/10 p-2">
          <div className="flex flex-wrap items-center gap-2">
            {bestTier !== null && <span className="rounded bg-white/15 px-1.5 py-0.5 text-xs font-semibold">Tier {bestTier}</span>}
            <span className="text-sm font-medium">{displayName}</span>
            <OpenerActions openerId={opener.id} />
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Core: {opener.coreChampionIds.map((id) => championNameById.get(id) ?? id).join(", ") || "none"}
          </p>
          <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-gray-400">
            <span>Backline: {opener.backline}</span>
            <span>Top augment: {opener.augmentPriority[0]}</span>
            <span>
              Matches: {coreMatchCount} core, {targetMatchCount} target
            </span>
          </p>
        </li>
      ))}
    </ul>
  </section>
);
