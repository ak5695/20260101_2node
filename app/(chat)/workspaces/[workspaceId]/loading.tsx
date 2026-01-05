export default function Loading() {
  return (
    <div className="flex w-full h-screen overflow-hidden bg-[#1e1e1e] text-white">
      {/* Sidebar skeleton */}
      <div className="w-[50px] h-full bg-[#1e1e1e] border-r border-[#333] flex flex-col items-center py-4 gap-3">
        <div className="w-6 h-6 rounded bg-white/10 animate-pulse" />
        <div className="w-6 h-6 rounded bg-white/10 animate-pulse" />
        <div className="w-6 h-6 rounded bg-white/10 animate-pulse" />
        <div className="w-6 h-6 rounded bg-white/10 animate-pulse" />
      </div>
      
      {/* Canvas skeleton */}
      <div className="flex-1 relative h-full min-w-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
          <div className="text-sm text-zinc-500 animate-pulse">加载画布...</div>
        </div>
      </div>
    </div>
  );
}
