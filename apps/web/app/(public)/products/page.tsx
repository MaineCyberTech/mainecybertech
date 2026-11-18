import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Products",
  robots: { index: false, follow: true },
};

export default function ProductsRedirectPage() {
  permanentRedirect("/store");
}
