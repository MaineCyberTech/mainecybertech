import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Store products",
  robots: { index: false, follow: true },
};

export default function StoreProductsRedirectPage() {
  permanentRedirect("/store");
}
