interface TrackEvent {
  event: string;
  page?: string;
  productId?: string;
  categoryId?: string;
  promoId?: string;
  quizId?: string;
  quoteId?: string;
  campaignId?: string;
  metadata?: Record<string, unknown>;
}

const eventLog: TrackEvent[] = [];

export function track(event: string, data?: Omit<TrackEvent, "event">) {
  const entry: TrackEvent = { event, ...data };
  eventLog.push(entry);
  try {
    const payload = {
      ...entry,
      timestamp: new Date().toISOString(),
      anonymousId: typeof window !== "undefined" ? localStorage.getItem("anon_id") : null,
    };
    fetch("/api/v1/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch {}
}

export function getEventLog(): TrackEvent[] {
  return [...eventLog];
}

export function clearEventLog(): void {
  eventLog.length = 0;
}
