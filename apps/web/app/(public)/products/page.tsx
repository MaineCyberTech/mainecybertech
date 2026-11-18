import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

export const metadata: Metadata = { title: "Products" };

export default function ProductsRedirectPage() {
  permanentRedirect("/store");
}
