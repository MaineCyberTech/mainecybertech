export default function QuoteBuilderPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-sm font-semibold tracking-wide text-cyan-600 uppercase">Quote Builder</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Build a service quote request.</h1>
      <p className="text-muted-foreground mt-4">
        Add quick wins, bundles, monthly care plans, and add-ons. Maine Cyber Tech will review the
        request before scope is final.
      </p>
      <button className="mt-6 rounded-xl bg-cyan-600 px-4 py-2 font-semibold text-white">
        Request Quote Review
      </button>
    </main>
  );
}
