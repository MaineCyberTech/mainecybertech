"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { getServiceFinderQuiz, getProductById } from "@/lib/catalog/loader";
import type { QuizQuestion, CatalogProduct } from "@/lib/catalog/types";
import StoreProductCard from "./StoreProductCard";

interface ServiceFinderQuizProps {
  questions: QuizQuestion[];
}

type Answers = Record<string, string>;

interface Recommendations {
  quickWin?: CatalogProduct;
  bundle?: CatalogProduct;
  monthlyPlan?: CatalogProduct;
}

function computeRecommendations(answers: Answers): Recommendations {
  const quiz = getServiceFinderQuiz();
  const urgency = answers.urgency_level;

  let rec;
  if (urgency === "emergency") {
    rec = quiz.emergencyOverride;
  } else {
    const primary = answers.primary_concern;
    rec = quiz.recommendationMap.find((r) => r.when.primary_concern === primary);
  }

  if (!rec) {
    rec = quiz.recommendationMap[0];
  }

  return {
    quickWin: getProductById(rec.quickWin) || undefined,
    bundle: getProductById(rec.bundle) || undefined,
    monthlyPlan: getProductById(rec.monthlyPlan) || undefined,
  };
}

export default function ServiceFinderQuiz({ questions }: ServiceFinderQuizProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [showResults, setShowResults] = useState(false);

  const totalSteps = questions.length;
  const isLastQuestion = currentStep === totalSteps - 1;
  const isFirstQuestion = currentStep === 0;
  const currentQuestion = questions[currentStep];
  const selectedValue = answers[currentQuestion.id] || "";

  const progressPercent = ((currentStep + 1) / totalSteps) * 100;

  const handleSelect = useCallback(
    (value: string) => {
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
    },
    [currentQuestion.id],
  );

  const handleNext = useCallback(() => {
    if (isLastQuestion) {
      setShowResults(true);
    } else {
      setCurrentStep((s) => s + 1);
    }
  }, [isLastQuestion]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const handleRestart = useCallback(() => {
    setAnswers({});
    setCurrentStep(0);
    setShowResults(false);
  }, []);

  const recommendations = useMemo(() => computeRecommendations(answers), [answers]);

  const recommendedProducts = useMemo(() => {
    const items: { product: CatalogProduct; label: string }[] = [];
    if (recommendations.quickWin)
      items.push({ product: recommendations.quickWin, label: "Quick Win" });
    if (recommendations.bundle) items.push({ product: recommendations.bundle, label: "Bundle" });
    if (recommendations.monthlyPlan)
      items.push({ product: recommendations.monthlyPlan, label: "Monthly Plan" });
    return items;
  }, [recommendations]);

  if (showResults) {
    return (
      <div className="animate-fadeIn">
        <div className="glass-card rounded-2xl border border-emerald-600/20 bg-[rgba(18,30,45,0.7)] p-8 text-center backdrop-blur-xl sm:p-12">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600/20">
            <span className="text-3xl text-emerald-400">✓</span>
          </div>
          <h2 className="font-orbitron text-2xl font-bold uppercase tracking-wider text-slate-50">
            Your Recommendations
          </h2>
          <p className="mt-3 text-slate-400">
            Based on your answers, here are the services we recommend starting with.
          </p>
        </div>

        {recommendedProducts.length > 0 ? (
          <div className="mt-8 space-y-6">
            {recommendedProducts.map(({ product, label }) => (
              <div key={label} className="relative">
                <span className="mb-2 inline-block rounded-full border border-emerald-600/20 bg-emerald-600/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-emerald-400">
                  {label}
                </span>
                <StoreProductCard
                  slug={product.slug}
                  name={product.name}
                  summary={product.summary}
                  priceRange={product.priceRange}
                  categoryName={product.category}
                  categorySlug={product.categoryId}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-amber-600/20 bg-amber-600/5 p-6 text-center">
            <p className="text-sm text-amber-300">
              We could not find specific product matches for your answers.{" "}
              <Link href="/contact" className="text-emerald-400 underline">
                Contact us directly
              </Link>{" "}
              and we will help find the right fit.
            </p>
          </div>
        )}

        {recommendations.quickWin && (
          <div className="mt-10 text-center">
            <Link
              href={`/store/${recommendations.quickWin.slug}`}
              className="font-orbitron inline-block rounded border-2 border-emerald-600 bg-emerald-600 px-10 py-4 text-sm font-bold uppercase tracking-widest text-[#0A1118] transition hover:bg-transparent hover:text-emerald-500 hover:shadow-[0_0_25px_rgba(5,150,105,0.5)]"
            >
              Start With a Quick Win
            </Link>
            <p className="mt-3 text-xs text-slate-500">
              Not sure?{" "}
              <Link href="/contact" className="text-emerald-400 underline">
                Talk to a human
              </Link>
            </p>
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={handleRestart}
            className="rounded border border-white/10 px-6 py-2 text-sm text-slate-400 transition hover:border-emerald-600/30 hover:text-slate-200"
          >
            Retake Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
          <span>
            Question {currentStep + 1} of {totalSteps}
          </span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-white/10 bg-[rgba(18,30,45,0.7)] p-8 backdrop-blur-xl sm:p-12">
        <h2 className="font-orbitron text-xl font-bold uppercase tracking-wider text-slate-50">
          {currentQuestion.label}
        </h2>
        {!currentQuestion.required && <p className="mt-1 text-xs text-slate-500">(optional)</p>}

        <div className="mt-8 space-y-3">
          {currentQuestion.options.map((option) => {
            const isSelected = selectedValue === option.value;
            return (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`w-full rounded-xl border px-6 py-4 text-left text-sm font-medium transition-all ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-600/15 text-emerald-300 shadow-[0_0_15px_rgba(5,150,105,0.15)]"
                    : "border-white/10 bg-white/5 text-slate-300 hover:border-emerald-600/30 hover:bg-emerald-600/5 hover:text-slate-100"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={isFirstQuestion}
          className={`rounded border px-6 py-3 text-sm font-semibold transition ${
            isFirstQuestion
              ? "border-white/5 text-slate-600"
              : "border-white/10 text-slate-300 hover:border-emerald-600/30 hover:text-emerald-400"
          }`}
        >
          ← Back
        </button>

        <button
          onClick={handleNext}
          disabled={currentQuestion.required && !selectedValue}
          className={`rounded px-8 py-3 text-sm font-bold uppercase tracking-widest transition ${
            currentQuestion.required && !selectedValue
              ? "border border-white/10 bg-white/5 text-slate-600"
              : "border-2 border-emerald-600 bg-emerald-600 text-[#0A1118] hover:bg-transparent hover:text-emerald-500 hover:shadow-[0_0_25px_rgba(5,150,105,0.5)]"
          }`}
        >
          {isLastQuestion ? "See Results →" : "Next →"}
        </button>
      </div>
    </div>
  );
}
