export default function Loading() {
  return (
    <div className="w-full space-y-4 p-4 animate-in fade-in duration-300">
      <div className="h-8 bg-neutral-200/60 dark:bg-neutral-800/60 rounded animate-pulse w-1/4"></div>
      <div className="space-y-4 pt-4">
        <div className="h-32 bg-neutral-200/60 dark:bg-neutral-800/60 rounded-xl animate-pulse w-full"></div>
        <div className="h-64 bg-neutral-200/60 dark:bg-neutral-800/60 rounded-xl animate-pulse w-full"></div>
      </div>
    </div>
  );
}
