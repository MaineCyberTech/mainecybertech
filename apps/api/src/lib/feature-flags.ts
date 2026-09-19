const DEFAULT_FLAGS: Record<string, boolean> = {
  "new-onboarding": false,
  "bulk-export-v2": false,
  "sse-notifications": true,
  "store-catalog": true,
};

export function isFeatureEnabled(name: string): boolean {
  const envVar = `FEATURE_${name.toUpperCase().replace(/-/g, "_")}`;
  const envValue = process.env[envVar];
  if (envValue !== undefined) {
    return envValue === "true" || envValue === "1";
  }
  return DEFAULT_FLAGS[name] ?? false;
}

export function getFeatureFlags(): Record<string, boolean> {
  const flags: Record<string, boolean> = {};
  for (const key of Object.keys(DEFAULT_FLAGS)) {
    flags[key] = isFeatureEnabled(key);
  }
  return flags;
}