import { redirect } from "next/navigation";

export const metadata = { title: "Vendors - Admin - Maine CyberTech" };

export default function Page() {
  redirect("/admin/vendor-contracts");
}
