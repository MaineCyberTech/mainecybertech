import { Router } from "express";
import { registerPromotionRoutes } from "./store/promotions";
import { registerQuoteRoutes } from "./store/quotes";
import { registerCampaignRoutes } from "./store/campaigns";
import { registerVisualAssetRoutes } from "./store/visual-assets";
import { registerCatalogRoutes } from "./store/catalog";

/**
 * Mounted at `/api/v1/store`.
 *
 * Split into `routes/store/*` for reviewability — this file used to be ~1,480
 * lines mixing promotions, quotes, leads, proposal drafts, campaigns, visual
 * assets and the catalog. Registration order is preserved from the original
 * single-file router so route matching is unchanged.
 */
const router: ReturnType<typeof Router> = Router();

registerPromotionRoutes(router);
registerQuoteRoutes(router);
registerCampaignRoutes(router);
registerVisualAssetRoutes(router);
registerCatalogRoutes(router);

export default router;
