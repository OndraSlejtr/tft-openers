import { DndContext, type DragEndEvent, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, horizontalListSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { AugmentCategory } from "../data/types.ts";

const SortableCategory = ({ category, rank }: { category: AugmentCategory; rank: number }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: category });
  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="touch-none cursor-grab rounded border border-white/20 bg-black/40 px-3 py-1 text-sm"
    >
      {rank}. {category}
    </li>
  );
};

type AugmentPriorityProps = {
  priority: readonly AugmentCategory[];
  onChange: (priority: AugmentCategory[]) => void;
};

export const AugmentPriority = ({ priority, onChange }: AugmentPriorityProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over === null || active.id === over.id) return;
    const from = priority.findIndex((category) => category === active.id);
    const to = priority.findIndex((category) => category === over.id);
    if (from !== -1 && to !== -1) onChange(arrayMove([...priority], from, to));
  };

  return (
    <section aria-label="Augment priority">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Augment priority, drag to reorder</h3>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={[...priority]} strategy={horizontalListSortingStrategy}>
          <ul className="flex flex-wrap gap-2">
            {priority.map((category, index) => (
              <SortableCategory key={category} category={category} rank={index + 1} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </section>
  );
};
