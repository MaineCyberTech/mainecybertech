import JsonLd from "./JsonLd";
import { buildBreadcrumbSchema } from "@/lib/seo/schema";

type BreadcrumbJsonLdProps = {
  items: Array<{
    name: string;
    url: string;
  }>;
};

export default function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  return <JsonLd data={buildBreadcrumbSchema(items)} />;
}
