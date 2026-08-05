import ModuleDetailPage from "@/components/admin/ModuleDetailPage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Record Detail - Admin - Maine CyberTech" };

export default async function DetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return <ModuleDetailPage moduleKey="gov-risks" id={id} subnavKey="governance" />;
}
