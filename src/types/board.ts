export type Task = {
  id: string;
  title: string;
  description: string;
  columnId: string;
  priority: "low" | "medium" | "high";
};

export type Column = {
  id: string;
  title: string;
};

export type BoardItem = {
  id: string;
  title: string;
  columns: Column[];
  tasks: Task[];
};

export type BoardsState = {
  boards: BoardItem[];
  activeBoardId: string | null;
};
