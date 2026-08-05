import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";
import FormCreateForm from "./FormCreateForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "New Form - Portal - Maine CyberTech" };

export default function NewFormPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Portal", href: "/portal/dashboard" },
          { label: "Dynamic Forms", href: "/portal/dynamic-client-forms-builder" },
          { label: "New Form" },
        ]}
      />
      <PortalSubnav current="dynamic-client-forms-builder" />
      <FormCreateForm />
    </div>
  );
}
