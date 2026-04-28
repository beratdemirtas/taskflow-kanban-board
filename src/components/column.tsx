"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import type { Column as ColumnType, Task } from "@/types/board";
import { SortableCard } from "@/components/sortable-card";

type ColumnProps = {
  column: ColumnType;
  tasks: Task[];
  onAddTask: (columnId: string, title: string) => void;
  onOpenTask: (taskId: string) => void;
  onRenameColumn: (columnId: string, title: string) => void;
  onDeleteColumn: (columnId: string) => void;
};

export function Column({
  column,
  tasks,
  onAddTask,
  onOpenTask,
  onRenameColumn,
  onDeleteColumn,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { type: "column" } });
  const [title, setTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [columnTitle, setColumnTitle] = useState(column.title);

  useEffect(() => {
    setColumnTitle(column.title);
  }, [column.title]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;
    onAddTask(column.id, title.trim());
    setTitle("");
  };

  const handleColumnTitleSave = () => {
    const nextTitle = columnTitle.trim();
    if (!nextTitle) {
      setColumnTitle(column.title);
      setIsEditingTitle(false);
      return;
    }
    onRenameColumn(column.id, nextTitle);
    setIsEditingTitle(false);
  };

  return (
    <section className="w-full rounded-2xl border border-gray-200 bg-gray-100/70 p-4 md:flex md:h-full md:w-[320px] md:shrink-0 md:flex-col">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          {isEditingTitle ? (
            <input
              value={columnTitle}
              onChange={(event) => setColumnTitle(event.target.value)}
              onBlur={handleColumnTitleSave}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleColumnTitleSave();
                if (event.key === "Escape") {
                  setColumnTitle(column.title);
                  setIsEditingTitle(false);
                }
              }}
              className="w-32 rounded-md border border-gray-200 bg-white px-2 py-1 text-sm font-semibold uppercase tracking-wide text-gray-700 outline-none ring-blue-300 focus:ring-2"
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingTitle(true)}
              className="truncate text-left text-sm font-semibold uppercase tracking-wide text-gray-700"
            >
              {column.title}
            </button>
          )}
          <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-gray-500">
            {tasks.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onDeleteColumn(column.id)}
          className="rounded-md p-1 text-gray-400 hover:bg-gray-200 hover:text-rose-600"
          aria-label="Delete column"
        >
          <Trash2 size={16} />
        </button>
      </header>

      <form onSubmit={handleSubmit} className="mb-3 flex gap-2">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none ring-blue-300 focus:ring-2"
          placeholder="Add a task"
        />
        <button
          type="submit"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 text-white transition hover:bg-gray-800"
          aria-label="Add task"
        >
          <Plus size={16} />
        </button>
      </form>

      <div
        ref={setNodeRef}
        className={`min-h-16 space-y-3 rounded-xl p-1 transition md:flex-1 ${
          isOver ? "bg-blue-100/60" : "bg-transparent"
        }`}
      >
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableCard key={task.id} task={task} onOpen={onOpenTask} />
          ))}
        </SortableContext>
      </div>
    </section>
  );
}
