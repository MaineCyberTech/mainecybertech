import Link from "next/link";
import {
  Archive,
  Banknote,
  BarChart3,
  BookOpen,
  Bot,
  Building2,
  Calendar,
  Camera,
  CheckCircle2,
  ClipboardList,
  Cloud,
  DollarSign,
  FileText,
  Fish,
  Folder,
  FolderOpen,
  Globe,
  GraduationCap,
  Hand,
  HardDrive,
  KeyRound,
  Laptop,
  Mail,
  Megaphone,
  MessageSquare,
  Monitor,
  Package,
  Phone,
  Plug,
  RadioTower,
  RefreshCw,
  Rocket,
  Ruler,
  Search,
  Shield,
  ShoppingCart,
  Siren,
  Smile,
  Target,
  Ticket,
  Timer,
  TriangleAlert,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  "📋": ClipboardList,
  "🎫": Ticket,
  "🗂️": FolderOpen,
  "📝": FileText,
  "📄": FileText,
  "📊": BarChart3,
  "🚀": Rocket,
  "🤖": Bot,
  "🔑": KeyRound,
  "💻": Laptop,
  "📡": RadioTower,
  "📷": Camera,
  "🖥️": Monitor,
  "🛡️": Shield,
  "🌐": Globe,
  "🔌": Plug,
  "📧": Mail,
  "🎓": GraduationCap,
  "📐": Ruler,
  "✅": CheckCircle2,
  "🏢": Building2,
  "📚": BookOpen,
  "⚡": Zap,
  "📅": Calendar,
  "📞": Phone,
  "🎣": Fish,
  "👥": Users,
  "💲": DollarSign,
  "📁": Folder,
  "🎯": Target,
  "🚨": Siren,
  "⚠️": TriangleAlert,
  "🗄️": Archive,
  "🔄": RefreshCw,
  "💰": Banknote,
  "💾": HardDrive,
  "🔍": Search,
  "📖": BookOpen,
  "⏱️": Timer,
  "🛒": ShoppingCart,
  "☁️": Cloud,
  "📦": Package,
  "💬": MessageSquare,
  "👋": Hand,
  "😊": Smile,
  "📢": Megaphone,
};

type Props = {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  actionOnClick?: () => void;
  secondaryLabel?: string;
  secondaryAction?: () => void;
};

export default function EmptyState({
  icon = "📋",
  title,
  description,
  actionLabel,
  actionHref,
  actionOnClick,
  secondaryLabel,
  secondaryAction,
}: Props) {
  const Icon = ICON_MAP[icon] ?? ClipboardList;

  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-cyber-card-deep/70 px-6 py-12 text-center">
      <div
        className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-cyber-base/60"
        aria-hidden="true"
      >
        <Icon className="h-7 w-7 text-slate-400" strokeWidth={1.5} />
      </div>
      <h3 className="font-orbitron text-base font-semibold text-slate-50">{title}</h3>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">{description}</p>
      ) : null}
      {actionLabel || secondaryLabel ? (
        <div className="mt-6 flex items-center justify-center gap-3">
          {actionLabel && actionOnClick ? (
            <button
              type="button"
              onClick={actionOnClick}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-emerald-500"
            >
              {actionLabel}
            </button>
          ) : actionLabel && actionHref ? (
            <Link
              href={actionHref}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-emerald-500"
            >
              {actionLabel}
            </Link>
          ) : null}
          {secondaryLabel && secondaryAction ? (
            <button
              type="button"
              onClick={secondaryAction}
              className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              {secondaryLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
