"use client";

const STORAGE_KEY = "mct_quote_items";

export function getQuoteItems(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToQuote(slug: string): void {
  const items = getQuoteItems();
  if (!items.includes(slug)) {
    items.push(slug);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }
}

export function removeFromQuote(slug: string): void {
  const items = getQuoteItems().filter((s) => s !== slug);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function isInQuote(slug: string): boolean {
  return getQuoteItems().includes(slug);
}

export function clearQuote(): void {
  localStorage.removeItem(STORAGE_KEY);
}
