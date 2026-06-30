'use client';

export default function Watermark() {
  return (
    <div
      className="fixed bottom-2 right-3 sm:bottom-3 sm:right-4 z-[90] pointer-events-none select-none safe-area-bottom"
      aria-hidden="true"
    >
      <div className="flex items-center gap-1.5 opacity-30">
        {/* Mini SyncRoom logo */}
        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
          <svg
            width="8"
            height="8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            className="sm:w-[10px] sm:h-[10px]"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
        <span className="text-[9px] sm:text-[11px] font-medium text-text-muted tracking-wide">
          SyncRoom by Uzair
        </span>
      </div>
    </div>
  );
}
