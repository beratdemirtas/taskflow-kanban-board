import { UserButton } from "@clerk/nextjs";
import { Board } from "@/components/board";

export default function HomePage() {
  return (
    <main className="h-screen overflow-hidden bg-gray-50 px-4 pt-4 md:px-8 md:pt-6">
      <div className="mx-auto flex h-full w-full max-w-none min-h-0 flex-col">
        <header className="mb-3 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">TaskFlow</h1>
              <p className="mt-1 text-sm text-gray-600">
                Organize tasks with a clean drag-and-drop workflow.
              </p>
            </div>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </header>
        <div className="min-h-0 flex-1">
          <Board />
        </div>
      </div>
    </main>
  );
}
