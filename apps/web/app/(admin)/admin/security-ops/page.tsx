import { redirect } from "next/navigation";

export const metadata = { title: "Security Ops - Admin - Maine CyberTech" };

export default function Page() {
  redirect("/admin/offboarding");
}
