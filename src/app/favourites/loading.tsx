export default function FavouritesLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl bg-muted animate-pulse" />
        <div className="space-y-2">
          <div className="h-6 w-40 rounded bg-muted animate-pulse" />
          <div className="h-3 w-20 rounded bg-muted animate-pulse" />
        </div>
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4 items-center animate-pulse">
            <div className="h-12 w-12 rounded-lg bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-40 rounded bg-muted" />
              <div className="h-2.5 w-28 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
