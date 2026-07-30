interface CatalogProduct {
  slug: string;
  name: string;
  summary: string;
  description: string;
  category: string;
  price: string;
  badge?: string;
  features?: string[];
  icon?: string;
  order?: number;
}

interface CatalogCategory {
  slug: string;
  name: string;
  description: string;
  icon?: string;
  order?: number;
  productIds?: string[];
}

const products: CatalogProduct[] = [
  {
    slug: "m365-hardening",
    name: "M365 Hardening",
    summary: "Enterprise-grade Microsoft 365 security configuration",
    description: "Hardened security baselines, conditional access policies, and continuous compliance monitoring for your Microsoft 365 tenant.",
    category: "security",
    price: "Starting at $999/mo",
    badge: "Popular",
    features: ["Conditional access policies", "Security baseline auditing", "Identity protection", "Threat monitoring"],
    icon: "shield",
    order: 1,
  },
  {
    slug: "endpoint-protection",
    name: "Endpoint Protection",
    summary: "Comprehensive endpoint security and EDR",
    description: "Next-generation antivirus, EDR, and threat hunting for all devices in your organization.",
    category: "security",
    price: "Starting at $499/mo",
    features: ["EDR & XDR capabilities", "24/7 threat monitoring", "Automated remediation", "Device compliance"],
    icon: "monitor",
    order: 2,
  },
  {
    slug: "network-security",
    name: "Network Security",
    summary: "Network perimeter defense and monitoring",
    description: "Firewall management, intrusion detection, and network segmentation to protect your infrastructure.",
    category: "infrastructure",
    price: "Starting at $799/mo",
    badge: "Recommended",
    features: ["Next-gen firewall management", "IDS/IPS monitoring", "Network segmentation", "VPN management"],
    icon: "network",
    order: 1,
  },
  {
    slug: "backup-dr",
    name: "Backup & Disaster Recovery",
    summary: "Automated backups and business continuity",
    description: "Cloud-first backup strategy with rapid recovery SLAs to keep your business running through any incident.",
    category: "infrastructure",
    price: "Starting at $299/mo",
    features: ["Automated daily backups", "Rapid recovery SLAs", "Off-site replication", "Ransomware protection"],
    icon: "database",
    order: 2,
  },
  {
    slug: "compliance-readiness",
    name: "Compliance Readiness",
    summary: "Regulatory compliance automation and reporting",
    description: "Automated compliance framework mapping, evidence collection, and audit-ready reporting for major regulations.",
    category: "compliance",
    price: "Starting at $1,299/mo",
    badge: "New",
    features: ["Framework mapping (NIST, CIS, HIPAA)", "Automated evidence collection", "Audit-ready reports", "Continuous monitoring"],
    icon: "checklist",
    order: 1,
  },
  {
    slug: "security-awareness",
    name: "Security Awareness Training",
    summary: "Employee security training and phishing simulations",
    description: "Ongoing security awareness program with simulated phishing campaigns and interactive training modules.",
    category: "compliance",
    price: "Starting at $199/mo",
    features: ["Phishing simulations", "Interactive training modules", "Progress tracking", "Custom content creation"],
    icon: "users",
    order: 2,
  },
  {
    slug: "help-desk",
    name: "Help Desk Support",
    summary: "24/7 IT help desk with rapid response",
    description: "Round-the-clock help desk support with trained technicians, ticketing system, and SLA-backed response times.",
    category: "managed-it",
    price: "Starting at $1,499/mo",
    badge: "Popular",
    features: ["24/7 support availability", "Ticketing system", "SLA-backed response", "Remote assistance"],
    icon: "headphones",
    order: 1,
  },
  {
    slug: "network-management",
    name: "Network Management",
    summary: "Proactive network monitoring and management",
    description: "Full lifecycle network management including monitoring, maintenance, and capacity planning.",
    category: "managed-it",
    price: "Starting at $899/mo",
    features: ["24/7 network monitoring", "Proactive maintenance", "Bandwidth analysis", "Hardware lifecycle management"],
    icon: "activity",
    order: 2,
  },
  {
    slug: "identity-management",
    name: "Identity Management",
    summary: "Identity and access management solutions",
    description: "Comprehensive IAM including SSO, MFA, privileged access management, and identity governance.",
    category: "security",
    price: "Starting at $599/mo",
    features: ["Single sign-on (SSO)", "Multi-factor authentication", "Privileged access management", "Identity governance"],
    icon: "fingerprint",
    order: 3,
  },
  {
    slug: "cloud-migration",
    name: "Cloud Migration",
    summary: "Strategic cloud migration and modernization",
    description: "End-to-end cloud migration services including assessment, planning, migration execution, and optimization.",
    category: "infrastructure",
    price: "Project-based",
    features: ["Cloud readiness assessment", "Migration planning", "Execution & validation", "Cost optimization"],
    icon: "cloud",
    order: 3,
  },
];

const categories: CatalogCategory[] = [
  {
    slug: "security",
    name: "Security",
    description: "Protect your business with enterprise-grade security solutions",
    icon: "shield",
    order: 1,
    productIds: ["m365-hardening", "endpoint-protection", "identity-management"],
  },
  {
    slug: "infrastructure",
    name: "Infrastructure",
    description: "Build a reliable and scalable IT foundation",
    icon: "server",
    order: 2,
    productIds: ["network-security", "backup-dr", "cloud-migration"],
  },
  {
    slug: "compliance",
    name: "Compliance & Training",
    description: "Stay compliant and build a security-aware culture",
    icon: "check-square",
    order: 3,
    productIds: ["compliance-readiness", "security-awareness"],
  },
  {
    slug: "managed-it",
    name: "Managed IT",
    description: "Comprehensive IT management and support",
    icon: "settings",
    order: 4,
    productIds: ["help-desk", "network-management"],
  },
];

export function getProducts(): CatalogProduct[] {
  return products;
}

export function getCategories(): CatalogCategory[] {
  return categories;
}

export function getProductBySlug(slug: string): CatalogProduct | undefined {
  return products.find((p) => p.slug === slug);
}

export function getCategoryBySlug(slug: string): CatalogCategory | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getProductsByCategory(categorySlug: string): CatalogProduct[] {
  return products.filter((p) => p.category === categorySlug);
}
