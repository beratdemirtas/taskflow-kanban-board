"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/types/board";
import { TaskCardContent } from "@/components/task-card-content";

type SortableCardProps = {
  task: Task;
  onOpen: (taskId: string) => void;
};

export function SortableCard({ task, onOpen }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: "task", columnId: task.columnId } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-all active:cursor-grabbing ${
        isDragging
          ? "rotate-1 shadow-2xl ring-2 ring-blue-200"
          : "hover:shadow-md"
      }`}
    >
      <TaskCardContent task={task} onEdit={() => onOpen(task.id)} />
    </article>
  );
}
