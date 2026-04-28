"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useUser } from "@clerk/nextjs";
import { v4 as uuid } from "uuid";
import { Check, Plus, SquarePen, Trash2, X } from "lucide-react";
import { Column } from "@/components/column";
import { TaskCardContent } from "@/components/task-card-content";
import type { BoardItem, BoardsState, Column as ColumnType, Task } from "@/types/board";

const createDefaultColumns = (): ColumnType[] => [
  { id: uuid(), title: "To Do" },
  { id: uuid(), title: "In Progress" },
  { id: uuid(), title: "Done" },
];

const createInitialBoard = (title = "My Board"): BoardItem => ({
  id: uuid(),
  title,
  columns: createDefaultColumns(),
  tasks: [],
});

function loadBoardsState(storageKey: string): BoardsState {
  const fallbackBoard = createInitialBoard();
  if (typeof window === "undefined") {
    return { boards: [fallbackBoard], activeBoardId: fallbackBoard.id };
  }
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return { boards: [fallbackBoard], activeBoardId: fallbackBoard.id };
    const parsed = JSON.parse(stored) as BoardsState;
    if (!Array.isArray(parsed.boards)) {
      return { boards: [fallbackBoard], activeBoardId: fallbackBoard.id };
    }
    const activeExists = parsed.boards.some((board) => board.id === parsed.activeBoardId);
    if (!activeExists) {
      return {
        boards: parsed.boards,
        activeBoardId: parsed.boards[0]?.id ?? null,
      };
    }
    return parsed;
  } catch {
    return { boards: [fallbackBoard], activeBoardId: fallbackBoard.id };
  }
}

