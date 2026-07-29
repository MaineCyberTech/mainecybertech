import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import { getServiceFinderQuiz } from "@/lib/catalog/loader";

export const dynamic = "force-dynamic";
export const metadata = { title: "Service Finder Quiz Editor - Admin - Maine CyberTech" };

export default async function AdminQuizPage() {
  await requireAdminAccess();
  const quiz = getServiceFinderQuiz();

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Store", href: "/admin/store" },
            { label: "Quiz" },
          ]}
        />
      }
      subnav={<AdminSubnav current="store-quiz" />}
      title="Service Finder Quiz"
      description="Review the quiz questions, options, and recommendation mappings. Edit by updating the JSON data file."
    >
      <div className="mt-6 space-y-6">
        <div className="glass-card rounded-xl border border-white/10 p-6">
          <div className="mb-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Goal
            </span>
            <p className="mt-1 text-sm text-slate-300">{quiz.goal}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-white/5 bg-white/5 p-4">
              <span className="text-2xl font-bold text-emerald-400">{quiz.questions.length}</span>
              <p className="mt-1 text-xs text-slate-500">Questions</p>
            </div>
            <div className="rounded-lg border border-white/5 bg-white/5 p-4">
              <span className="text-2xl font-bold text-emerald-400">
                {quiz.recommendationMap.length}
              </span>
              <p className="mt-1 text-xs text-slate-500">Recommendation Rules</p>
            </div>
            <div className="rounded-lg border border-white/5 bg-white/5 p-4">
              <span className="text-2xl font-bold text-emerald-400">
                {quiz.questions.reduce((s, q) => s + q.options.length, 0)}
              </span>
              <p className="mt-1 text-xs text-slate-500">Total Options</p>
            </div>
          </div>
        </div>

        <h3 className="font-orbitron text-lg font-bold uppercase tracking-wider text-slate-50">
          Questions
        </h3>

        <div className="space-y-4">
          {quiz.questions.map((q, idx) => (
            <div key={q.id} className="glass-card rounded-xl border border-white/10 p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
                    Q{idx + 1}
                  </span>
                  <h4 className="mt-1 font-semibold text-slate-50">{q.label}</h4>
                </div>
                <div className="flex shrink-0 gap-2">
                  <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase text-slate-500">
                    {q.type}
                  </span>
                  {q.required ? (
                    <span className="rounded bg-amber-600/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                      Required
                    </span>
                  ) : (
                    <span className="rounded bg-slate-600/10 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                      Optional
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {q.options.map((opt) => (
                  <span
                    key={opt.value}
                    className="rounded border border-white/5 bg-white/5 px-3 py-1 text-xs text-slate-400"
                  >
                    {opt.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <h3 className="font-orbitron mt-8 text-lg font-bold uppercase tracking-wider text-slate-50">
          Recommendation Map
        </h3>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-400">When</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Quick Win</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Bundle</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Monthly Plan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {quiz.recommendationMap.map((rec, idx) => (
                <tr key={idx} className="hover:bg-white/5">
                  <td className="px-4 py-3 text-slate-300">
                    {Object.entries(rec.when)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(", ")}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{rec.quickWin}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{rec.bundle}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{rec.monthlyPlan}</td>
                </tr>
              ))}
              {quiz.emergencyOverride && (
                <tr className="bg-red-500/5 hover:bg-red-500/10">
                  <td className="px-4 py-3 font-semibold text-red-300">
                    {Object.entries(quiz.emergencyOverride.when)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(", ")}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">
                    {quiz.emergencyOverride.quickWin}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">
                    {quiz.emergencyOverride.bundle}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">
                    {quiz.emergencyOverride.monthlyPlan}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8 rounded-lg border border-slate-700/50 bg-slate-800/30 p-6">
          <h4 className="mb-3 text-sm font-semibold text-slate-400">JSON Preview</h4>
          <pre className="max-h-96 overflow-auto rounded bg-[#0A1118] p-4 text-xs text-slate-400">
            {JSON.stringify(quiz, null, 2)}
          </pre>
          <p className="mt-3 text-xs text-slate-500">
            To edit the quiz, modify the data file at{" "}
            <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-emerald-400">
              lib/catalog/data/service-finder-quiz.json
            </code>
          </p>
        </div>
      </div>
    </AdminPageShell>
  );
}
