"use client";

import { useState } from "react";
import { getAllProducts } from "@/lib/catalog/loader";

interface IncludedItemsListProps {
  items: string[];
}

function resolveNestedIncludes(productName: string, depth = 0, maxDepth = 5): string[] {
  if (depth >= maxDepth) return [];
  const products = getAllProducts();
  const product = products.find((p) => p.name === productName);
  if (!product) return [];

  const result: string[] = [];
  for (const item of product.whatIsIncluded) {
    const match = item.match(/^Everything in (.+?), plus:$/);
    if (match) {
      const nested = resolveNestedIncludes(match[1], depth + 1, maxDepth);
      result.push(...nested);
    } else {
      result.push(item);
    }
  }
  return result;
}

function extractReference(item: string): string | null {
  const match = item.match(/^Everything in (.+?), plus:$/);
  return match ? match[1] : null;
}

export default function IncludedItemsList({ items }: IncludedItemsListProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <ul className="space-y-2">
      {items.map((item, i) => {
        const refName = extractReference(item);
        if (refName) {
          const isOpen = expanded[refName] ?? false;
          const nestedItems = resolveNestedIncludes(refName);
          return (
            <li key={i}>
              <button
                onClick={() => setExpanded((prev) => ({ ...prev, [refName]: !prev[refName] }))}
                className="flex w-full items-center gap-2 rounded border border-emerald-600/20 bg-emerald-600/5 px-3 py-2 text-left text-sm font-semibold text-emerald-400 transition hover:bg-emerald-600/10"
                aria-expanded={isOpen}
              >
                <svg
                  className={`h-3 w-3 shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <span>
                  Includes everything from <strong>{refName}</strong>, plus:
                </span>
              </button>
              {isOpen && (
                <ul className="ml-6 mt-2 space-y-1.5 border-l-2 border-emerald-600/20 pl-4">
                  {nestedItems.map((nested, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-slate-400">
                      <span className="mt-0.5 text-emerald-500/60">└</span>
                      {nested}
                    </li>
                  ))}
                  {item.replace(/^Everything in .+?, plus:\s*/, "").trim() && (
                    <li className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="mt-0.5 text-emerald-500">✓</span>
                      {item.replace(/^Everything in .+?, plus:\s*/, "").trim()}
                    </li>
                  )}
                </ul>
              )}
            </li>
          );
        }
        return (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
            <span className="mt-0.5 shrink-0 text-emerald-500">✓</span>
            <span>{item}</span>
          </li>
        );
      })}
    </ul>
  );
}
