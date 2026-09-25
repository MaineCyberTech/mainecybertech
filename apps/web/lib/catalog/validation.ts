import { getAllProducts, getCategories, getCategoryOrder } from "./loader";
import type { CatalogHealthReport, CatalogValidationIssue } from "./types";

const SENSITIVE_FIELD_NAMES = ["password", "secret", "key", "token", "credential"];

export function validateSlugsUnique(): CatalogValidationIssue[] {
  const issues: CatalogValidationIssue[] = [];
  const products = getAllProducts();
  const slugMap = new Map<string, string[]>();

  for (const p of products) {
    const existing = slugMap.get(p.slug) ?? [];
    existing.push(p.id);
    slugMap.set(p.slug, existing);
  }

  for (const [slug, ids] of slugMap) {
    if (ids.length > 1) {
      issues.push({
        type: "duplicate_slug",
        severity: "error",
        message: `Slug "${slug}" is used by ${ids.length} products: ${ids.join(", ")}`,
        field: "slug",
        value: slug,
      });
    }
  }

  return issues;
}

export function validateRecommendations(): CatalogValidationIssue[] {
  const issues: CatalogValidationIssue[] = [];
  const products = getAllProducts();
  const validIds = new Set(products.map((p) => p.id));

  for (const p of products) {
    for (const upsellId of p.recommendedUpsells) {
      if (!validIds.has(upsellId)) {
        issues.push({
          type: "invalid_recommendation",
          severity: "error",
          message: `Product "${p.id}" recommends non-existent product "${upsellId}"`,
          field: "recommendedUpsells",
          value: upsellId,
        });
      }
    }
  }

  return issues;
}

export function validateCatalog(): CatalogHealthReport {
  const issues: CatalogValidationIssue[] = [];
  const products = getAllProducts();
  const categories = getCategories();
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const seenIds = new Map<string, string[]>();
  for (const p of products) {
    const existing = seenIds.get(p.id) ?? [];
    existing.push(p.slug);
    seenIds.set(p.id, existing);
  }

  for (const [id, slugs] of seenIds) {
    if (slugs.length > 1) {
      issues.push({
        type: "duplicate_id",
        severity: "error",
        message: `Product ID "${id}" appears ${slugs.length} times (slugs: ${slugs.join(", ")})`,
        field: "id",
        value: id,
      });
    }
  }

  const slugIssues = validateSlugsUnique();
  issues.push(...slugIssues);

  for (const p of products) {
    if (!categoryMap.has(p.categoryId)) {
      issues.push({
        type: "missing_category",
        severity: "error",
        message: `Product "${p.id}" references non-existent category "${p.categoryId}"`,
        field: "categoryId",
        value: p.categoryId,
      });
    }
  }

  for (const p of products) {
    if (!p.summary || p.summary.trim().length === 0) {
      issues.push({
        type: "empty_summary",
        severity: "warning",
        message: `Product "${p.id}" has an empty summary`,
        field: "summary",
        value: p.id,
      });
    }
  }

  for (const p of products) {
    if (!p.priceRange || p.priceRange.trim().length === 0) {
      issues.push({
        type: "missing_price",
        severity: "error",
        message: `Product "${p.id}" has no price range`,
        field: "priceRange",
        value: p.id,
      });
    }
  }

  const recIssues = validateRecommendations();
  issues.push(...recIssues);

  for (const p of products) {
    for (const field of p.intakeFields) {
      if (SENSITIVE_FIELD_NAMES.some((s) => field.id.toLowerCase().includes(s))) {
        issues.push({
          type: "unsafe_intake_field",
          severity: "error",
          message: `Product "${p.id}" has intake field "${field.id}" with sensitive name`,
          field: "intakeFields",
          value: field.id,
        });
      }
    }
  }

  for (const p of products) {
    if (!p.display) {
      issues.push({
        type: "hidden_product",
        severity: "info",
        message: `Product "${p.id}" is hidden (display: false)`,
        field: "display",
        value: p.id,
      });
    }
  }

  const categoryOrder = getCategoryOrder();
  const expectedCategoryIds = new Set(categoryOrder);
  const existingCategoryIds = new Set(categories.map((c) => c.id));

  for (const cid of expectedCategoryIds) {
    if (!existingCategoryIds.has(cid)) {
      issues.push({
        type: "missing_category_from_data",
        severity: "error",
        message: `Category "${cid}" in publicCategoryOrder has no entry in categories.json`,
        field: "publicCategoryOrder",
        value: cid,
      });
    }
  }

  for (const cat of categories) {
    if (cat.productIds.length === 0) {
      issues.push({
        type: "empty_category",
        severity: "warning",
        message: `Category "${cat.name}" (${cat.id}) has no products`,
        field: "productIds",
        value: cat.id,
      });
    }
  }

  return { issues };
}
