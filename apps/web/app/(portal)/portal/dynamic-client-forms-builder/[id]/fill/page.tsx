import { getApiClient } from "@/lib/api";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";
import FormFillForm from "./FormFillForm";
import { DynamicFormRecord } from "@mct/sdk";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Fill Form (${id.slice(0, 8)}) - Portal - Maine CyberTech` };
}

export default async function FillFormPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const api = getApiClient();

  let form: DynamicFormRecord | null = null;
  try {
    form = await api.dynamicForms.get(id);
  } catch (error) {
    if ((error as { status?: number })?.status === 404) notFound();
    throw error;
  }
  if (!form) notFound();

  const fields = Array.isArray(form.fields) ? form.fields : [];

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Portal", href: "/portal/dashboard" },
          { label: "Dynamic Forms", href: "/portal/dynamic-client-forms-builder" },
          { label: form.title ?? "Fill Form" },
        ]}
      />
      <PortalSubnav current="dynamic-client-forms-builder" />
      <div className="space-y-2">
        <h1 className="cyber-heading text-2xl">{form.title ?? "Form"}</h1>
        {form.description && <p className="text-sm text-slate-400">{form.description}</p>}
      </div>
      <FormFillForm formId={id} fields={fields} />
    </div>
  );
}
