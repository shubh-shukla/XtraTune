import { Skeleton } from "@/components/ui/skeleton";

export default function RadioLoading() {
  return (
    <div className="space-y-10 px-4 lg:px-8 py-6 animate-pulse">
      <div className="space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-5 w-96" />
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-8 w-40" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((j) => (
              <div key={j} className="space-y-2">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
