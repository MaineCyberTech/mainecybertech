import { permanentRedirect } from "next/navigation";

export default function ProductsRedirectPage() {
  permanentRedirect("/store");
}
