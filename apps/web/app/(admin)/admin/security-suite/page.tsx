import { redirect } from "next/navigation";

export const metadata = { title: "Security Suite - Admin - Maine CyberTech" };

export default function Page() {
  redirect("/admin/incidents");
}
