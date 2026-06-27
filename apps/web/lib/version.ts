export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "0.0.0-dev";
export const GIT_SHA = process.env.NEXT_PUBLIC_GIT_SHA || "local";
export const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString();
