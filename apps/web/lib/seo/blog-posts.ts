export type BlogPost = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  primaryKeyword: string;
  category: string;
  relatedServices: string[];
  datePublished: string;
  sections: {
    heading: string;
    items: string[];
  }[];
  faq: {
    question: string;
    answer: string;
  }[];
  cta: string;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "small-business-it-support-checklist-maine",
    title: "Small Business IT Support Checklist for Maine Companies",
    metaTitle: "Small Business IT Support Checklist for Maine Companies",
    metaDescription:
      "A practical IT support checklist for Maine small businesses reviewing devices, Microsoft 365, Wi-Fi, cybersecurity, backups, documentation, and vendor support.",
    primaryKeyword: "small business IT support Maine",
    category: "Managed IT",
    relatedServices: ["it-support", "microsoft-365-support", "cybersecurity"],
    datePublished: "2026-07-01",
    sections: [
      {
        heading: "1. Review your users and accounts",
        items: [
          "Who has access to company email?",
          "Are old employee accounts disabled?",
          "Are admin accounts limited?",
          "Is MFA enabled?",
          "Are shared accounts being used where named accounts would be better?",
        ],
      },
      {
        heading: "2. Review Microsoft 365",
        items: [
          "Are domains configured correctly?",
          "Are mailboxes licensed appropriately?",
          "Are security defaults or MFA enabled?",
          "Are distribution lists and shared mailboxes documented?",
          "Are backup expectations clear?",
        ],
      },
      {
        heading: "3. Review computers and devices",
        items: [
          "Which devices are business-owned?",
          "Which devices are personally owned?",
          "Are operating systems supported?",
          "Are updates being installed?",
          "Are devices protected with passwords, encryption, and endpoint security?",
        ],
      },
      {
        heading: "4. Review Wi-Fi and networking",
        items: [
          "Is Wi-Fi coverage reliable in all working areas?",
          "Are business and guest networks separated?",
          "Is network equipment documented?",
          "Are firewall, switch, and access point passwords stored securely?",
          "Are outdoor or detached buildings covered properly?",
        ],
      },
      {
        heading: "5. Review backups",
        items: [
          "What data is backed up?",
          "Where is it backed up?",
          "How often does it run?",
          "Who checks it?",
          "When was the last restore test?",
        ],
      },
      {
        heading: "6. Review cybersecurity basics",
        items: [
          "MFA enabled",
          "Password manager used",
          "Admin access limited",
          "Regular updates applied",
          "Email security reviewed",
          "Suspicious login alerts monitored",
          "Staff know how to report suspicious emails",
        ],
      },
      {
        heading: "7. Review vendors and internet service",
        items: [
          "Who manages the internet account?",
          "Are phone lines documented?",
          "Are service contracts current?",
          "Are backup connectivity options needed?",
          "Are vendor support numbers known?",
        ],
      },
      {
        heading: "8. Create an IT documentation binder",
        items: [
          "Internet provider",
          "Firewall/router model",
          "Switches and access points",
          "Microsoft 365 tenant details",
          "Vendors",
          "Backup systems",
          "Admin contacts",
          "Renewal dates",
          "Support contacts",
        ],
      },
    ],
    faq: [
      {
        question: "How often should a small business review its IT setup?",
        answer:
          "We recommend reviewing user accounts, Microsoft 365 settings, backups, and Wi-Fi at least twice a year. A documented annual review helps catch issues before they become problems.",
      },
      {
        question: "Do I need an IT documentation binder if I only have a few employees?",
        answer:
          "Yes. Even small organizations benefit from having internet provider details, admin contacts, renewal dates, and vendor support numbers documented in one place.",
      },
      {
        question: "What is the most important first step for improving small business IT?",
        answer:
          "Enable MFA on all accounts, limit admin access, and document what technology you have. These three steps provide immediate security and operational value.",
      },
    ],
    cta: "Maine CyberTech helps Maine small businesses and local organizations review, document, secure, and modernize their technology. Contact us to schedule an IT support consultation.",
  },
  {
    slug: "microsoft-365-security-checklist-maine-small-business",
    title: "Microsoft 365 Security Checklist for Maine Small Businesses",
    metaTitle: "Microsoft 365 Security Checklist for Maine Small Businesses",
    metaDescription:
      "A plain-English Microsoft 365 security checklist covering MFA, account protection, email security, admin access, device practices, and backup considerations.",
    primaryKeyword: "Microsoft 365 security Maine",
    category: "Microsoft 365",
    relatedServices: ["microsoft-365-support", "cybersecurity"],
    datePublished: "2026-07-01",
    sections: [
      {
        heading: "Review MFA",
        items: [
          "Enable MFA for all users.",
          "Avoid shared accounts where possible.",
          "Review backup authentication methods.",
          "Disable old or unused accounts.",
        ],
      },
      {
        heading: "Review admin access",
        items: [
          "Limit global admin roles.",
          "Use separate admin accounts where appropriate.",
          "Review who can create users, reset passwords, and access billing.",
          "Remove elevated access from people who no longer need it.",
        ],
      },
      {
        heading: "Review email security basics",
        items: [
          "Confirm DNS records are configured correctly.",
          "Review SPF, DKIM, and DMARC where appropriate.",
          "Train staff to report suspicious emails.",
          "Review forwarding rules periodically.",
        ],
      },
      {
        heading: "Review devices",
        items: [
          "Know which devices access company email.",
          "Keep devices updated.",
          "Use screen locks and strong passwords.",
          "Consider device management if the business has several users.",
        ],
      },
      {
        heading: "Review backup expectations",
        items: [
          "Microsoft 365 availability does not automatically mean every accidental deletion, ransomware event, or user mistake is covered the way the business expects. Review what data matters and how recovery would work.",
        ],
      },
    ],
    faq: [
      {
        question: "What is the single most important Microsoft 365 security setting?",
        answer:
          "Enabling MFA for all users. It is the most effective single step to protect accounts from unauthorized access and is available with most Microsoft 365 plans.",
      },
      {
        question: "Should small businesses use separate admin accounts?",
        answer:
          "Yes. Using a separate admin account for administrative tasks and a standard account for daily work reduces the risk of accidental changes and limits exposure if credentials are compromised.",
      },
      {
        question: "Does Microsoft 365 automatically back up my data?",
        answer:
          "Microsoft 365 provides availability and redundancy, but it does not provide traditional backup that protects against accidental deletion, ransomware, or retention gaps. Review what data matters and consider a third-party backup solution.",
      },
    ],
    cta: "Maine CyberTech helps Maine organizations review Microsoft 365 settings, MFA, account access, email security, and practical cybersecurity improvements.",
  },
  {
    slug: "business-wifi-planning-checklist-maine",
    title: "Business Wi-Fi Planning Checklist for Maine Buildings",
    metaTitle: "Business Wi-Fi Planning Checklist for Maine Buildings",
    metaDescription:
      "Plan better business Wi-Fi for Maine offices, churches, marinas, warehouses, and local facilities with this checklist for coverage, cabling, access points, outdoor areas, and network equipment.",
    primaryKeyword: "business Wi-Fi Maine",
    category: "Networking",
    relatedServices: ["networks"],
    datePublished: "2026-07-01",
    sections: [
      {
        heading: "Map the coverage areas",
        items: [
          "Offices",
          "Meeting rooms",
          "Warehouses",
          "Outdoor areas",
          "Parking lots",
          "Gates or signs",
          "Detached buildings",
          "Public/guest areas",
        ],
      },
      {
        heading: "Review cabling and conduit",
        items: [
          "Are cable paths available?",
          "Is conduit usable?",
          "Is there a pull string?",
          "Are there distance limitations?",
          "Is outdoor-rated cable required?",
        ],
      },
      {
        heading: "Separate business and guest traffic",
        items: [
          "Guest Wi-Fi should usually be separated from internal business systems. This helps protect staff devices, business applications, and network equipment.",
        ],
      },
      {
        heading: "Plan access point placement",
        items: [
          "Access points should be placed based on coverage needs, building shape, mounting options, and cable routes. Outdoor Wi-Fi often requires weather-rated equipment and careful placement.",
        ],
      },
    ],
    faq: [
      {
        question: "Do I need outdoor-rated access points for outdoor Wi-Fi?",
        answer:
          "Yes. Outdoor Wi-Fi requires weather-rated access points designed for Maine's seasonal conditions. Indoor access points placed near windows or in unheated areas often perform poorly and fail prematurely.",
      },
      {
        question: "What is the difference between business Wi-Fi and a consumer router?",
        answer:
          "Business-grade access points support more simultaneous users, offer better coverage, include VLAN support for separating business and guest traffic, and can be managed centrally. Consumer routers are designed for homes and typically support far fewer devices.",
      },
      {
        question: "How many access points does my building need?",
        answer:
          "It depends on building size, layout, wall materials, and user count. A site survey helps determine the right count and placement. As a rough guide, expect one access point per 1,500-2,500 square feet in open areas, with additional units for offices, outdoor zones, and high-density spaces.",
      },
    ],
    cta: "Maine CyberTech helps Maine organizations plan and install business Wi-Fi, UniFi networks, firewall/switch/access point systems, and outdoor coverage.",
  },
  {
    slug: "security-camera-system-planning-checklist-maine-businesses",
    title: "Security Camera System Planning Checklist for Maine Businesses",
    metaTitle: "Security Camera System Planning Checklist for Maine Businesses",
    metaDescription:
      "A practical security camera planning checklist for Maine businesses covering camera placement, NVRs, PoE, cabling, remote access, retention, and network requirements.",
    primaryKeyword: "security camera installation Maine",
    category: "Security Systems",
    relatedServices: ["security-systems", "networks"],
    datePublished: "2026-07-01",
    sections: [
      {
        heading: "Identify what you need to see",
        items: [
          "Entrances and exits",
          "Parking lots",
          "Storage areas",
          "Gates",
          "Cash/customer areas",
          "Equipment rooms",
          "Outdoor assets",
        ],
      },
      {
        heading: "Decide how footage should be stored",
        items: [
          "Local NVR",
          "Cloud storage",
          "Hybrid approach",
          "Retention period",
          "User access controls",
        ],
      },
      {
        heading: "Plan network and power",
        items: [
          "PoE cameras often require network switches, cable routes, and reliable power. Camera systems should be designed with the network in mind, not added as an afterthought.",
        ],
      },
      {
        heading: "Review remote access needs",
        items: [
          "Decide who needs access, where they will access from, and what permissions they should have.",
        ],
      },
    ],
    faq: [
      {
        question: "How many security cameras does a small business need?",
        answer:
          "Start by identifying every area you need to see: entrances, exits, parking lots, storage areas, gates, and customer areas. Each area may need one or more cameras depending on field of view, lighting, and detail requirements.",
      },
      {
        question: "What is PoE and why does it matter for cameras?",
        answer:
          "Power over Ethernet (PoE) delivers power and data through a single network cable. PoE cameras are easier to install, more reliable, and don't require separate electrical outlets at each camera location.",
      },
      {
        question: "Should I use local storage or cloud storage for camera footage?",
        answer:
          "Many Maine businesses use a local NVR for primary storage with remote access for viewing. Cloud storage can supplement local storage for offsite redundancy. The right approach depends on retention requirements, internet reliability, and budget.",
      },
    ],
    cta: "Maine CyberTech helps Maine organizations plan security camera systems, UniFi Protect deployments, NVRs, network-connected cameras, and supporting network infrastructure.",
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}
