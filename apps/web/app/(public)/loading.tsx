export default function PublicLoading() {
  return (
    <div className="relative flex min-h-screen animate-pulse flex-col items-center justify-center">
      <div className="space-y-6 text-center">
        <div className="mx-auto h-12 w-72 rounded bg-white/5" />
        <div className="mx-auto h-4 w-96 rounded bg-white/5" />
        <div className="mx-auto h-10 w-40 rounded-lg bg-white/5" />
      </div>
    </div>
  );
}
