import { icons, type LucideIcon } from "lucide-react";

const iconRegistry: Record<string, LucideIcon> = icons || {};

export default function StoreIconTile({
  iconName,
  className = "h-8 w-8",
  size = 32,
}: {
  iconName: string;
  className?: string;
  size?: number;
}) {
  const LucideIcon = iconRegistry[iconName as keyof typeof icons];
  if (!LucideIcon) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded bg-emerald-600/10 p-2 text-emerald-400 ${className}`}
        title={iconName}
      >
        ◈
      </span>
    );
  }
  return <LucideIcon className={`text-emerald-400 ${className}`} size={size} />;
}
