import type { ReactNode } from "react";

type AdminPageShellProps = {
  breadcrumbs?: ReactNode;
  subnav?: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export default function AdminPageShell({
  breadcrumbs,
  subnav,
  title,
  description,
  actions,
  children
}: AdminPageShellProps) {
  return (
    <div className="cyber-section">
      {breadcrumbs}
      {subnav}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="cyber-heading text-2xl">{title}</h1>
          {description ? <p className="mt-3 cyber-subtext">{description}</p> : null}
        </div>

        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>

      {children}
    </div>
  );
}
