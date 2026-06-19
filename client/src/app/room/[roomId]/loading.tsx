export default function RoomLoading() {
  return (
    <div className="h-dvh flex flex-col bg-bg-primary">
      {/* Header skeleton */}
      <div className="flex items-center justify-between px-4 py-3 bg-bg-glass border-b border-border-glass">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 animate-pulse" />
          <div className="w-24 h-4 rounded bg-white/5 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-20 h-7 rounded-lg bg-white/5 animate-pulse" />
          <div className="w-10 h-7 rounded-lg bg-white/5 animate-pulse" />
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-4 flex items-center justify-center">
          <div className="w-full max-w-5xl aspect-video rounded-2xl bg-white/5 animate-pulse" />
        </div>
        <div className="w-[350px] border-l border-border-glass hidden lg:flex flex-col">
          <div className="flex border-b border-border-glass p-2 gap-2">
            <div className="flex-1 h-8 rounded-lg bg-white/5 animate-pulse" />
            <div className="flex-1 h-8 rounded-lg bg-white/5 animate-pulse" />
          </div>
          <div className="flex-1 p-3 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
                <div className="flex-1 h-4 rounded bg-white/5 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toolbar skeleton */}
      <div className="flex items-center justify-center gap-2 px-4 py-3 bg-bg-glass border-t border-border-glass">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-24 h-8 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
