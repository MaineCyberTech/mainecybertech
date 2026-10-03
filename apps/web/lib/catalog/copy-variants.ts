/**
 * Prompt 17: A/B-test-ready copy variants.
 *
 * Variants live in `data/copy-variants.json` and are chosen deterministically
 * from a seed so server and client render the same string (no hydration drift)
 * and no visitor sees a different offer than another. This is copy testing, not
 * dark-pattern targeting.
 */
import copyVariants from "./data/copy-variants.json";

interface VariantGroup {
  id: string;
  active: boolean;
  variants: string[];
}

interface CopyVariantsFile {
  version: string;
  groups: VariantGroup[];
}

const FILE = copyVariants as unknown as CopyVariantsFile;

function hash(seed: string): number {
  let value = 0;
  for (let i = 0; i < seed.length; i += 1) {
    value = (value * 31 + seed.charCodeAt(i)) % 1000003;
  }
  return Math.abs(value);
}

export function getVariantGroup(id: string): VariantGroup | undefined {
  return FILE.groups.find((group) => group.id === id);
}

/**
 * Returns the active variant copy for a group, or `fallback` when the group is
 * missing, disabled, or empty. The same seed always yields the same variant.
 */
export function pickCopyVariant(id: string, seed: string, fallback: string): string {
  const group = getVariantGroup(id);
  if (!group || !group.active || group.variants.length === 0) return fallback;
  return group.variants[hash(seed) % group.variants.length];
}

export function getCopyVariantIds(): string[] {
  return FILE.groups.map((group) => group.id);
}
