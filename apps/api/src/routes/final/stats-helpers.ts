export function computeSharepointSummary(items: any[]) {
  return {
    totalPlans: items.length,
    plannedSites: items.filter((s) => s.status === "planned").length,
    activeSites: items.filter((s) => s.status === "active").length,
    teamsWithExternalSharing: items.filter((s) => s.external_sharing === "enabled").length,
  };
}

export function computeBackupStats(items: any[]) {
  const failed = items.filter((b) => b.last_backup_status === "failed").length;
  const untested = items.filter((b) => !b.restore_test_result).length;
  const offsite = items.filter((b) => b.offsite_replicated).length;
  const encrypted = items.filter((b) => b.encryption_enabled).length;
  return { total: items.length, failed, untested, offsiteReplicated: offsite, encrypted };
}

export function computeBackupRisk(items: any[]) {
  const total = items.length;
  const failed = items.filter(
    (b) => b.last_backup_status === "failed" || b.status === "failed",
  ).length;
  const untested = items.filter((b) => b.restore_tested_at === null).length;
  const riskScore = total > 0 ? Math.round(((failed * 3 + untested * 2) / (total * 3)) * 100) : 0;
  return {
    total,
    failed,
    untested,
    riskScore,
    riskLevel: riskScore > 50 ? "high" : riskScore > 25 ? "medium" : "low",
  };
}

export function computeBudgetAnalysis(items: any[]) {
  const totalProjected = items.reduce((s: number, b: any) => s + (b.estimated_cost || 0), 0);
  const totalActual = items.reduce((s: number, b: any) => s + (b.estimated_cost || 0), 0);
  const variance =
    totalProjected > 0 ? Math.round(((totalActual - totalProjected) / totalProjected) * 100) : 0;
  return {
    totalProjected,
    totalActual,
    variance,
    totalCategories: items.length,
    categories: items.map((b: any) => ({
      category: b.category,
      projected: b.estimated_cost,
      actual: null,
      variance: 0,
    })),
  };
}

export function computeProcurementCompare(quotes: any[]) {
  const priced = quotes.map((q: any) => ({
    ...q,
    price: Number(q.quote_amount) || 0,
  }));
  const lowestPrice = priced.length > 0 ? Math.min(...priced.map((q: any) => q.price)) : 0;
  const highestPrice = priced.length > 0 ? Math.max(...priced.map((q: any) => q.price)) : 0;
  return {
    quotes: priced.map((q: any) => ({
      ...q,
      savings: q.price ? Math.round((1 - q.price / highestPrice) * 100) : 0,
      isLowest: q.price === lowestPrice,
    })),
    lowestPrice,
    highestPrice,
    averagePrice:
      priced.length > 0
        ? Math.round((priced.reduce((s: number, q: any) => s + q.price, 0) / priced.length) * 100) /
          100
        : 0,
  };
}

export function computeTimeEntriesSummary(items: any[], days: number) {
  const totalHours = items.reduce((s: number, t: any) => s + Number(t.hours || 0), 0);
  const billableHours = items
    .filter((t: any) => t.billable)
    .reduce((s: number, t: any) => s + Number(t.hours || 0), 0);
  const byDate: Record<string, { hours: number; billable: number; entries: number }> = {};
  for (const t of items) {
    const key = t.work_date ? String(t.work_date).slice(0, 10) : "unknown";
    if (!byDate[key]) byDate[key] = { hours: 0, billable: 0, entries: 0 };
    byDate[key].hours += Number(t.hours || 0);
    if (t.billable) byDate[key].billable += Number(t.hours || 0);
    byDate[key].entries++;
  }
  return {
    periodDays: days,
    totalEntries: items.length,
    totalHours: Math.round(totalHours * 100) / 100,
    billableHours: Math.round(billableHours * 100) / 100,
    nonBillableHours: Math.round((totalHours - billableHours) * 100) / 100,
    byDate,
  };
}
