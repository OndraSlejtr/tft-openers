import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Link, useParams } from "react-router";
import { ChampionIcon } from "./components/ChampionTile.tsx";
import { bundle } from "./data/bundle.ts";
import type { Champion, Cost } from "./data/types.ts";
import type { ChampionList } from "./domain/store.ts";
import { store, useStoreState } from "./domain/useStore.ts";

const COSTS: Cost[] = [1, 2, 3, 4, 5];
const BACKLINE_OPTIONS = ["AD", "AP", "flexible"] as const;

const championsById = new Map(bundle.champions.map((champion) => [champion.id, champion]));

// Dropping a champion on the pool removes it from the opener.
const POOL_ID = "pool";

const DraggableChampion = ({ champion, source }: { champion: Champion; source: string }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${source}:${champion.id}`,
    data: { championId: champion.id },
  });
  return (
    <button
      type="button"
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      title={champion.name}
      className={`touch-none ${isDragging ? "opacity-40" : ""}`}
    >
      <ChampionIcon champion={champion} />
    </button>
  );
};

type ChampionDropListProps = {
  list: ChampionList;
  title: string;
  championIds: string[];
  onRemove: (championId: string) => void;
};

const ChampionDropList = ({ list, title, championIds, onRemove }: ChampionDropListProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: list });
  return (
    <section
      ref={setNodeRef}
      aria-label={title}
      className={`min-h-24 rounded border border-dashed p-2 ${isOver ? "border-white bg-white/10" : "border-white/20"}`}
    >
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</h3>
      {championIds.length === 0 && <p className="text-sm text-gray-400">Drag champions here.</p>}
      <ul className="flex flex-wrap gap-2">
        {championIds.map((championId) => {
          const champion = championsById.get(championId);
          return (
            champion && (
              <li key={championId} className="relative">
                <DraggableChampion champion={champion} source={list} />
                <button
                  type="button"
                  aria-label={`Remove ${champion.name}`}
                  onClick={() => onRemove(championId)}
                  className="absolute -right-1 -top-1 size-5 rounded-full bg-gray-800 text-xs leading-5 hover:bg-red-800"
                >
                  ×
                </button>
              </li>
            )
          );
        })}
      </ul>
    </section>
  );
};

const ChampionPool = () => {
  const { setNodeRef, isOver } = useDroppable({ id: POOL_ID });
  return (
    <div ref={setNodeRef} className={`flex flex-col gap-3 rounded p-2 ${isOver ? "bg-white/10" : ""}`}>
      {COSTS.map((cost, index) => (
        <section key={cost} className={index > 0 ? "border-t border-white/10 pt-3" : ""}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{cost} cost</h3>
          <ul className="flex flex-wrap gap-2">
            {bundle.champions
              .filter((champion) => champion.cost === cost)
              .map((champion) => (
                <li key={champion.id}>
                  <DraggableChampion champion={champion} source="pool" />
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
};

export const OpenerEditorPage = () => {
  const { openerId = "" } = useParams();
  const { openers } = useStoreState();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor));
  const opener = openers.find(({ id }) => id === openerId);

  if (opener === undefined) {
    return (
      <div className="mx-auto max-w-5xl p-4">
        <p className="mb-2">This opener does not exist.</p>
        <Link to="/" className="text-sm text-gray-400 hover:text-gray-200">
          Back to champions
        </Link>
      </div>
    );
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const championId = active.data.current?.championId;
    if (typeof championId !== "string" || over === null) return;
    if (over.id === "core" || over.id === "target") store.placeChampion(opener.id, championId, over.id);
    else if (over.id === POOL_ID) store.placeChampion(opener.id, championId, null);
  };

  const removeChampion = (championId: string) => store.placeChampion(opener.id, championId, null);

  return (
    <div className="mx-auto max-w-6xl p-4">
      <header className="mb-4 flex items-baseline justify-between">
        <h1 className="text-xl font-semibold">Edit opener</h1>
        <Link to="/" className="text-sm text-gray-400 hover:text-gray-200">
          Back to champions
        </Link>
      </header>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <ChampionPool />
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm">
              Name
              <input
                type="text"
                value={opener.name}
                onChange={(event) => store.updateOpener(opener.id, { name: event.target.value })}
                placeholder={store.displayName({ ...opener, name: "" })}
                className="rounded border border-white/10 bg-black/40 px-3 py-1.5"
              />
            </label>
            <ChampionDropList list="core" title="Core champions" championIds={opener.coreChampionIds} onRemove={removeChampion} />
            <ChampionDropList list="target" title="Target champions" championIds={opener.targetChampionIds} onRemove={removeChampion} />
            <div role="group" aria-label="Backline damage" className="flex flex-wrap items-center gap-2 text-sm">
              <span>Backline</span>
              {BACKLINE_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={opener.backline === option}
                  onClick={() => store.updateOpener(opener.id, { backline: option })}
                  className={`rounded border px-3 py-1 ${opener.backline === option ? "border-white/60 bg-white/15" : "border-white/10 bg-black/40"}`}
                >
                  {option}
                </button>
              ))}
            </div>
            <label className="flex flex-col gap-1 text-sm">
              Notes
              <textarea
                value={opener.notes}
                onChange={(event) => store.updateOpener(opener.id, { notes: event.target.value })}
                rows={5}
                className="rounded border border-white/10 bg-black/40 px-3 py-1.5"
              />
            </label>
          </div>
        </div>
      </DndContext>
    </div>
  );
};
