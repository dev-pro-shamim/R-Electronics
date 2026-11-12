export default function CatalogGridLoading() {
  return (
    <div className="bg-[#EDEDED] min-h-screen py-6 md:py-10">
      <div className="container space-y-6">
        <div className="h-5 w-48 bg-white rounded-md animate-pulse" />
        <div className="h-20 w-full bg-white rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {Array.from({ length: 10 }).map((_, idx) => (
            <div key={idx} className="bg-white rounded-xl p-3 space-y-3 shadow-xs">
              <div className="aspect-square rounded-lg bg-slate-100 animate-pulse" />
              <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-slate-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
