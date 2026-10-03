import versionData from "../public/version.json";

export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "0.0.0-dev";
export const GIT_SHA = process.env.NEXT_PUBLIC_GIT_SHA || versionData?.sha || "local";
// version.json is a build-time artifact written by scripts/generate-version.js,
// so this value is identical on the server and the client. A runtime
// `new Date().toISOString()` fallback would be evaluated at different times
// server-vs-client (a different UTC day), breaking hydration.
export const BUILD_TIME =
  process.env.NEXT_PUBLIC_BUILD_TIME || versionData?.date || "1970-01-01T00:00:00.000Z";
