import Link from "next/link";

interface ServiceCardProps {
  icon: string;
  title: string;
  description: string;
  href: string;
}

export default function ServiceCard({ icon, title, description, href }: ServiceCardProps) {
  return (
    <Link
      href={href}
      className="group glass-card glass-card-hover flex flex-col p-8 no-underline sm:p-10"
    >
      <span className="mb-5 text-5xl">{icon}</span>
      <h3 className="mb-4 font-orbitron text-lg font-bold uppercase tracking-wider text-slate-50">
        {title}
      </h3>
      <p className="mb-6 flex-1 leading-relaxed text-slate-400">
        {description}
      </p>
      <span className="mt-auto text-xs font-bold uppercase tracking-widest text-emerald-500 transition-all group-hover:translate-x-1">
        View Details →
      </span>
    </Link>
  );
}
