import { permanentRedirect } from "next/navigation";

export default function StoreProductsRedirectPage() {
  permanentRedirect("/store");
}
