export default function PageLoading() {
  return (
    <div className="bg-[#EDEDED] min-h-screen py-8">
      <div className="container max-w-5xl space-y-4">
        <div className="h-8 w-64 bg-white rounded-lg animate-pulse" />
        <div className="h-64 w-full bg-white rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}
