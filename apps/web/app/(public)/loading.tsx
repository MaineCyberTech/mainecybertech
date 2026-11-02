export default function PublicLoading() {
  return (
    // MOB-P3-006: the skeleton bars used fixed widths (`w-96` = 384px) that
    // overflow a 360px phone viewport while the segment streams, which the
    // mobile no-overflow gate caught as scrollWidth 372. Constrain the
    // skeleton to the viewport (`w-full` + a max width) so the fallback can
    // never be wider than the page it replaces.
    <div className="relative flex min-h-screen animate-pulse flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto h-12 w-full max-w-[18rem] rounded bg-white/5" />
        <div className="mx-auto h-4 w-full max-w-[24rem] rounded bg-white/5" />
        <div className="mx-auto h-10 w-40 rounded-lg bg-white/5" />
      </div>
    </div>
  );
}
