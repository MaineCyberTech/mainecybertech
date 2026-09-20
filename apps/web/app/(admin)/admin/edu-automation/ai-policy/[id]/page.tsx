import ModuleDetailPage from "@/components/admin/ModuleDetailPage";
import AiPolicyGenerateButton from "./AiPolicyGenerateButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Record Detail - Admin - Maine CyberTech" };

export default async function DetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return (
    <div className="space-y-4">
      <AiPolicyGenerateButton id={id} />
      <ModuleDetailPage moduleKey="edu-ai-policy" id={id} subnavKey="edu-automation" />
    </div>
  );
}
