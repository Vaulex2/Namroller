import React from 'react';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, useSortable, arrayMove,
  verticalListSortingStrategy, rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Icon } from '../../Icon';

function SortableItem({ id, children, dragHandle = true }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const dragHandleProps = dragHandle ? { ...attributes, ...listeners } : {};
  return (
    <div ref={setNodeRef} style={style}>
      {children({ dragHandleProps, isDragging })}
    </div>
  );
}

/* Thin @dnd-kit wrapper: pass items + a renderItem(item, {dragHandleProps})
   and get real drag-and-drop reorder with an onReorder(newOrderedIds)
   callback. Caller keeps its own row/card markup and just spreads
   dragHandleProps onto a grip icon. Used by VideosPanel and ProductsPanel. */
export function SortableList({ items, itemKey, onReorder, renderItem, direction = 'vertical' }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = items.map(itemKey);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(active.id);
    const newIndex = ids.indexOf(over.id);
    onReorder(arrayMove(ids, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={direction === 'vertical' ? verticalListSortingStrategy : rectSortingStrategy}>
        {items.map((item) => (
          <SortableItem key={itemKey(item)} id={itemKey(item)}>
            {(props) => renderItem(item, props)}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  );
}

/* Small grip handle for attaching dragHandleProps to. */
export function DragHandle(props) {
  return (
    <span
      {...props}
      style={{ cursor: 'grab', display: 'inline-flex', color: 'var(--text-muted)', touchAction: 'none' }}
      aria-label="Drag to reorder"
    >
      <Icon name="grip" size={16} />
    </span>
  );
}
