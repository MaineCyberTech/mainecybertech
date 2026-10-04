import { Router } from "express";
import { getEnv } from "../config/env";
import { buildSpec } from "../openapi/spec";

const router: ReturnType<typeof Router> = Router();

const spec = buildSpec();

// Swagger UI assets are pinned to an exact version and carry Subresource
// Integrity hashes so a compromised or republished CDN response cannot execute
// in the docs origin (SUPPLY-P2-002). When bumping the version, update both the
// URL and the matching `sha384-` hash in the same commit.
const SWAGGER_UI_VERSION = "5.33.1";
const SWAGGER_UI_CSS_SRI =
  "sha384-Ov4/wv3j2bmct8cDc5X4ngJZohVPzEmc6uDPH8WeljUxO5vtoykvMEfbu9Vh6RaW";
const SWAGGER_UI_JS_SRI =
  "sha384-ZPehFMQommnnuaZ4rpxgkgTT2DKFVp4hZC/7pLit+9Lek9T1YGSo23eHFbvNkXkw";
const SWAGGER_UI_CDN = "https://unpkg.com/swagger-ui-dist";

/**
 * Docs are a developer/operator aid, not a production surface. In production
 * the routes fail closed with a 404 so the API schema is not world-readable
 * and cannot be used for reconnaissance (API-P2-002 / FEAT-P3-001).
 */
function docsDisabled(): boolean {
  return getEnv().NODE_ENV === "production";
}

router.get("/openapi.json", (_req, res) => {
  if (docsDisabled()) {
    res.status(404).end();
    return;
  }
  res.json(spec);
});

router.get("/docs", (_req, res) => {
  if (docsDisabled()) {
    res.status(404).end();
    return;
  }

  // The inline bootstrap script must carry the per-response CSP nonce that
  // `securityHeaders` set; otherwise the docs CSP blocks it and the UI renders
  // empty (API-P2-002 / FEAT-P3-001).
  const nonce = (res.locals.cspNonce as string | undefined) ?? "";

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MCT API Docs</title>
  <link rel="stylesheet" href="${SWAGGER_UI_CDN}@${SWAGGER_UI_VERSION}/swagger-ui.css" integrity="${SWAGGER_UI_CSS_SRI}" crossorigin="anonymous">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="${SWAGGER_UI_CDN}@${SWAGGER_UI_VERSION}/swagger-ui-bundle.js" integrity="${SWAGGER_UI_JS_SRI}" crossorigin="anonymous"></script>
  <script nonce="${nonce}">
    SwaggerUIBundle({
      url: "/api/v1/openapi.json",
      dom_id: "#swagger-ui",
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: "BaseLayout",
    });
  </script>
</body>
</html>`);
});

export default router;
