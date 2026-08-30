import { getPackageLadders } from "@/lib/catalog/v5-loaders";
import PackageLadder from "./PackageLadder";

export default function PackageLadderGrid() {
  const ladders = getPackageLadders();
  if (ladders.length === 0) return null;

  return (
    <div className="space-y-12">
      {ladders.map((ladder) => (
        <div key={ladder.category}>
          <h3 className="font-orbitron mb-6 text-center text-2xl font-bold uppercase tracking-wider text-slate-50">
            {ladder.category} <span className="text-emerald-500">Packages</span>
          </h3>
          <PackageLadder category={ladder.category} />
        </div>
      ))}
    </div>
  );
}
