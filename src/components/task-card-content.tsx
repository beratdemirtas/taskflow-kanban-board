"use client";

import { Pencil } from "lucide-react";
import type { Task } from "@/types/board";

type TaskCardContentProps = {
  task: Task;
  onEdit?: () => void;
  isOverlay?: boolean;
};

const PRIORITY_STYLE: Record<Task["priority"], string> = {
  low: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-rose-100 text-rose-700",
};

export function TaskCardContent({ task, onEdit, isOverlay = false }: TaskCardContentProps) {
  return (
    <>
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className="break-words text-sm font-semibold text-gray-900">{task.title}</h4>
        <div className="flex items-center gap-2">
          {isOverlay ? (
            <span className="rounded-md p-1 text-gray-400">
              <Pencil size={15} />
            </span>
          ) : (
            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onEdit?.();
              }}
              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Edit task"
            >
              <Pencil size={15} />
            </button>
          )}
          <span
            className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${PRIORITY_STYLE[task.priority]}`}
          >
            {task.priority}
          </span>
        </div>
      </div>

      {task.description ? (
        <p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-sm text-gray-600">
          {task.description}
        </p>
      ) : null}
    </>
  );
}
