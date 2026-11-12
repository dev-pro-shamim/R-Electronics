export default function AccountLoading() {
  return (
    <div className="bg-[#EDEDED] min-h-screen py-6 md:py-10">
      <div className="max-w-[1442px] mx-auto px-3 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl p-5 space-y-3 h-80 animate-pulse" />
        <div className="lg:col-span-9 bg-white rounded-2xl p-6 space-y-4 h-96 animate-pulse" />
      </div>
    </div>
  );
}
