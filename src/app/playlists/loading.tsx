export default function PlaylistsLoading() {
  return (
    <div className="px-2 sm:px-4 py-6 max-w-4xl mx-auto animate-pulse">
      <div className="h-8 w-48 bg-muted rounded mb-8" />
      <div className="h-11 bg-muted rounded-lg mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