export function Board() {
  const { user, isLoaded } = useUser();
  const [boardsState, setBoardsState] = useState<BoardsState>({ boards: [], activeBoardId: null });
  const [hydrated, setHydrated] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const columnsScrollRef = useRef<HTMLDivElement | null>(null);
  const storageKey = useMemo(() => `taskflow-board-state:${user?.id ?? "anonymous"}`, [user?.id]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  );

  useEffect(() => {
    if (!isLoaded || !user?.id) return;
    setBoardsState(loadBoardsState(storageKey));
    setHydrated(true);
  }, [isLoaded, storageKey, user?.id]);

  useEffect(() => {
    if (!hydrated || !user?.id) return;
    window.localStorage.setItem(storageKey, JSON.stringify(boardsState));
  }, [boardsState, hydrated, storageKey, user?.id]);

  const activeBoard = useMemo(
    () => boardsState.boards.find((board) => board.id === boardsState.activeBoardId) ?? null,
    [boardsState.activeBoardId, boardsState.boards],
  );

  const taskMap = useMemo(() => {
    const map = new Map<string, Task[]>();
    if (!activeBoard) return map;
    for (const column of activeBoard.columns) map.set(column.id, []);
    for (const task of activeBoard.tasks) {
      const list = map.get(task.columnId);
      if (list) list.push(task);
    }
    return map;
  }, [activeBoard]);

  const activeTask = useMemo(
    () => activeBoard?.tasks.find((task) => task.id === activeTaskId) ?? null,
    [activeBoard, activeTaskId],
  );
  const selectedTask = useMemo(
    () => activeBoard?.tasks.find((task) => task.id === selectedTaskId) ?? null,
    [activeBoard, selectedTaskId],
  );

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = window.setTimeout(() => setToastMessage(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  useEffect(() => {
    if (!selectedTaskId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setSelectedTaskId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedTaskId]);

  useEffect(() => {
    setSelectedTaskId(null);
    setActiveTaskId(null);
  }, [boardsState.activeBoardId]);

  const updateActiveBoard = (updater: (board: BoardItem) => BoardItem) => {
    setBoardsState((current) => {
      if (!current.activeBoardId) return current;
      return {
        ...current,
        boards: current.boards.map((board) =>
          board.id === current.activeBoardId ? updater(board) : board,
        ),
      };
    });
  };

  const createBoard = () => {
    const title = window.prompt("Board title", `Board ${boardsState.boards.length + 1}`)?.trim();
    if (!title) return;
    const nextBoard = createInitialBoard(title);
    setBoardsState((current) => ({
      boards: [...current.boards, nextBoard],
      activeBoardId: nextBoard.id,
    }));
    setToastMessage("Board created");
  };

  const renameBoard = (boardId: string) => {
    const board = boardsState.boards.find((item) => item.id === boardId);
    if (!board) return;
    const nextTitle = window.prompt("Rename board", board.title)?.trim();
    if (!nextTitle) return;
    setBoardsState((current) => ({
      ...current,
      boards: current.boards.map((item) =>
        item.id === boardId ? { ...item, title: nextTitle } : item,
      ),
    }));
    setToastMessage("Board renamed");
  };

  const deleteBoard = (boardId: string) => {
    const board = boardsState.boards.find((item) => item.id === boardId);
    if (!board) return;
    if (!window.confirm(`Delete "${board.title}" board?`)) return;
    setBoardsState((current) => {
      const remainingBoards = current.boards.filter((item) => item.id !== boardId);
      return {
        boards: remainingBoards,
        activeBoardId: remainingBoards[0]?.id ?? null,
      };
    });
    setToastMessage("Board deleted");
  };

  const addColumn = () => {
    const title = window.prompt("Column title", "New Column")?.trim();
    if (!title) return;
    updateActiveBoard((board) => ({
      ...board,
      columns: [...board.columns, { id: uuid(), title }],
    }));
    setToastMessage("Column added");
  };

  const renameColumn = (columnId: string, title: string) => {
    updateActiveBoard((board) => ({
      ...board,
      columns: board.columns.map((column) => (column.id === columnId ? { ...column, title } : column)),
    }));
  };

  const deleteColumn = (columnId: string) => {
    if (!activeBoard) return;
    if (activeBoard.columns.length <= 1) {
      setToastMessage("At least one column is required");
      return;
    }
    updateActiveBoard((board) => {
      const remainingColumns = board.columns.filter((column) => column.id !== columnId);
      const fallbackColumnId = remainingColumns[0]?.id ?? columnId;
      return {
        ...board,
        columns: remainingColumns,
        tasks: board.tasks.map((task) =>
          task.columnId === columnId ? { ...task, columnId: fallbackColumnId } : task,
        ),
      };
    });
    setToastMessage("Column deleted");
  };

  const addTask = (columnId: string, title: string) => {
    updateActiveBoard((board) => ({
      ...board,
      tasks: [
        ...board.tasks,
        {
          id: uuid(),
          title,
          description: "",
          columnId,
          priority: "medium",
        },
      ],
    }));
  };

  const updateTask = (taskId: string, patch: Partial<Omit<Task, "id">>) => {
    updateActiveBoard((board) => ({
      ...board,
      tasks: board.tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task)),
    }));
  };

  const deleteTask = (taskId: string) => {
    updateActiveBoard((board) => ({
      ...board,
      tasks: board.tasks.filter((task) => task.id !== taskId),
    }));
    setSelectedTaskId(null);
    setToastMessage("Task deleted");
  };

  const handleModalInput =
    (field: "title" | "description") =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (!selectedTaskId) return;
      updateTask(selectedTaskId, { [field]: event.target.value });
    };

  const handleStatusChange = (event: ChangeEvent<HTMLSelectElement>) => {
    if (!selectedTaskId) return;
    updateTask(selectedTaskId, { columnId: event.target.value });
  };

  const handlePriorityChange = (event: ChangeEvent<HTMLSelectElement>) => {
    if (!selectedTaskId) return;
    updateTask(selectedTaskId, { priority: event.target.value as Task["priority"] });
    setToastMessage("Task updated");
  };

  const handleTitleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (!selectedTaskId || !selectedTask) return;
    const nextTitle = selectedTask.title.trim() || "Untitled Task";
    updateTask(selectedTaskId, { title: nextTitle });
    setToastMessage("Task saved");
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTaskId(null);
    const { active, over } = event;
    if (!over || !activeBoard) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    updateActiveBoard((board) => {
      const activeTaskIndex = board.tasks.findIndex((task) => task.id === activeId);
      if (activeTaskIndex === -1) return board;
      const draggedTask = board.tasks[activeTaskIndex];
      const overTaskIndex = board.tasks.findIndex((task) => task.id === overId);

      if (overTaskIndex !== -1) {
        const overTask = board.tasks[overTaskIndex];
        const nextTasks = [...board.tasks];
        nextTasks[activeTaskIndex] = { ...draggedTask, columnId: overTask.columnId };
        return { ...board, tasks: arrayMove(nextTasks, activeTaskIndex, overTaskIndex) };
      }

      const targetColumnExists = board.columns.some((column) => column.id === overId);
      if (!targetColumnExists) return board;
      const updatedTask = { ...draggedTask, columnId: overId };
      const withoutActive = board.tasks.filter((task) => task.id !== activeId);
      const lastTargetIndex = withoutActive.reduce<number>(
        (lastIndex, task, index) => (task.columnId === overId ? index : lastIndex),
        -1,
      );
      const insertionIndex = lastTargetIndex + 1;
      const nextTasks = [...withoutActive];
      nextTasks.splice(insertionIndex, 0, updatedTask);
      return { ...board, tasks: nextTasks };
    });
  };

  if (!isLoaded || !user?.id) return null;

  return (
    <>
      <section className="flex h-full min-w-0 flex-col">
        <div className="shrink-0 overflow-x-auto">
          <div className="flex min-w-max items-end gap-1">
            {boardsState.boards.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500">
                No boards found
              </p>
            ) : (
              boardsState.boards.map((board) => {
                const isActive = boardsState.activeBoardId === board.id;
                return (
                  <div
                    key={board.id}
                    className={`flex items-center gap-1 rounded-t-lg border px-3 py-2 ${
                      isActive
                        ? "border-gray-300 border-b-white bg-white"
                        : "border-gray-200 bg-gray-100 text-gray-600"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setBoardsState((current) => ({ ...current, activeBoardId: board.id }))
                      }
                      className={`max-w-40 truncate text-sm font-medium ${
                        isActive ? "text-gray-900" : "text-gray-700"
                      }`}
                    >
                      {board.title}
                    </button>
                    <button
                      type="button"
                      onClick={() => renameBoard(board.id)}
                      className="rounded p-1 text-gray-500 hover:bg-gray-200"
                      aria-label="Rename board"
                    >
                      <SquarePen size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteBoard(board.id)}
                      className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-rose-600"
                      aria-label="Delete board"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })
            )}
            <button
              type="button"
              onClick={createBoard}
              className="inline-flex h-9 w-9 items-center justify-center rounded-t-lg border border-gray-300 border-b-white bg-white text-gray-700 hover:bg-gray-100"
              aria-label="Create board"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {activeBoard ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div ref={columnsScrollRef} className="min-h-0 flex-1 md:overflow-x-auto md:overflow-y-hidden">
              <div className="flex flex-col gap-4 md:h-full md:min-w-max md:flex-row">
                {activeBoard.columns.map((column) => (
                  <Column
                    key={column.id}
                    column={column}
                    tasks={taskMap.get(column.id) ?? []}
                    onAddTask={addTask}
                    onOpenTask={setSelectedTaskId}
                    onRenameColumn={renameColumn}
                    onDeleteColumn={deleteColumn}
                  />
                ))}
                <button
                  type="button"
                  onClick={addColumn}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 bg-white px-4 text-sm font-medium text-gray-600 hover:border-gray-400 hover:text-gray-800 md:w-[220px] md:shrink-0"
                >
                  <Plus size={16} />
                  Add Column
                </button>
              </div>
            </div>

            <DragOverlay>
              {activeTask ? (
                <article className="w-[288px] rounded-xl border border-gray-200 bg-white p-3 shadow-2xl ring-2 ring-blue-200">
                  <TaskCardContent task={activeTask} isOverlay />
                </article>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
            No boards found
          </div>
        )}
      </section>

      {selectedTask ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Task Details</h2>
              <button
                type="button"
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
                onClick={() => setSelectedTaskId(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Title</label>
                <input
                  value={selectedTask.title}
                  onChange={handleModalInput("title")}
                  onKeyDown={handleTitleKeyDown}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-blue-300 focus:ring-2"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={selectedTask.description}
                  onChange={handleModalInput("description")}
                  className="min-h-24 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-blue-300 focus:ring-2"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={selectedTask.columnId}
                    onChange={handleStatusChange}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none ring-blue-300 focus:ring-2"
                  >
                    {activeBoard?.columns.map((column) => (
                      <option key={column.id} value={column.id}>
                        {column.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Priority</label>
                  <select
                    value={selectedTask.priority}
                    onChange={handlePriorityChange}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none ring-blue-300 focus:ring-2"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => deleteTask(selectedTask.id)}
                  className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextTitle = selectedTask.title.trim() || "Untitled Task";
                    updateTask(selectedTask.id, { title: nextTitle });
                    setSelectedTaskId(null);
                    setToastMessage("Task saved");
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  <Check size={16} />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {toastMessage ? (
        <div className="pointer-events-none fixed bottom-5 right-5 z-[60] rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-xl">
          {toastMessage}
        </div>
      ) : null}
    </>
  );
}
