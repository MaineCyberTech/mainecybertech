interface BundleValuePanelProps {
  includedValueText: string;
  assumptions: string[];
  disclaimer: string;
}

export default function BundleValuePanel({
  includedValueText,
  assumptions,
  disclaimer,
}: BundleValuePanelProps) {
  return (
    <div className="rounded border border-emerald-600/20 bg-emerald-600/5 p-6">
      <h4 className="font-orbitron mb-3 text-sm font-bold uppercase tracking-widest text-emerald-400">
        What&rsquo;s Included
      </h4>
      <p className="mb-4 text-sm leading-relaxed text-slate-300">{includedValueText}</p>

      {assumptions.length > 0 && (
        <div className="mb-4">
          <h5 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Assumptions
          </h5>
          <ul className="list-inside list-disc space-y-1 text-xs text-slate-400">
            {assumptions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs italic text-slate-500">{disclaimer}</p>
    </div>
  );
}
