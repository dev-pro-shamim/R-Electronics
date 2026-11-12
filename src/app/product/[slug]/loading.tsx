export default function ProductLoading() {
  return (
    <div className="bg-[#EDEDED] min-h-screen py-6 lg:py-10">
      <div className="max-w-[1442px] mx-auto px-2 sm:px-4">
        <div className="h-5 w-64 bg-white/80 rounded-md animate-pulse mb-6" />
        <div className="bg-white rounded-2xl p-4 sm:p-8 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-4">
            <div className="aspect-square bg-slate-100 rounded-xl animate-pulse" />
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="size-16 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-7 space-y-5">
            <div className="h-8 w-3/4 bg-slate-100 rounded-lg animate-pulse" />
            <div className="h-5 w-48 bg-slate-100 rounded-md animate-pulse" />
            <div className="h-10 w-56 bg-slate-100 rounded-lg animate-pulse" />
            <div className="h-24 w-full bg-slate-100 rounded-xl animate-pulse" />
            <div className="flex gap-3 pt-2">
              <div className="h-12 flex-1 bg-slate-200 rounded-xl animate-pulse" />
              <div className="h-12 flex-1 bg-slate-100 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
