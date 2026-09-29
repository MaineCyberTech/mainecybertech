import ModuleDetailPage from "@/components/admin/ModuleDetailPage";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Record Detail (${id.slice(0, 8)}) - Admin - Maine CyberTech` };
}

export default async function DetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return <ModuleDetailPage moduleKey="gov-retention" id={id} subnavKey="governance" />;
}
