import JsonLd from "./JsonLd";
import { buildLocalBusinessSchema } from "@/lib/seo/schema";

export default function LocalBusinessJsonLd() {
  return <JsonLd data={buildLocalBusinessSchema() as Record<string, unknown>} />;
}
