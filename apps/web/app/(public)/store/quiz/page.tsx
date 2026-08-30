import { getQuizQuestions } from "@/lib/catalog/loader";
import ServiceFinderQuiz from "@/components/store/ServiceFinderQuiz";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Service Finder Quiz",
  description:
    "Answer a few quick questions and we will recommend the right IT service for your situation. No commitment, no pressure.",
  path: "/store/quiz",
});

export default function QuizPage() {
  const questions = getQuizQuestions();

  return (
    <section className="min-h-screen px-4 pb-20 pt-32 sm:px-6 sm:pt-40">
      <div className="mx-auto max-w-2xl">
        <div className="mb-10 text-center">
          <h1 className="font-orbitron text-4xl font-bold uppercase tracking-wider text-slate-50 sm:text-5xl">
            Service{" "}
            <span className="text-emerald-500 drop-shadow-[0_0_15px_rgba(5,150,105,0.5)]">
              Finder
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-slate-400">
            Answer a few quick questions and we will recommend the right IT service for your
            situation. No commitment, no pressure.
          </p>
        </div>
        <ServiceFinderQuiz questions={questions} />
      </div>
    </section>
  );
}
