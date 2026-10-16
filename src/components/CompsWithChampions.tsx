import { bundle } from "../data/bundle.ts";
import type { CompMatch } from "../domain/store.ts";

const championNameById = new Map(bundle.champions.map(({ id, name }) => [id, name]));

type CompsWithChampionsProps = {
  matches: CompMatch[];
  hasSelection: boolean;
};

export const CompsWithChampions = ({ matches, hasSelection }: CompsWithChampionsProps) => (
  <section>
    <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400">Comps with your champions</h2>
    {!hasSelection && <p className="text-sm text-gray-400">Select champions to see the comps they fit.</p>}
    {hasSelection && matches.length === 0 && <p className="text-sm text-gray-400">No comp has these champions.</p>}
    <ul className="flex flex-col gap-2">
      {matches.map(({ comp, matchedChampionIds }) => (
        <li key={comp.slug} className="rounded border border-white/10 p-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-white/15 px-1.5 py-0.5 text-xs font-semibold">Tier {comp.tier}</span>
            {comp.style !== "" && <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs">{comp.style}</span>}
            <span className="text-sm font-medium">{comp.title}</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            {matchedChampionIds.map((id) => championNameById.get(id) ?? id).join(", ")}
          </p>
        </li>
      ))}
    </ul>
  </section>
);
