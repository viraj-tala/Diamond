import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  /** Number of placeholder lines. When > 1, renders a stack of lines with slight width variation. */
  lines?: number;
}

export function Skeleton({ className, lines = 1 }: SkeletonProps) {
  if (lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "skeleton h-3",
              i === lines - 1 ? "w-2/3" : "w-full",
              className,
            )}
          />
        ))}
      </div>
    );
  }
  return <div className={cn("skeleton h-3 w-full", className)} />;
}

/** Convenience: full row of skeleton cells for tables that are loading. */
export function SkeletonTableRow({ columns }: { columns: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-3" />
        </td>
      ))}
    </tr>
  );
}

/** Skeleton card body — title + two lines of text. */
export function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton lines={2} />
    </div>
  );
}
