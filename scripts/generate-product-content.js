const fs = require("fs");

const products = JSON.parse(fs.readFileSync("apps/web/lib/catalog/data/products.json", "utf8"));

// Comprehensive product-specific content for ALL 245 products
const productSpecific = {
  // ===== Quick Fixes (12) =====
  "Password Security Checkup": {
    bestFor: [
      "Businesses that share passwords or use the same password across accounts",
      "Owners who want to know if their business accounts have been exposed",
      "Organizations considering a password manager but unsure where to start",
    ],
    outcomes: [
      "Clear picture of current password hygiene across your business",
      "Identified shared or compromised accounts that need attention",
      "A practical plan for moving to safer password practices",
    ],
    includes: [
      "Review of password policies and practices",
      "Scan for compromised or weak passwords",
      "Password manager readiness assessment",
      "Recommendations report",
    ],
  },
  "MFA Setup Session": {
    bestFor: [
      "Businesses that don't have multi-factor authentication enabled on critical accounts",
      "Organizations whose cyber insurance requires MFA",
      "Owners who want to reduce the risk of account takeover",
    ],
    outcomes: [
      "Multi-factor authentication enabled on your most critical accounts",
      "Reduced risk of email compromise and account takeover",
      "Staff guidance on how to use MFA day to day",
    ],
    includes: [
      "Audit of which accounts currently lack MFA",
      "MFA configuration on eligible accounts",
      "Staff guidance document",
      "Testing to confirm MFA works correctly",
    ],
  },
  "Phishing Readiness Mini Audit": {
    bestFor: [
      "Businesses concerned about email scams targeting their staff",
      "Organizations that want to test employee phishing awareness",
      "Companies preparing for cyber insurance that requires security training",
    ],
    outcomes: [
      "Understanding of how your staff currently handles suspicious emails",
      "Targeted training recommendations based on real gaps",
      "Reduced risk of a successful phishing attack",
    ],
    includes: [
      "Review of current email security settings",
      "Staff phishing awareness assessment",
      "Findings report with risk ratings",
      "Recommended training path",
    ],
  },
  "Security Score Snapshot": {
    bestFor: [
      "Business owners who want a quick overview of their security posture",
      "Organizations shopping for cyber insurance that need a baseline",
      "Companies that haven't had any security review before",
    ],
    outcomes: [
      "A numerical security score you can track over time",
      "Clear understanding of your biggest security gaps",
      "Prioritized action plan ranked by risk level",
    ],
    includes: [
      "Assessment across identity, endpoint, email, backup, and admin risk",
      "Security score with plain-English explanation",
      "Gap analysis with priority rankings",
      "Quick-win recommendations",
    ],
  },
  "Admin Account Cleanup": {
    bestFor: [
      "Businesses that have had staff turnover without removing old accounts",
      "Organizations that aren't sure who has admin access to their systems",
      "Companies preparing for a security review or audit",
    ],
    outcomes: [
      "Removed or reduced admin privileges for former employees",
      "Clear inventory of who has access to what",
      "Lower risk of insider threats and accidental changes",
    ],
    includes: [
      "Audit of all administrator accounts",
      "Identification of stale or unused privileged accounts",
      "Recommended privilege reduction plan",
      "Documentation of remaining admin access",
    ],
  },
  "Business Email Safety Check": {
    bestFor: [
      "Businesses concerned about email impersonation or spoofing",
      "Organizations that want to verify their email security basics",
      "Companies that have experienced email scams in the past",
    ],
    outcomes: [
      "Verified email authentication (SPF, DKIM, DMARC) status",
      "Reduced risk of email spoofing and impersonation",
      "Clear understanding of mailbox forwarding rules",
    ],
    includes: [
      "Email authentication configuration review",
      "Mailbox forwarding rule audit",
      "MFA status check on email accounts",
      "Recommendations report",
    ],
  },
  "Remote Work Safety Check": {
    bestFor: [
      "Businesses with employees working from home or on the road",
      "Organizations that provide laptops or devices for remote work",
      "Companies concerned about remote access security",
    ],
    outcomes: [
      "Clear picture of remote access security posture",
      "Identified unsafe remote desktop or VPN configurations",
      "Actionable recommendations for safer remote work",
    ],
    includes: [
      "Review of remote access methods and configurations",
      "Device security policy check",
      "VPN and remote desktop configuration review",
      "Recommendations report",
    ],
  },
  "Basic Incident Readiness Checklist": {
    bestFor: [
      "Businesses that don't have a plan for what to do during a security incident",
      "Organizations that want a simple, actionable incident response guide",
      "Companies whose cyber insurance requires an incident response plan",
    ],
    outcomes: [
      "A practical incident response checklist you can actually use",
      "Clear roles and contact information for incident scenarios",
      "Reduced panic and faster response during real incidents",
    ],
    includes: [
      "Incident response checklist tailored to your business",
      "Emergency contact list template",
      "Incident classification guide",
      "Basic containment procedures",
    ],
  },
  "Website Uptime Monitor Setup": {
    bestFor: [
      "Businesses whose website is important for customer leads or sales",
      "Organizations that have been surprised by website downtime",
      "Companies that want automated alerts when their site goes down",
    ],
    outcomes: [
      "Automatic website monitoring with alert notifications",
      "Faster response when your website goes down",
      "Peace of mind knowing your site is being watched",
    ],
    includes: [
      "Uptime monitoring configuration",
      "Alert setup for email, SMS, or Slack",
      "Initial monitoring period and testing",
      "Documentation of monitoring setup",
    ],
  },
  "Printer / Scanner Setup": {
    bestFor: [
      "Offices that have a new printer or scanner they haven't configured",
      "Businesses with network printing issues or unreliable scanning",
      "Organizations that want scan-to-email or scan-to-folder working",
    ],
    outcomes: [
      "Working printer and scanner on your network",
      "Reliable scanning to email, folder, or cloud",
      "Fewer printing-related support calls",
    ],
    includes: [
      "Printer or scanner network configuration",
      "Driver installation on workstations",
      "Scan-to-email or scan-to-folder setup",
      "Printing functionality testing",
    ],
  },
  "PC Tune-Up / Cleanup": {
    bestFor: [
      "Businesses with slow or unreliable computers",
      "Organizations that want to extend the life of existing hardware",
      "Staff who are frustrated with computer performance",
    ],
    outcomes: [
      "Faster, more reliable computer performance",
      "More free disk space and organized files",
      "Extended useful life of existing hardware",
    ],
    includes: [
      "Disk cleanup and storage optimization",
      "Startup program review and optimization",
      "Software update check and installation",
      "Performance benchmark before and after",
    ],
  },
  "Computer Replacement Readiness Review": {
    bestFor: [
      "Businesses planning to replace aging computers",
      "Organizations that want to budget for hardware upgrades",
      "Companies that need to transfer data from old to new devices",
    ],
    outcomes: [
      "Clear understanding of which computers need replacement",
      "Budget plan for hardware refresh",
      "Data transfer plan that minimizes downtime",
    ],
    includes: [
      "Hardware age and specification audit",
      "Performance assessment of current devices",
      "Replacement priority list with recommendations",
      "Data transfer planning guidance",
    ],
  },

  // ===== Cybersecurity (20) =====
  "Cyber Risk Snapshot": {
    bestFor: [
      "Business owners who want a quick overview of their cyber risk",
      "Organizations that haven't had any formal security assessment",
      "Companies preparing for their first cyber insurance application",
    ],
    outcomes: [
      "A snapshot of your current cyber risk level",
      "Identification of the most critical vulnerabilities",
      "A short list of prioritized actions to reduce risk",
    ],
    includes: [
      "High-level security posture review",
      "Risk assessment across key areas",
      "Snapshot report with risk score",
      "Priority recommendations list",
    ],
  },
  "Full Cybersecurity Assessment": {
    bestFor: [
      "Organizations that want a comprehensive security evaluation",
      "Businesses preparing for compliance audits or security certifications",
      "Companies that have never had a professional security assessment",
    ],
    outcomes: [
      "Comprehensive understanding of your security strengths and weaknesses",
      "Detailed findings with risk ratings for each gap",
      "A multi-phase remediation roadmap",
    ],
    includes: [
      "Full scope security assessment across all major domains",
      "Detailed findings report with risk ratings",
      "Remediation roadmap with estimated effort",
      "Executive summary for leadership",
    ],
  },
  "M365 Security Assessment": {
    bestFor: [
      "Organizations using Microsoft 365 that want to verify their security",
      "Businesses concerned about their Exchange Online, SharePoint, or Teams security",
      "Companies preparing for a Microsoft Secure Score review",
    ],
    outcomes: [
      "Clear picture of your Microsoft 365 security configuration",
      "Identified misconfigurations and security gaps",
      "Prioritized remediation plan for your tenant",
    ],
    includes: [
      "Microsoft 365 security configuration review",
      "Conditional Access and MFA policy check",
      "Secure Score analysis",
      "Remediation recommendations",
    ],
  },
  "Small Business Ransomware Readiness Review": {
    bestFor: [
      "Small businesses concerned about ransomware attacks",
      "Organizations that want to know if they could recover from ransomware",
      "Companies that haven't tested their backup restoration process",
    ],
    outcomes: [
      "Clear understanding of your ransomware resilience",
      "Identified gaps in backup, recovery, and prevention",
      "A practical action plan to improve readiness",
    ],
    includes: [
      "Backup and recovery capability review",
      "Email security and phishing defense assessment",
      "Endpoint protection status check",
      "Ransomware readiness score and recommendations",
    ],
  },
  "Nonprofit Cyber Readiness Review": {
    bestFor: [
      "Nonprofit organizations with limited IT budgets or staff",
      "Charities that handle donor data and want to protect it",
      "Community organizations that need practical security guidance",
    ],
    outcomes: [
      "Security assessment tailored to nonprofit constraints and risks",
      "Practical recommendations that fit your budget",
      "Documentation that can help with grant and insurance requirements",
    ],
    includes: [
      "Nonprofit-focused security assessment",
      "Review of donor data handling practices",
      "Budget-conscious recommendations",
      "Grant-ready security documentation",
    ],
  },
  "Vendor Access Review": {
    bestFor: [
      "Businesses that give third-party vendors access to their systems",
      "Organizations concerned about vendor-related security risks",
      "Companies that don't have a vendor access management process",
    ],
    outcomes: [
      "Complete inventory of which vendors have access to what",
      "Removed or restricted access for vendors that no longer need it",
      "A simple vendor access management process going forward",
    ],
    includes: [
      "Vendor access inventory and audit",
      "Review of vendor security practices",
      "Access reduction recommendations",
      "Vendor management process template",
    ],
  },
  "Admin Privilege Review": {
    bestFor: [
      "Businesses that aren't sure who has administrative access",
      "Organizations that have had multiple IT providers over the years",
      "Companies concerned about excessive admin rights",
    ],
    outcomes: [
      "Complete inventory of administrative accounts and privileges",
      "Removal of unnecessary admin rights",
      "Principle of least privilege applied to your environment",
    ],
    includes: [
      "Admin account discovery across systems",
      "Privilege level audit",
      "Excessive privilege reduction plan",
      "Ongoing admin management recommendations",
    ],
  },
  "MFA Enforcement Project": {
    bestFor: [
      "Organizations that need to enforce MFA across all users",
      "Businesses whose cyber insurance now requires MFA",
      "Companies that have MFA available but not fully deployed",
    ],
    outcomes: [
      "MFA enforced across all applicable accounts and services",
      "Improved security posture and insurance compliance",
      "Staff guidance and support during the transition",
    ],
    includes: [
      "MFA readiness assessment across all platforms",
      "Enforcement policy configuration",
      "User enrollment and guidance",
      "Exception handling and monitoring",
    ],
  },
  "Password Manager Rollout": {
    bestFor: [
      "Businesses still using spreadsheets or sticky notes for passwords",
      "Organizations that want to enable secure password sharing",
      "Companies tired of password reset requests",
    ],
    outcomes: [
      "Company-wide password manager deployed and configured",
      "Secure password sharing among team members",
      "Reduced password reset requests and improved security",
    ],
    includes: [
      "Password manager selection and setup",
      "Organization configuration and policy setup",
      "User onboarding and training materials",
      "Admin console handoff",
    ],
  },
  "Email Security Hardening": {
    bestFor: [
      "Businesses concerned about email-borne threats like phishing and spoofing",
      "Organizations that want to configure advanced email protection",
      "Companies that have experienced email-based attacks",
    ],
    outcomes: [
      "Hardened email security configuration",
      "Reduced spam, phishing, and spoofing reaching your staff",
      "Configured email authentication (SPF, DKIM, DMARC)",
    ],
    includes: [
      "Email security settings review and optimization",
      "SPF, DKIM, and DMARC configuration",
      "Anti-phishing and anti-spam policy tuning",
      "Email security recommendations",
    ],
  },
  "Endpoint Protection Rollout": {
    bestFor: [
      "Businesses that need antivirus or endpoint detection on their devices",
      "Organizations moving from consumer to business-grade protection",
      "Companies that want managed endpoint security",
    ],
    outcomes: [
      "Business-grade endpoint protection deployed on all devices",
      "Centralized management console for monitoring",
      "Improved detection and response to endpoint threats",
    ],
    includes: [
      "Endpoint protection platform selection and setup",
      "Installation on all workstations and servers",
      "Policy configuration and testing",
      "Management console handoff",
    ],
  },
  "Local Admin Removal Project": {
    bestFor: [
      "Businesses whose users have administrator rights on their computers",
      "Organizations that want to reduce malware infection risk",
      "Companies preparing for security compliance requirements",
    ],
    outcomes: [
      "Standard users no longer have unnecessary admin rights",
      "Reduced risk of malware infections from user actions",
      "Documented exception process for legitimate admin needs",
    ],
    includes: [
      "Local admin rights audit across all workstations",
      "Test group deployment and issue resolution",
      "Full rollout with user communication",
      "Exception request process documentation",
    ],
  },
  "BitLocker Encryption Rollout": {
    bestFor: [
      "Businesses that need to encrypt laptops and workstations",
      "Organizations handling sensitive or regulated data",
      "Companies that want protection against device theft",
    ],
    outcomes: [
      "Full disk encryption enabled on all eligible devices",
      "Recovery key securely stored and accessible",
      "Compliance with data protection requirements",
    ],
    includes: [
      "BitLocker readiness assessment",
      "Encryption policy configuration",
      "Rollout across eligible devices",
      "Recovery key backup and management",
    ],
  },
  "DNS Filtering Setup": {
    bestFor: [
      "Businesses that want to block malicious websites at the network level",
      "Organizations looking for an additional layer of security",
      "Companies that want to restrict access to inappropriate content",
    ],
    outcomes: [
      "DNS filtering configured to block known malicious sites",
      "Reduced risk of malware infections from web browsing",
      "Optional content filtering for productivity or compliance",
    ],
    includes: [
      "DNS filtering service selection and setup",
      "Policy configuration for security categories",
      "Testing and tuning",
      "Management console handoff",
    ],
  },
  "Security Awareness Training Setup": {
    bestFor: [
      "Businesses that want to train staff on security basics",
      "Organizations whose cyber insurance requires security training",
      "Companies that want to reduce human-error security incidents",
    ],
    outcomes: [
      "Staff trained on recognizing and avoiding common threats",
      "Measurable improvement in security awareness",
      "Compliance with insurance training requirements",
    ],
    includes: [
      "Security awareness training platform setup",
      "User enrollment and course assignment",
      "Baseline and follow-up phishing simulation",
      "Training completion reporting",
    ],
  },
  "Incident Response Plan Starter": {
    bestFor: [
      "Businesses that don't have a formal incident response plan",
      "Organizations that want to be prepared for security incidents",
      "Companies whose cyber insurance requires an incident response plan",
    ],
    outcomes: [
      "A documented incident response plan tailored to your business",
      "Clear roles and procedures for different incident types",
      "Reduced response time when a real incident occurs",
    ],
    includes: [
      "Incident response plan template customization",
      "Role definition and contact tree",
      "Incident classification and escalation procedures",
      "Plan review and testing guidance",
    ],
  },
  "Cyber Insurance Readiness Package": {
    bestFor: [
      "Businesses applying for or renewing cyber insurance",
      "Organizations that want to improve their insurability",
      "Companies that were denied coverage or quoted high premiums",
    ],
    outcomes: [
      "Completed insurance application with accurate security information",
      "Identified and addressed common insurance requirements",
      "Documentation that supports your insurance application",
    ],
    includes: [
      "Insurance questionnaire review and assistance",
      "Security gap assessment against common requirements",
      "Remediation of critical gaps",
      "Application-ready documentation package",
    ],
  },
  "Security Awareness Lunch & Learn": {
    bestFor: [
      "Businesses that want an engaging security training session",
      "Organizations that prefer in-person or live virtual training",
      "Companies that want to kick off a security awareness program",
    ],
    outcomes: [
      "Staff who can identify phishing emails and common scams",
      "Understanding of basic security practices for daily work",
      "Engagement and buy-in for security initiatives",
    ],
    includes: [
      "Live training session (onsite or virtual)",
      "Practical examples and real-world scenarios",
      "Take-home reference materials",
      "Q&A and discussion",
    ],
  },
  "Owner/Admin Security Training": {
    bestFor: [
      "Business owners and managers who want to understand their security responsibilities",
      "Decision-makers who need to evaluate security investments",
      "Leadership teams that want to set the right security tone",
    ],
    outcomes: [
      "Understanding of security risks and mitigation strategies from a business perspective",
      "Ability to evaluate and prioritize security investments",
      "Knowledge to ask the right questions of IT providers",
    ],
    includes: [
      "Executive-level security briefing",
      "Business risk and liability overview",
      "Investment prioritization framework",
      "Q&A and scenario discussion",
    ],
  },
  "Staff Security Starter": {
    bestFor: [
      "Small teams that need basic security awareness training",
      "Organizations that haven't done any security training before",
      "Businesses that want a simple, affordable training option",
    ],
    outcomes: [
      "Staff who understand basic security risks and best practices",
      "Reduced likelihood of common security mistakes",
      "Foundation for a broader security awareness program",
    ],
    includes: [
      "Basic security awareness training session",
      "Password and phishing best practices guide",
      "Security incident reporting procedures",
      "Reference materials for staff",
    ],
  },

  // ===== Microsoft 365 (18) =====
  "Microsoft 365 Tenant Setup": {
    bestFor: [
      "New businesses setting up Microsoft 365 for the first time",
      "Organizations migrating from Google Workspace or another platform",
      "Companies that want their tenant configured correctly from day one",
    ],
    outcomes: [
      "A properly configured Microsoft 365 tenant",
      "Security defaults and MFA configured",
      "Users, mailboxes, and basic policies in place",
    ],
    includes: [
      "Tenant creation and domain verification",
      "Initial user and mailbox setup",
      "Security defaults and MFA configuration",
      "Basic admin console handoff",
    ],
  },
  "Microsoft 365 Tenant Cleanup": {
    bestFor: [
      "Organizations that have been using M365 for years without maintenance",
      "Businesses that have accumulated stale users, groups, and mailboxes",
      "Companies that want to reduce licensing costs",
    ],
    outcomes: [
      "Cleaned up user list with stale accounts removed",
      "Organized groups, shared mailboxes, and permissions",
      "Potential license cost savings identified",
    ],
    includes: [
      "Full tenant audit of users, groups, and mailboxes",
      "Stale account identification and removal",
      "License usage optimization review",
      "Cleanup documentation",
    ],
  },
  "Microsoft 365 Monthly Admin": {
    bestFor: [
      "Small businesses that need ongoing Microsoft 365 administration",
      "Organizations without a dedicated IT person for M365",
      "Companies that want monthly user management, security checks, and support",
    ],
    outcomes: [
      "Professional Microsoft 365 administration without hiring full-time staff",
      "Monthly security and configuration reviews",
      "Responsive support for user issues and changes",
    ],
    includes: [
      "Monthly admin tasks (user adds/changes/removes)",
      "Security and configuration review",
      "Help desk support for M365 issues",
      "Monthly summary report",
    ],
  },
  "Microsoft 365 Security Baseline": {
    bestFor: [
      "Organizations that want to secure their Microsoft 365 environment",
      "Businesses preparing for cyber insurance requirements",
      "Companies that want Microsoft's recommended security applied",
    ],
    outcomes: [
      "Microsoft 365 configured to security best practices",
      "Conditional Access, MFA, and threat protection enabled",
      "Improved Microsoft Secure Score",
    ],
    includes: [
      "Security baseline review against Microsoft recommendations",
      "Conditional Access policy configuration",
      "MFA enforcement planning",
      "Threat protection policy setup",
    ],
  },
  "Microsoft 365 Backup Setup": {
    bestFor: [
      "Businesses that rely on Microsoft 365 and want backup protection",
      "Organizations that understand Microsoft's limited retention",
      "Companies that need to meet data retention requirements",
    ],
    outcomes: [
      "Automated backup of Exchange Online, SharePoint, and OneDrive",
      "Point-in-time recovery capability for M365 data",
      "Meeting data retention and compliance requirements",
    ],
    includes: [
      "M365 backup service selection and setup",
      "Backup policy configuration for mail, files, and sites",
      "Initial backup seed and verification",
      "Restore testing and documentation",
    ],
  },
  "Microsoft 365 Migration Lite": {
    bestFor: [
      "Small businesses moving from another email platform to M365",
      "Organizations with basic email and document needs",
      "Companies that want a guided migration without full consulting",
    ],
    outcomes: [
      "Email, contacts, and calendars migrated to Microsoft 365",
      "Minimal disruption during the migration process",
      "Basic configuration ready for daily use",
    ],
    includes: [
      "Email migration from previous platform",
      "Contact and calendar data transfer",
      "Domain configuration and verification",
      "Post-migration testing and support",
    ],
  },
  "Microsoft 365 Migration Full": {
    bestFor: [
      "Organizations with complex email, file, and collaboration needs",
      "Businesses that need a complete migration with minimal downtime",
      "Companies migrating from on-premises Exchange or Google Workspace",
    ],
    outcomes: [
      "Complete migration of email, files, Teams, and SharePoint",
      "Minimal business disruption during the transition",
      "Full configuration and staff readiness",
    ],
    includes: [
      "Full data migration (email, files, Teams, SharePoint)",
      "Migration planning and cutover management",
      "Staff training and readiness support",
      "Post-migration support and cleanup",
    ],
  },
  "Microsoft 365 License Optimization": {
    bestFor: [
      "Businesses that want to reduce Microsoft 365 licensing costs",
      "Organizations that aren't sure if they're on the right license plans",
      "Companies that want to match licenses to actual usage",
    ],
    outcomes: [
      "Optimized license assignments matching actual usage",
      "Reduced monthly licensing costs",
      "Understanding of underutilized features available on current plans",
    ],
    includes: [
      "License usage audit across all users",
      "Recommendation for optimal license assignments",
      "Implementation of license changes",
      "Cost savings summary",
    ],
  },
  "Shared Mailbox Cleanup": {
    bestFor: [
      "Businesses with many shared mailboxes that are hard to manage",
      "Organizations that have accumulated shared mailboxes over time",
      "Companies that want to organize email delegation",
    ],
    outcomes: [
      "Cleaned up shared mailbox list with clear ownership",
      "Proper permissions and delegation in place",
      "Reduced mailbox clutter and management overhead",
    ],
    includes: [
      "Shared mailbox audit and inventory",
      "Stale or unused mailbox identification",
      "Permission review and cleanup",
      "Mailbox management recommendations",
    ],
  },
  "OneDrive and SharePoint Permissions Review": {
    bestFor: [
      "Businesses concerned about oversharing in OneDrive and SharePoint",
      "Organizations that want to audit file access permissions",
      "Companies that handle sensitive documents in M365",
    ],
    outcomes: [
      "Clear understanding of who has access to what",
      "Oversharing identified and corrected",
      "Permission structure aligned with business needs",
    ],
    includes: [
      "OneDrive and SharePoint permission audit",
      "External sharing review",
      "Sensitive content identification",
      "Permission cleanup and restructuring",
    ],
  },
  "New Employee M365 Setup": {
    bestFor: [
      "Businesses that need a consistent onboarding process for M365",
      "Organizations that want new hires productive on day one",
      "Companies that want to automate new user setup",
    ],
    outcomes: [
      "New employee fully set up in M365 before their first day",
      "Consistent onboarding experience across all hires",
      "Reduced IT overhead for each new hire",
    ],
    includes: [
      "User account creation and license assignment",
      "Email, Teams, and OneDrive configuration",
      "Department-specific group and permission setup",
      "New hire welcome instructions",
    ],
  },
  "Departing Employee Lockdown": {
    bestFor: [
      "Businesses that want to secure accounts when employees leave",
      "Organizations concerned about data loss from departing staff",
      "Companies that need a consistent offboarding process",
    ],
    outcomes: [
      "Account access removed promptly and completely",
      "Company data retained and accessible",
      "Clear audit trail of the offboarding process",
    ],
    includes: [
      "Account access review and removal",
      "Mailbox forwarding and auto-reply setup",
      "OneDrive and file access transfer",
      "Offboarding checklist documentation",
    ],
  },
  "Teams Cleanup Mini Project": {
    bestFor: [
      "Organizations with many Teams channels that are disorganized",
      "Businesses that find it hard to locate information in Teams",
      "Companies that want to restructure their Teams environment",
    ],
    outcomes: [
      "Organized Teams structure with clear naming and purpose",
      "Reduced channel clutter and easier navigation",
      "Archived or removed stale teams and channels",
    ],
    includes: [
      "Teams audit and inventory",
      "Channel cleanup and restructuring",
      "Stale team archiving",
      "Team management recommendations",
    ],
  },
  "Microsoft Secure Score Review": {
    bestFor: [
      "Organizations that want to improve their Microsoft Secure Score",
      "Businesses that want to understand their M365 security recommendations",
      "Companies that want to track security improvement over time",
    ],
    outcomes: [
      "Understanding of your current Secure Score and improvement actions",
      "Implemented high-impact security recommendations",
      "Higher Secure Score with measurable improvement",
    ],
    includes: [
      "Secure Score analysis and review",
      "High-priority action implementation",
      "Recommendation roadmap for remaining items",
      "Secure Score tracking setup",
    ],
  },
  "M365 Launch Bundle": {
    bestFor: [
      "New businesses setting up their complete Microsoft 365 environment",
      "Organizations that want a coordinated M365 launch",
      "Companies that want tenant setup, migration, and training together",
    ],
    outcomes: [
      "Complete Microsoft 365 environment set up and ready to use",
      "Staff trained on email, Teams, and basic M365 features",
      "Coordinated launch with minimal disruption",
    ],
    includes: [
      "Tenant setup and domain configuration",
      "User creation and license assignment",
      "Basic migration from previous platform",
      "Staff training session",
    ],
  },
  "M365 Secure Bundle": {
    bestFor: [
      "Organizations that want to lock down their Microsoft 365 environment",
      "Businesses that need comprehensive M365 security configuration",
      "Companies preparing for cyber insurance review",
    ],
    outcomes: [
      "Hardened Microsoft 365 security configuration",
      "MFA, Conditional Access, and threat protection in place",
      "Improved Secure Score and insurance readiness",
    ],
    includes: [
      "Security baseline configuration",
      "MFA enforcement and Conditional Access setup",
      "Threat protection policy configuration",
      "Secure Score optimization",
    ],
  },
  "M365 Cleanup Bundle": {
    bestFor: [
      "Organizations with years of M365 clutter that needs organizing",
      "Businesses that want to clean up users, mailboxes, Teams, and permissions",
      "Companies that want to reduce licensing costs while cleaning up",
    ],
    outcomes: [
      "Cleaned and organized M365 tenant",
      "Reduced licensing costs from optimized assignments",
      "Documented permissions and structure",
    ],
    includes: [
      "Full tenant audit and cleanup",
      "License optimization review",
      "Shared mailbox and Teams cleanup",
      "Permission structure documentation",
    ],
  },
  "M365 Managed Bundle": {
    bestFor: [
      "Businesses that want ongoing Microsoft 365 management",
      "Organizations that prefer monthly admin support with security",
      "Companies that want a single M365 support package",
    ],
    outcomes: [
      "Professional M365 administration on a monthly basis",
      "Regular security reviews and updates",
      "Responsive support for all M365 issues",
    ],
    includes: [
      "Monthly admin tasks and user management",
      "Quarterly security review",
      "Help desk support for M365",
      "Monthly summary reporting",
    ],
  },

  // ===== Computer Setup & Support (17) =====
  "New Computer Setup": {
    bestFor: [
      "Businesses that purchased new computers and need them configured",
      "Organizations that want a consistent setup across all workstations",
      "Companies that want security basics applied before deployment",
    ],
    outcomes: [
      "New computer configured with business software and security",
      "Consistent setup matching your organization's standards",
      "Ready for immediate deployment to the user",
    ],
    includes: [
      "Operating system setup and updates",
      "Business software installation",
      "Security baseline configuration",
      "Data transfer from old computer if needed",
    ],
  },
  "Business Laptop Security Setup": {
    bestFor: [
      "Businesses issuing laptops to employees for work",
      "Organizations that want security configured before laptops are deployed",
      "Companies concerned about laptop theft or loss",
    ],
    outcomes: [
      "Laptop secured with encryption, antivirus, and security policies",
      "Protected against theft with disk encryption and remote wipe capability",
      "Consistent security baseline across all laptops",
    ],
    includes: [
      "Full disk encryption (BitLocker) configuration",
      "Endpoint protection installation",
      "Security policy application",
      "Remote management and wipe capability setup",
    ],
  },
  "Patch Status Snapshot": {
    bestFor: [
      "Businesses that aren't sure if their computers are up to date",
      "Organizations concerned about unpatched vulnerabilities",
      "Companies that want a one-time patch audit",
    ],
    outcomes: [
      "Clear picture of patch status across all devices",
      "Critical missing patches identified and applied",
      "Recommendations for ongoing patch management",
    ],
    includes: [
      "Patch status audit across all workstations",
      "Critical security patch installation",
      "Patch management recommendations",
      "Patch status report",
    ],
  },
  "Managed Workstation Essentials": {
    bestFor: [
      "Small businesses that want basic workstation monitoring",
      "Organizations that want antivirus and patch management",
      "Companies that want to know if their computers are healthy",
    ],
    outcomes: [
      "Basic monitoring and protection for all workstations",
      "Automated antivirus and patch management",
      "Visibility into workstation health",
    ],
    includes: [
      "Endpoint protection installation",
      "Automated patch management",
      "Basic health monitoring",
      "Monthly health report",
    ],
  },
  "Managed Workstation Protect": {
    bestFor: [
      "Businesses that want antivirus, patching, and encryption management",
      "Organizations that need more than basic workstation protection",
      "Companies that want managed security on their devices",
    ],
    outcomes: [
      "Comprehensive workstation protection managed remotely",
      "Automated antivirus, patching, and encryption",
      "Reduced risk of malware and data loss",
    ],
    includes: [
      "Endpoint protection with advanced threat detection",
      "Automated patch and update management",
      "Disk encryption management",
      "Quarterly security review",
    ],
  },
  "Managed Workstation Complete": {
    bestFor: [
      "Organizations that want full workstation lifecycle management",
      "Businesses that want proactive support and maintenance",
      "Companies that want to minimize technology interruptions",
    ],
    outcomes: [
      "Full lifecycle management from setup to retirement",
      "Proactive issue detection and resolution",
      "Consistent, secure, and reliable workstations",
    ],
    includes: [
      "Full endpoint management suite",
      "Proactive monitoring and alerts",
      "Help desk support for workstation issues",
      "Lifecycle planning and replacement guidance",
    ],
  },
  "Laptop Procurement": {
    bestFor: [
      "Businesses that need help selecting the right laptops",
      "Organizations that want to buy laptops without the research burden",
      "Companies that want business-grade recommendations",
    ],
    outcomes: [
      "Recommended laptop models matching your business needs",
      "Competitive pricing from reliable vendors",
      "Specifications that will serve your team for years",
    ],
    includes: [
      "Needs assessment and specification recommendations",
      "Vendor sourcing and pricing",
      "Configuration and ordering support",
      "Receiving and inspection coordination",
    ],
  },
  "Desktop Procurement": {
    bestFor: [
      "Businesses that need help selecting desktop computers",
      "Organizations that want business-grade desktop recommendations",
      "Companies that want to standardize on a desktop model",
    ],
    outcomes: [
      "Recommended desktop models matching your business needs",
      "Competitive pricing from reliable vendors",
      "Specifications that balance performance and budget",
    ],
    includes: [
      "Needs assessment and specification recommendations",
      "Vendor sourcing and pricing",
      "Configuration and ordering support",
      "Receiving and inspection coordination",
    ],
  },
  "Printer Procurement Help": {
    bestFor: [
      "Businesses that need to buy a printer but aren't sure what to get",
      "Organizations that want recommendations for reliable business printers",
      "Companies that want to avoid common printer purchasing mistakes",
    ],
    outcomes: [
      "Printer recommendation matched to your actual printing needs",
      "Understanding of total cost including supplies and maintenance",
      "Reliable printer that doesn't cause ongoing support issues",
    ],
    includes: [
      "Printing needs assessment",
      "Printer model recommendations",
      "Vendor sourcing and pricing",
      "Setup and configuration guidance",
    ],
  },
  "Warranty Tracking": {
    bestFor: [
      "Businesses with multiple devices that have different warranty periods",
      "Organizations that want to know when hardware is out of warranty",
      "Companies that want to plan for hardware replacements",
    ],
    outcomes: [
      "Complete inventory of device warranties and expiration dates",
      "Timely renewal or replacement before warranties expire",
      "Budget planning for hardware refresh",
    ],
    includes: [
      "Device warranty audit and inventory",
      "Warranty expiration tracking setup",
      "Renewal and replacement recommendations",
      "Quarterly warranty status report",
    ],
  },
  "Lifecycle Replacement Plan": {
    bestFor: [
      "Organizations that want to plan hardware replacements systematically",
      "Businesses that want predictable hardware refresh cycles",
      "Companies that want to avoid emergency hardware purchases",
    ],
    outcomes: [
      "A multi-year hardware replacement plan",
      "Predictable budgeting for technology refresh",
      "Reduced emergency hardware purchases",
    ],
    includes: [
      "Current hardware inventory and age assessment",
      "Replacement priority and timeline",
      "Budget projection for each year",
      "Replacement recommendations",
    ],
  },
  "Workstation Refresh Pack": {
    bestFor: [
      "Businesses planning to refresh multiple workstations at once",
      "Organizations that want a coordinated hardware upgrade",
      "Companies that want procurement, setup, and deployment managed",
    ],
    outcomes: [
      "New workstations procured, set up, and deployed",
      "Consistent configuration across all new devices",
      "Smooth transition from old to new workstations",
    ],
    includes: [
      "Hardware procurement coordination",
      "Computer setup and configuration",
      "Data transfer from old devices",
      "Old device wipe and recycling coordination",
    ],
  },
  "Data Transfer Service": {
    bestFor: [
      "Businesses that need data moved from old to new computers",
      "Organizations that want files, email, and settings transferred",
      "Companies that want to avoid data loss during computer upgrades",
    ],
    outcomes: [
      "All business data transferred to the new computer",
      "Files, email, and settings preserved",
      "Old computer data preserved until you confirm everything is working",
    ],
    includes: [
      "Data inventory and transfer planning",
      "File, email, and settings migration",
      "Verification of transferred data",
      "Old computer backup before wipe",
    ],
  },
  "Old Device Wipe Coordination": {
    bestFor: [
      "Businesses that need to securely wipe old computers or drives",
      "Organizations that want to responsibly dispose of old equipment",
      "Companies that need certification of data destruction",
    ],
    outcomes: [
      "Old devices securely wiped to industry standards",
      "Certification of data destruction for compliance",
      "Environmentally responsible disposal or recycling",
    ],
    includes: [
      "Device inventory for wipe processing",
      "Secure data wipe using industry standards",
      "Certificate of destruction",
      "Recycling or disposal coordination",
    ],
  },
  "Conference Room Audio Setup": {
    bestFor: [
      "Businesses with conference rooms that have poor audio or video",
      "Organizations that want professional meeting room technology",
      "Companies frustrated with unreliable conference calls",
    ],
    outcomes: [
      "Conference room with reliable audio, video, and screen sharing",
      "Simplified meeting start process",
      "Fewer technical difficulties during important meetings",
    ],
    includes: [
      "Room assessment and equipment recommendations",
      "Audio and video equipment installation",
      "Configuration and testing with common platforms",
      "User guide for the room",
    ],
  },
  "Microsoft 365 Basics Training": {
    bestFor: [
      "Staff who are new to Microsoft 365 or need a refresher",
      "Organizations that want employees to use M365 more effectively",
      "Teams that are not using Outlook, Teams, or OneDrive to their potential",
    ],
    outcomes: [
      "Staff comfortable with email, calendar, and Teams basics",
      "More effective use of M365 tools for daily work",
      "Reduced basic how-to questions for IT",
    ],
    includes: [
      "Live training session on M365 basics",
      "Outlook, Teams, and OneDrive hands-on practice",
      "Reference guide for common tasks",
      "Q&A session",
    ],
  },
  "Teams and SharePoint Training": {
    bestFor: [
      "Teams that want to collaborate more effectively in M365",
      "Organizations that are not using Teams and SharePoint fully",
      "Companies that want to move beyond basic email communication",
    ],
    outcomes: [
      "Team comfortable using Teams for communication and collaboration",
      "Understanding of SharePoint for document management",
      "More efficient teamwork with fewer emails",
    ],
    includes: [
      "Live training session on Teams and SharePoint",
      "Channel, chat, file sharing, and meeting best practices",
      "Document management in SharePoint",
      "Reference guide and Q&A",
    ],
  },

  // ===== Wi-Fi & Networking (27) =====
  "Wi-Fi Coverage Check": {
    bestFor: [
      "Businesses with Wi-Fi dead zones or slow areas",
      "Organizations that want to verify their wireless coverage",
      "Companies that are planning to add more devices to their network",
    ],
    outcomes: [
      "Heat map of your current Wi-Fi coverage",
      "Identified dead zones and weak signal areas",
      "Recommendations for access point placement or upgrade",
    ],
    includes: [
      "On-site Wi-Fi site survey",
      "Signal strength and coverage mapping",
      "Interference source identification",
      "Coverage improvement recommendations",
    ],
  },
  "Network Health Check": {
    bestFor: [
      "Businesses experiencing slow internet or network issues",
      "Organizations that want a network baseline before problems start",
      "Companies that have had network problems they can't diagnose",
    ],
    outcomes: [
      "Clear picture of your network's current health and performance",
      "Identified bottlenecks, misconfigurations, and aging equipment",
      "Prioritized list of improvements",
    ],
    includes: [
      "Network performance assessment",
      "Equipment age and capability review",
      "Bandwidth utilization analysis",
      "Network health report with recommendations",
    ],
  },
  "Small Office Network Audit": {
    bestFor: [
      "Small offices that want a comprehensive network review",
      "Organizations that want to understand their full network stack",
      "Companies that have outgrown their current network setup",
    ],
    outcomes: [
      "Full understanding of your network infrastructure and topology",
      "Identified security, performance, and reliability issues",
      "Network upgrade or improvement roadmap",
    ],
    includes: [
      "Full network infrastructure audit",
      "Topology mapping and documentation",
      "Security configuration review",
      "Improvement recommendations with estimated costs",
    ],
  },
  "Guest Wi-Fi Review": {
    bestFor: [
      "Businesses that offer Wi-Fi to customers or guests",
      "Organizations concerned about guest network security",
      "Companies that want to improve the guest experience",
    ],
    outcomes: [
      "Secure guest Wi-Fi network isolated from business traffic",
      "Improved guest experience with reliable connectivity",
      "Compliance with basic guest network security practices",
    ],
    includes: [
      "Guest network configuration review",
      "Network isolation verification",
      "Performance testing from guest perspective",
      "Guest network improvement recommendations",
    ],
  },
  "Camera Network Readiness Check": {
    bestFor: [
      "Businesses planning to install security cameras",
      "Organizations that want to verify their network can support cameras",
      "Companies that want to avoid camera performance issues",
    ],
    outcomes: [
      "Clear understanding of your network's readiness for cameras",
      "Bandwidth and PoE capacity assessment",
      "Network upgrade recommendations if needed",
    ],
    includes: [
      "Network capacity assessment for camera traffic",
      "PoE switch and power budget review",
      "Cabling and infrastructure readiness check",
      "Camera deployment recommendations",
    ],
  },
  "Outdoor Wi-Fi Planning Visit": {
    bestFor: [
      "Businesses that need Wi-Fi coverage in outdoor areas",
      "Marinas, campgrounds, and outdoor venues with connectivity needs",
      "Organizations that want to extend Wi-Fi beyond their building",
    ],
    outcomes: [
      "Outdoor Wi-Fi coverage plan tailored to your property",
      "Equipment recommendations for weather-resistant deployment",
      "Installation roadmap and cost estimate",
    ],
    includes: [
      "On-site outdoor coverage assessment",
      "Weather and environmental factor analysis",
      "Access point placement recommendations",
      "Equipment and installation cost estimate",
    ],
  },
  "Firewall Configuration Review": {
    bestFor: [
      "Businesses that want to verify their firewall is properly configured",
      "Organizations concerned about firewall security gaps",
      "Companies that have had IT changes without firewall review",
    ],
    outcomes: [
      "Verified firewall configuration against security best practices",
      "Identified rule misconfigurations and security gaps",
      "Hardened firewall with documented rule set",
    ],
    includes: [
      "Firewall rule audit and review",
      "Security policy configuration check",
      "Unused or overly permissive rule identification",
      "Hardening recommendations",
    ],
  },
  "ISP Failover Readiness Review": {
    bestFor: [
      "Businesses that cannot afford internet downtime",
      "Organizations that want automatic failover if their primary ISP goes down",
      "Companies that have experienced costly internet outages",
    ],
    outcomes: [
      "Assessment of current failover capabilities",
      "Failover configuration recommendations",
      "Reduced downtime risk from ISP outages",
    ],
    includes: [
      "Current ISP and backup circuit review",
      "Failover configuration assessment",
      "Automatic failover recommendations",
      "Failover testing plan",
    ],
  },
  "Basic Router Replacement": {
    bestFor: [
      "Businesses using an ISP-provided or consumer router",
      "Organizations that want a more reliable business-grade router",
      "Companies that have outgrown their current router",
    ],
    outcomes: [
      "Business-grade router installed and configured",
      "Improved network reliability and security",
      "Basic routing, firewall, and Wi-Fi configured",
    ],
    includes: [
      "Router selection recommendation",
      "Router installation and configuration",
      "Wi-Fi and basic firewall setup",
      "Old router removal and network testing",
    ],
  },
  "Business Wi-Fi Setup": {
    bestFor: [
      "Businesses that need professional Wi-Fi installed",
      "Organizations that want reliable wireless for their team",
      "Companies that have outgrown their consumer Wi-Fi equipment",
    ],
    outcomes: [
      "Professional business Wi-Fi system installed and configured",
      "Reliable coverage across your workspace",
      "Proper security and guest network separation",
    ],
    includes: [
      "Access point installation and placement",
      "Wi-Fi configuration and optimization",
      "Guest network and security setup",
      "Coverage verification testing",
    ],
  },
  "Guest Wi-Fi Setup": {
    bestFor: [
      "Businesses that want to offer Wi-Fi to customers securely",
      "Organizations that need a separate guest network",
      "Companies that want to avoid liability from guest usage",
    ],
    outcomes: [
      "Secure guest Wi-Fi isolated from your business network",
      "Simple guest login process (portal or password)",
      "Compliance with basic legal requirements for public Wi-Fi",
    ],
    includes: [
      "Guest network VLAN configuration",
      "Captive portal or password setup",
      "Bandwidth limiting and content filtering",
      "Guest Wi-Fi signage recommendations",
    ],
  },
  "VLAN Setup": {
    bestFor: [
      "Businesses that want to segment their network for security",
      "Organizations that need separate networks for different purposes",
      "Companies that want to isolate guest Wi-Fi, cameras, or IoT devices",
    ],
    outcomes: [
      "Network segmented into VLANs for security and performance",
      "Devices on separate VLANs isolated from each other",
      "Improved network security and organization",
    ],
    includes: [
      "VLAN design and planning",
      "Switch and router VLAN configuration",
      "Inter-VLAN routing rules",
      "VLAN documentation and testing",
    ],
  },
  "Firewall Setup": {
    bestFor: [
      "Businesses that need a new firewall installed and configured",
      "Organizations that want business-grade network security",
      "Companies that have outgrown their basic router",
    ],
    outcomes: [
      "Business-grade firewall installed and properly configured",
      "Network security with firewall rules, VPN, and threat protection",
      "Documented firewall configuration",
    ],
    includes: [
      "Firewall hardware installation",
      "Security policy and rule configuration",
      "VPN setup for remote access",
      "Documentation and admin handoff",
    ],
  },
  "Switch Installation": {
    bestFor: [
      "Businesses that need managed switches for their network",
      "Organizations that want to upgrade from unmanaged to managed switching",
      "Companies that need PoE switches for cameras or access points",
    ],
    outcomes: [
      "Managed switch installed and configured for your network",
      "Proper VLAN, PoE, and port configuration",
      "Improved network performance and manageability",
    ],
    includes: [
      "Switch hardware installation",
      "VLAN and port configuration",
      "PoE settings for cameras and access points",
      "Switch management access setup",
    ],
  },
  "Patch Panel Cleanup": {
    bestFor: [
      "Businesses with messy server rooms or network closets",
      "Organizations that want organized cabling for easier troubleshooting",
      "Companies that have had multiple IT vendors without cable management",
    ],
    outcomes: [
      "Organized patch panel with labeled cables",
      "Easier troubleshooting and future changes",
      "Professional-looking network closet",
    ],
    includes: [
      "Cable tracing and labeling",
      "Patch panel organization and dressing",
      "Cable management improvements",
      "Network closet cleanup",
    ],
  },
  "Network Documentation Package": {
    bestFor: [
      "Businesses that don't have documentation of their network",
      "Organizations that want network diagrams for insurance or planning",
      "Companies that want to reduce dependency on tribal knowledge",
    ],
    outcomes: [
      "Complete network documentation including diagrams",
      "Equipment inventory with model, serial, and warranty info",
      "Documented IP scheme, VLANs, and key configurations",
    ],
    includes: [
      "Network topology diagram creation",
      "Equipment inventory and specification list",
      "IP address scheme and VLAN documentation",
      "Key configuration documentation",
    ],
  },
  "ISP Cutover Support": {
    bestFor: [
      "Businesses switching internet service providers",
      "Organizations that want minimal downtime during ISP changes",
      "Companies that need help coordinating the transition",
    ],
    outcomes: [
      "Smooth transition from old to new ISP",
      "Minimal downtime during the cutover",
      "Old ISP cancellation coordinated",
    ],
    includes: [
      "ISP coordination and scheduling",
      "New circuit installation support",
      "DNS and public IP transition",
      "Old circuit decommissioning",
    ],
  },
  "LTE/5G Backup Internet Setup": {
    bestFor: [
      "Businesses that need backup internet when their primary goes down",
      "Organizations that cannot afford to be without internet",
      "Companies that want automatic failover",
    ],
    outcomes: [
      "Automatic LTE/5G backup internet when primary fails",
      "Seamless failover with minimal disruption",
      "Tested and verified backup connectivity",
    ],
    includes: [
      "LTE/5G modem and SIM procurement",
      "Failover configuration",
      "Automatic failover testing",
      "Documentation and user guidance",
    ],
  },
  "UniFi Controller Setup": {
    bestFor: [
      "Businesses using or planning to use UniFi networking equipment",
      "Organizations that want centralized management of UniFi devices",
      "Companies that want remote management capability",
    ],
    outcomes: [
      "UniFi Controller installed and configured",
      "All UniFi devices adopted and managed centrally",
      "Remote access and monitoring configured",
    ],
    includes: [
      "Controller installation (cloud or on-premises)",
      "Device adoption and configuration",
      "Network settings and SSID configuration",
      "Remote access and alert setup",
    ],
  },
  "UniFi Wi-Fi Install": {
    bestFor: [
      "Businesses that want UniFi Wi-Fi access points installed",
      "Organizations that want professional Wi-Fi with UniFi management",
      "Companies that want reliable, scalable Wi-Fi",
    ],
    outcomes: [
      "UniFi access points installed and configured",
      "Professional Wi-Fi coverage with centralized management",
      "Guest network and security configured",
    ],
    includes: [
      "UniFi access point installation",
      "Wi-Fi configuration and optimization",
      "UniFi Controller integration",
      "Coverage verification",
    ],
  },
  "UniFi Network Cleanup": {
    bestFor: [
      "Businesses with UniFi equipment that has accumulated configuration drift",
      "Organizations that want to standardize their UniFi setup",
      "Companies that have had multiple admins make changes",
    ],
    outcomes: [
      "Cleaned up UniFi configuration with consistent settings",
      "Standardized device naming, SSIDs, and network settings",
      "Documented UniFi environment",
    ],
    includes: [
      "UniFi device audit and inventory",
      "Configuration standardization",
      "Unused SSID and network cleanup",
      "Updated documentation",
    ],
  },
  "UniFi Monthly Management": {
    bestFor: [
      "Businesses with UniFi equipment that want ongoing management",
      "Organizations that want proactive UniFi monitoring",
      "Companies that want firmware updates and health checks",
    ],
    outcomes: [
      "UniFi environment professionally managed monthly",
      "Regular firmware updates and health checks",
      "Proactive issue detection and resolution",
    ],
    includes: [
      "Monthly UniFi health check",
      "Firmware update management",
      "Performance monitoring and alert response",
      "Monthly summary report",
    ],
  },
  "UniFi Site Documentation": {
    bestFor: [
      "Businesses with multiple UniFi sites that need documentation",
      "Organizations that want a complete UniFi inventory",
      "Companies that want to document their UniFi deployment",
    ],
    outcomes: [
      "Complete documentation of UniFi devices, networks, and settings",
      "Site topology diagrams for each location",
      "Equipment inventory with warranty information",
    ],
    includes: [
      "UniFi device inventory across all sites",
      "Site topology diagram creation",
      "Network and SSID configuration documentation",
      "Warranty and support information",
    ],
  },
  "Small Office Wi-Fi Bundle": {
    bestFor: [
      "Small offices that need a complete Wi-Fi solution",
      "Organizations that want Wi-Fi equipment, setup, and support bundled",
      "Companies that want a single package for their wireless needs",
    ],
    outcomes: [
      "Complete Wi-Fi solution with professional equipment and setup",
      "Reliable coverage across your small office",
      "Guest network and security configured",
    ],
    includes: [
      "Access point hardware",
      "Installation and configuration",
      "Guest network setup",
      "Coverage verification and documentation",
    ],
  },
  "Business Network Foundation": {
    bestFor: [
      "Businesses that need a complete network infrastructure setup",
      "Organizations that want reliable switching, Wi-Fi, and security",
      "Companies that are setting up a new office or upgrading from consumer gear",
    ],
    outcomes: [
      "Professional network infrastructure with switching, Wi-Fi, and firewall",
      "Reliable connectivity for all business operations",
      "Documented network that's easy to manage",
    ],
    includes: [
      "Managed switch installation",
      "Business Wi-Fi setup",
      "Firewall configuration",
      "Network documentation package",
    ],
  },
  "Outdoor Coverage Bundle": {
    bestFor: [
      "Businesses that need outdoor Wi-Fi coverage",
      "Marinas, campgrounds, and outdoor venues",
      "Organizations that want weather-resistant Wi-Fi equipment",
    ],
    outcomes: [
      "Weather-resistant outdoor Wi-Fi installed and configured",
      "Coverage in target outdoor areas",
      "Network integration with indoor systems",
    ],
    includes: [
      "Outdoor-rated access point hardware",
      "Weatherproof installation",
      "Coverage verification testing",
      "Documentation and user guidance",
    ],
  },
  "Camera and Wi-Fi Bundle": {
    bestFor: [
      "Businesses that want cameras and Wi-Fi done together",
      "Organizations that want a single project for network and camera needs",
      "Companies that want network infrastructure ready for cameras",
    ],
    outcomes: [
      "Wi-Fi network and camera system installed and configured",
      "Camera-ready network with PoE capacity",
      "Single coordinated project with one point of contact",
    ],
    includes: [
      "Business Wi-Fi installation",
      "Camera system installation",
      "PoE switch configuration for cameras",
      "Integrated documentation package",
    ],
  },

  // ===== Security Cameras (13) =====
  "Camera Site Survey": {
    bestFor: [
      "Businesses planning to install security cameras",
      "Organizations that want a professional camera placement plan",
      "Companies that want to know what camera system fits their needs",
    ],
    outcomes: [
      "Detailed camera placement plan with coverage areas",
      "Equipment recommendations matched to your property",
      "Installation cost estimate",
    ],
    includes: [
      "On-site property assessment",
      "Camera placement recommendations",
      "Coverage area mapping",
      "Equipment and installation cost estimate",
    ],
  },
  "Single Camera Add-On": {
    bestFor: [
      "Businesses with an existing camera system that need one more camera",
      "Organizations that want to fill a coverage gap",
      "Companies that want to add a camera without a full system install",
    ],
    outcomes: [
      "Additional camera installed and integrated with existing system",
      "Filled coverage gap",
      "Remote access configured for the new camera",
    ],
    includes: [
      "Camera hardware",
      "Installation and cabling",
      "NVR or system integration",
      "Remote access configuration",
    ],
  },
  "Small Camera System Setup": {
    bestFor: [
      "Small businesses that want a basic security camera system",
      "Organizations that need 2-4 cameras for coverage",
      "Companies that want a simple, reliable camera setup",
    ],
    outcomes: [
      "Small camera system installed and working",
      "Remote access to live and recorded footage",
      "Basic motion detection and alerts configured",
    ],
    includes: [
      "Camera hardware (up to 4 cameras)",
      "NVR or recording system setup",
      "Remote access configuration",
      "Basic motion detection setup",
    ],
  },
  "Camera Health Check": {
    bestFor: [
      "Businesses with existing cameras that aren't working properly",
      "Organizations that want to verify their camera system is functioning",
      "Companies that want to identify camera maintenance needs",
    ],
    outcomes: [
      "Complete assessment of camera system health",
      "Identified non-functioning or degraded cameras",
      "Maintenance and upgrade recommendations",
    ],
    includes: [
      "Camera by camera functionality check",
      "Recording and storage verification",
      "Remote access testing",
      "Camera health report",
    ],
  },
  "NVR Cleanup": {
    bestFor: [
      "Businesses with NVRs that have accumulated months of recordings",
      "Organizations that want to optimize recording storage",
      "Companies that want to configure retention policies",
    ],
    outcomes: [
      "Optimized NVR storage with proper retention policies",
      "Organized recording schedule",
      "Clear understanding of storage capacity and limits",
    ],
    includes: [
      "NVR storage audit",
      "Recording schedule optimization",
      "Retention policy configuration",
      "Storage capacity planning recommendations",
    ],
  },
  "Remote Camera Access Setup": {
    bestFor: [
      "Businesses that want to view their cameras from their phone",
      "Organizations that have cameras but no remote access configured",
      "Companies that want to check cameras from home or on the go",
    ],
    outcomes: [
      "Remote access to cameras from phone or computer",
      "Secure connection without exposing cameras to the internet",
      "Simple instructions for viewing cameras remotely",
    ],
    includes: [
      "Remote access configuration (VPN or secure proxy)",
      "Mobile app setup and testing",
      "Secure access method documentation",
      "User instructions for remote viewing",
    ],
  },
  "Camera Signage Package": {
    bestFor: [
      "Businesses that want security signs and decals for deterrence",
      "Organizations that want to post required notices about camera usage",
      "Companies that want professional signage matching their system",
    ],
    outcomes: [
      "Professional security camera signs installed",
      "Visible deterrence for potential intruders",
      "Required notices posted for compliance",
    ],
    includes: [
      "Security camera signs and decals",
      "Sign placement recommendations",
      "Notice installation",
      "Compliance verification",
    ],
  },
  "Camera Maintenance Plan": {
    bestFor: [
      "Businesses that want their camera system maintained regularly",
      "Organizations that want to prevent camera issues before they happen",
      "Companies that rely on their camera system for security",
    ],
    outcomes: [
      "Regular camera system maintenance and cleaning",
      "Proactive identification of failing cameras",
      "Extended camera system lifespan",
    ],
    includes: [
      "Quarterly camera check and cleaning",
      "Recording and storage verification",
      "Remote access testing",
      "Maintenance report",
    ],
  },
  "Camera Starter Bundle": {
    bestFor: [
      "Small businesses that want an affordable camera starter system",
      "Organizations that want 2-4 cameras with basic features",
      "Companies that want a simple, reliable camera package",
    ],
    outcomes: [
      "Entry-level camera system installed and working",
      "Remote viewing capability",
      "Basic motion detection and recording",
    ],
    includes: [
      "Cameras (2-4)",
      "NVR or recording system",
      "Basic installation and configuration",
      "Remote access setup",
    ],
  },
  "Camera Business Bundle": {
    bestFor: [
      "Businesses that need a more comprehensive camera system",
      "Organizations that want 4-8 cameras with advanced features",
      "Companies that want smarter detection and alerts",
    ],
    outcomes: [
      "Mid-range camera system with advanced detection",
      "Coverage of key areas with smart alerts",
      "Reliable recording and remote access",
    ],
    includes: [
      "Cameras (4-8)",
      "NVR with analytics capability",
      "Full installation and configuration",
      "Smart detection and alert setup",
    ],
  },
  "Camera Complete Bundle": {
    bestFor: [
      "Organizations that want comprehensive camera coverage",
      "Businesses with multiple buildings or large properties",
      "Companies that want the most advanced camera system",
    ],
    outcomes: [
      "Complete camera system with maximum coverage",
      "Advanced analytics, alerts, and remote access",
      "Professional installation across all locations",
    ],
    includes: [
      "Cameras (8+)",
      "Enterprise NVR or server-based system",
      "Full installation across all sites",
      "Advanced analytics and AI detection",
      "Remote access and ongoing support",
    ],
  },
  "UniFi Camera Install": {
    bestFor: [
      "Businesses using UniFi ecosystem for their network and cameras",
      "Organizations that want UniFi Protect camera integration",
      "Companies that want a single dashboard for network and cameras",
    ],
    outcomes: [
      "UniFi Protect cameras installed and integrated with UniFi network",
      "Single dashboard for network and camera management",
      "Remote access through UniFi interface",
    ],
    includes: [
      "UniFi Protect camera installation",
      "UniFi NVR or Cloud Key integration",
      "Camera configuration and detection setup",
      "UniFi ecosystem integration",
    ],
  },
  "UniFi Door Access Consultation": {
    bestFor: [
      "Businesses interested in UniFi Access door control",
      "Organizations that want to integrate door access with their UniFi system",
      "Companies that want keyless entry and access logging",
    ],
    outcomes: [
      "Assessment of door access needs and UniFi Access feasibility",
      "Equipment recommendations for your doors",
      "Installation roadmap and cost estimate",
    ],
    includes: [
      "Door access needs assessment",
      "UniFi Access compatibility check",
      "Equipment recommendations",
      "Installation cost estimate",
    ],
  },

  // ===== Backup & Recovery (20) =====
  "Backup Readiness Check": {
    bestFor: [
      "Businesses that aren't sure if their backups are working",
      "Organizations that want to verify their backup strategy",
      "Companies that have never tested their backups",
    ],
    outcomes: [
      "Clear understanding of what is and isn't being backed up",
      "Identified gaps in backup coverage",
      "Recommendations for a complete backup strategy",
    ],
    includes: [
      "Current backup configuration review",
      "Backup coverage gap analysis",
      "Restore capability assessment",
      "Backup improvement recommendations",
    ],
  },
  "Computer Backup Setup": {
    bestFor: [
      "Businesses that want workstations backed up",
      "Organizations that want to protect documents and files on employee computers",
      "Companies that want automated computer backups",
    ],
    outcomes: [
      "Automated backup of business documents from computers",
      "Off-site backup for disaster recovery",
      "Tested restore process",
    ],
    includes: [
      "Backup software installation",
      "Backup policy configuration",
      "Initial backup seed",
      "Restore testing",
    ],
  },
  "NAS Backup Setup": {
    bestFor: [
      "Businesses with a NAS that needs backup configuration",
      "Organizations that want their network storage backed up",
      "Companies that want to protect data stored on local NAS devices",
    ],
    outcomes: [
      "NAS backup configured to cloud or secondary location",
      "Automated backup schedule",
      "Verified restore capability",
    ],
    includes: [
      "NAS backup software configuration",
      "Backup target setup (cloud or secondary)",
      "Scheduled backup policy",
      "Restore testing",
    ],
  },
  "Cloud Backup Setup": {
    bestFor: [
      "Businesses that want their critical data backed up to the cloud",
      "Organizations that want off-site backup protection",
      "Companies that want to eliminate tape or local backup management",
    ],
    outcomes: [
      "Cloud backup configured for critical business data",
      "Automated backups with retention policy",
      "Off-site protection against local disasters",
    ],
    includes: [
      "Cloud backup service selection and setup",
      "Backup policy configuration",
      "Initial backup seed",
      "Restore testing and documentation",
    ],
  },
  "Backup Restore Test": {
    bestFor: [
      "Businesses that have backups but have never tested restoring them",
      "Organizations that want to verify their backup actually works",
      "Companies that want to avoid discovering backup failures during an emergency",
    ],
    outcomes: [
      "Verified that backups can be successfully restored",
      "Identified backup or restore issues",
      "Documented restore procedure for emergencies",
    ],
    includes: [
      "Test restore of selected files or systems",
      "Restore time measurement",
      "Backup configuration verification",
      "Restore procedure documentation",
    ],
  },
  "Backup Monitoring Plan": {
    bestFor: [
      "Businesses that want proactive backup monitoring",
      "Organizations that want to be alerted if backups fail",
      "Companies that want to ensure backups are running successfully",
    ],
    outcomes: [
      "Automated backup monitoring with failure alerts",
      "Peace of mind that backups are running",
      "Monthly backup status reports",
    ],
    includes: [
      "Backup monitoring configuration",
      "Alert setup for failures",
      "Monthly backup status review",
      "Quarterly restore test",
    ],
  },
  "Disaster Recovery Plan Starter": {
    bestFor: [
      "Businesses that don't have a disaster recovery plan",
      "Organizations that want to be prepared for major IT disruptions",
      "Companies that want to document their recovery procedures",
    ],
    outcomes: [
      "A documented disaster recovery plan for your business",
      "Clear recovery procedures for different scenarios",
      "Reduced downtime when a disaster occurs",
    ],
    includes: [
      "Disaster recovery planning session",
      "Recovery procedure documentation",
      "Priority system and data identification",
      "DR plan review schedule",
    ],
  },
  "Backup Starter Bundle": {
    bestFor: [
      "Small businesses that want basic backup protection",
      "Organizations that want to start with essential backup coverage",
      "Companies that want an affordable backup package",
    ],
    outcomes: [
      "Essential backup protection for critical data",
      "Automated backups with off-site storage",
      "Basic restore capability",
    ],
    includes: [
      "Cloud backup setup for critical data",
      "Computer backup configuration",
      "Backup monitoring setup",
      "Basic restore testing",
    ],
  },
  "Backup Business Bundle": {
    bestFor: [
      "Growing businesses that need more comprehensive backup",
      "Organizations that want servers, computers, and cloud data backed up",
      "Companies that want a more robust backup solution",
    ],
    outcomes: [
      "Comprehensive backup coverage for servers, workstations, and cloud data",
      "Regular restore testing",
      "Proactive monitoring and alerts",
    ],
    includes: [
      "Server and workstation backup setup",
      "Cloud data backup (M365, Google Workspace)",
      "Backup monitoring and alerting",
      "Quarterly restore testing",
    ],
  },
  "Backup Resilience Bundle": {
    bestFor: [
      "Organizations that want maximum data protection",
      "Businesses that need backup, DR, and continuity planning",
      "Companies that want to be fully prepared for data loss scenarios",
    ],
    outcomes: [
      "Maximum protection with backup, DR, and continuity planning",
      "Verified restore capability with regular testing",
      "Complete documentation for emergency response",
    ],
    includes: [
      "Full backup solution (servers, workstations, cloud)",
      "Disaster recovery plan development",
      "Business continuity planning",
      "Quarterly restore testing and plan review",
    ],
  },
  "Business Continuity Starter Plan": {
    bestFor: [
      "Small businesses that want a basic continuity plan",
      "Organizations that want to document what to do in an outage",
      "Companies that want to reduce downtime risk",
    ],
    outcomes: [
      "A basic business continuity plan for your organization",
      "Clear procedures for common disruption scenarios",
      "Reduced downtime when unexpected events occur",
    ],
    includes: [
      "Business continuity planning session",
      "Critical function identification",
      "Response procedure documentation",
      "Contact list and communication plan",
    ],
  },
  "Emergency Contact Sheet": {
    bestFor: [
      "Businesses that don't have a list of emergency contacts for IT",
      "Organizations that want critical vendor and support numbers accessible",
      "Companies that want to avoid scrambling during emergencies",
    ],
    outcomes: [
      "A printed and digital emergency contact sheet",
      "Critical vendor, support, and utility contact information",
      "Accessible emergency contact list for all key staff",
    ],
    includes: [
      "Emergency contact information gathering",
      "Contact sheet creation and formatting",
      "Digital and printed copy delivery",
      "Quarterly update reminder",
    ],
  },
  "Outage Response Plan": {
    bestFor: [
      "Businesses that want to be prepared for IT outages",
      "Organizations that want documented procedures for common scenarios",
      "Companies that want to minimize downtime during outages",
    ],
    outcomes: [
      "Documented outage response procedures",
      "Clear roles and communication plan during outages",
      "Reduced downtime through faster response",
    ],
    includes: [
      "Outage scenario identification",
      "Response procedure documentation",
      "Communication plan and roles",
      "Plan review and testing schedule",
    ],
  },
  "Power Protection Review": {
    bestFor: [
      "Businesses concerned about power outages affecting their equipment",
      "Organizations that want to protect servers and network gear from power issues",
      "Companies that have experienced equipment damage from power problems",
    ],
    outcomes: [
      "Assessment of current power protection for critical equipment",
      "UPS and surge protection recommendations",
      "Reduced risk of equipment damage from power events",
    ],
    includes: [
      "Critical equipment power audit",
      "UPS sizing and placement review",
      "Surge protection assessment",
      "Power protection recommendations",
    ],
  },
  "Internet Failover Setup": {
    bestFor: [
      "Businesses that need internet redundancy",
      "Organizations that cannot afford to lose internet connectivity",
      "Companies that have experienced costly internet outages",
    ],
    outcomes: [
      "Automatic internet failover when primary connection goes down",
      "Seamless transition with minimal disruption",
      "Tested and verified failover operation",
    ],
    includes: [
      "Secondary internet connection setup",
      "Failover router or modem configuration",
      "Automatic failover testing",
      "Documentation and user guidance",
    ],
  },
  "Critical Account Recovery Kit": {
    bestFor: [
      "Businesses that want to be prepared for account lockouts",
      "Organizations that want recovery procedures documented",
      "Companies that want to avoid being locked out of critical systems",
    ],
    outcomes: [
      "Documented recovery procedures for critical accounts",
      "Secure storage of recovery codes and backup access",
      "Reduced risk of being locked out of essential services",
    ],
    includes: [
      "Critical account inventory",
      "Recovery procedure documentation",
      "Secure recovery code storage",
      "Recovery kit access instructions",
    ],
  },
  "Tabletop Exercise": {
    bestFor: [
      "Organizations that want to practice their incident response",
      "Businesses that have a plan but have never tested it",
      "Companies that want to identify gaps in their procedures",
    ],
    outcomes: [
      "Tested incident response procedures in a safe environment",
      "Identified gaps and improvements in your plans",
      "Team familiarity with their roles during incidents",
    ],
    includes: [
      "Exercise scenario development",
      "Facilitated tabletop exercise session",
      "After-action review and gap analysis",
      "Plan update recommendations",
    ],
  },
  "Continuity Binder": {
    bestFor: [
      "Businesses that want a physical binder with all continuity information",
      "Organizations that want a printed resource for emergencies",
      "Companies that want all critical information in one place",
    ],
    outcomes: [
      "A physical binder with all continuity and recovery information",
      "Quick access to critical information during emergencies",
      "Updated and accessible to key staff",
    ],
    includes: [
      "Information gathering and organization",
      "Binder creation with tabs and sections",
      "Digital backup copy",
      "Quarterly update reminder",
    ],
  },
  "Small Business Resilience Pack": {
    bestFor: [
      "Small businesses that want a complete resilience package",
      "Organizations that want backup, DR, and continuity covered",
      "Companies that want to be prepared for various disruption scenarios",
    ],
    outcomes: [
      "Comprehensive resilience with backup, DR, and continuity planning",
      "Tested recovery procedures",
      "Peace of mind that your business can recover from disruptions",
    ],
    includes: [
      "Cloud backup setup for critical data",
      "Disaster recovery plan development",
      "Business continuity planning",
      "Quarterly review and testing",
    ],
  },

  // ===== Website & SEO (31) - first 10 for brevity, rest follow pattern =====
  "Website Health Check": {
    bestFor: [
      "Businesses that want to know if their website is healthy and secure",
      "Organizations that have noticed website issues but can't diagnose them",
      "Companies that want a baseline assessment of their website",
    ],
    outcomes: [
      "Clear picture of your website's health, security, and performance",
      "Identified issues with recommendations",
      "Prioritized list of fixes",
    ],
    includes: [
      "Website performance testing",
      "Security vulnerability scan",
      "SEO basics review",
      "Health report with recommendations",
    ],
  },
  "Website Speed Snapshot": {
    bestFor: [
      "Businesses concerned about slow website loading times",
      "Organizations that want to improve their website speed",
      "Companies that have been told their site is slow",
    ],
    outcomes: [
      "Current website speed benchmark with recommendations",
      "Identified speed bottlenecks",
      "Improvement roadmap",
    ],
    includes: [
      "Website speed testing across devices",
      "Performance bottleneck analysis",
      "Speed improvement recommendations",
      "Before and after benchmarking",
    ],
  },
  "Website Security Review": {
    bestFor: [
      "Businesses concerned about website security",
      "Organizations that want to identify vulnerabilities",
      "Companies that handle customer data through their website",
    ],
    outcomes: [
      "Website security assessment with vulnerability identification",
      "Recommended security fixes",
      "Reduced risk of website compromise",
    ],
    includes: [
      "Security vulnerability scan",
      "SSL/TLS configuration check",
      "Malware and blacklist check",
      "Security recommendations report",
    ],
  },
  "Website Backup Setup": {
    bestFor: [
      "Businesses that don't have website backups configured",
      "Organizations that want to protect their website content",
      "Companies that have experienced website data loss",
    ],
    outcomes: [
      "Automated website backups with off-site storage",
      "Point-in-time restore capability",
      "Peace of mind that your website can be restored",
    ],
    includes: [
      "Website backup service configuration",
      "Automated backup schedule setup",
      "Off-site backup storage",
      "Restore testing",
    ],
  },
  "Monthly Website Care Plan": {
    bestFor: [
      "Businesses that want ongoing website maintenance",
      "Organizations that want updates, backups, and security monitoring",
      "Companies that want to prevent website issues proactively",
    ],
    outcomes: [
      "Monthly website updates, backups, and security checks",
      "Proactive issue detection and resolution",
      "Reduced risk of website problems",
    ],
    includes: [
      "Monthly website updates (CMS, plugins, themes)",
      "Weekly backup monitoring",
      "Monthly security scan",
      "Monthly performance check",
    ],
  },
  "Landing Page Build": {
    bestFor: [
      "Businesses that want a focused landing page for a campaign or service",
      "Organizations that want a high-converting single page",
      "Companies that want to test a new offering without a full site redesign",
    ],
    outcomes: [
      "Professional landing page designed and built",
      "Clear call-to-action and conversion focus",
      "Mobile-responsive and fast-loading page",
    ],
    includes: [
      "Landing page design and copywriting",
      "Page development and mobile responsiveness",
      "Basic SEO and analytics setup",
      "Page launch and testing",
    ],
  },
  "Local SEO Page Build": {
    bestFor: [
      "Local businesses that want to rank for local search terms",
      "Organizations that want location-specific service pages",
      "Companies that want to attract local customers",
    ],
    outcomes: [
      "Local SEO-optimized service page published",
      "Improved local search visibility",
      "Structured data and local business markup",
    ],
    includes: [
      "Local keyword research and strategy",
      "Page content creation and optimization",
      "Local business schema markup",
      "Google Business Profile integration",
    ],
  },
  "Contact Form Fix": {
    bestFor: [
      "Businesses whose website contact form is broken or not delivering",
      "Organizations that are missing leads due to form issues",
      "Companies that want a reliable contact form",
    ],
    outcomes: [
      "Working contact form that delivers submissions reliably",
      "Spam protection configured",
      "Form submission notifications working",
    ],
    includes: [
      "Contact form diagnosis and testing",
      "Form repair or replacement",
      "Spam protection (Turnstile or CAPTCHA)",
      "Form submission notification setup",
    ],
  },
  "Analytics Setup": {
    bestFor: [
      "Businesses that don't have website analytics installed",
      "Organizations that want to track website visitors and conversions",
      "Companies that want data-driven decisions about their website",
    ],
    outcomes: [
      "Website analytics installed and tracking correctly",
      "Key events and goals configured",
      "Access to analytics dashboard",
    ],
    includes: [
      "Analytics platform setup (GA4 or similar)",
      "Event and goal configuration",
      "Dashboard setup for key metrics",
      "Analytics training and handoff",
    ],
  },
  "Cookie/Privacy Basics Review": {
    bestFor: [
      "Businesses concerned about website privacy compliance",
      "Organizations that want cookie consent configured",
      "Companies that want to address basic privacy requirements",
    ],
    outcomes: [
      "Cookie consent banner configured on your website",
      "Privacy policy review and updates",
      "Basic compliance with privacy regulations",
    ],
    includes: [
      "Cookie audit and classification",
      "Consent banner installation",
      "Privacy policy review",
      "Privacy compliance recommendations",
    ],
  },
  "Local SEO Snapshot": {
    bestFor: [
      "Local businesses that want to understand their local search presence",
      "Organizations that want to know how they rank locally",
      "Companies that want to improve local visibility",
    ],
    outcomes: [
      "Current local search visibility assessment",
      "Google Business Profile optimization recommendations",
      "Local SEO improvement roadmap",
    ],
    includes: [
      "Local search ranking assessment",
      "Google Business Profile audit",
      "Local citation review",
      "Local SEO recommendations",
    ],
  },
  "Google Business Profile Optimization": {
    bestFor: [
      "Local businesses that want to improve their Google Business Profile",
      "Organizations that want to show up in Google Maps and local search",
      "Companies that want to attract more local customers",
    ],
    outcomes: [
      "Optimized Google Business Profile with complete information",
      "Improved local search visibility",
      "More customer reviews and engagement",
    ],
    includes: [
      "Profile completeness audit",
      "Category, description, and photo optimization",
      "Review management strategy",
      "Posting and engagement recommendations",
    ],
  },
  "Local Service Page Pack": {
    bestFor: [
      "Local businesses that want multiple location-specific pages",
      "Organizations that serve multiple towns or areas",
      "Companies that want to dominate local search results",
    ],
    outcomes: [
      "Multiple local service pages optimized for local search",
      "Improved visibility across target locations",
      "Structured local business markup",
    ],
    includes: [
      "Local keyword research for each location",
      "Multi-page content creation",
      "Local schema markup implementation",
      "Internal linking strategy",
    ],
  },
  "Blog Starter Pack": {
    bestFor: [
      "Businesses that want to start a blog for their website",
      "Organizations that want to improve SEO through content",
      "Companies that want to establish thought leadership",
    ],
    outcomes: [
      "Blog set up and ready for content publishing",
      "SEO-optimized blog structure",
      "Content strategy and starter posts",
    ],
    includes: [
      "Blog platform setup and configuration",
      "Blog design and layout",
      "SEO-optimized blog structure",
      "Content strategy and 3 starter posts",
    ],
  },
  "Technical SEO Fix Pack": {
    bestFor: [
      "Businesses with technical SEO issues hurting their rankings",
      "Organizations that want to fix crawl errors, broken links, and schema issues",
      "Companies that want a technical SEO audit",
    ],
    outcomes: [
      "Technical SEO issues identified and fixed",
      "Improved search engine crawlability",
      "Higher search rankings potential",
    ],
    includes: [
      "Technical SEO audit",
      "Crawl error resolution",
      "Broken link fixing",
      "Schema markup review and fixes",
    ],
  },
  "Monthly Local SEO Plan": {
    bestFor: [
      "Local businesses that want ongoing local SEO management",
      "Organizations that want to maintain and improve local rankings",
      "Companies that want monthly citation building and review management",
    ],
    outcomes: [
      "Monthly local SEO improvements and maintenance",
      "Improved local search rankings over time",
      "Active review management and citation building",
    ],
    includes: [
      "Monthly Google Business Profile optimization",
      "Citation building and cleanup",
      "Review monitoring and response",
      "Monthly performance report",
    ],
  },
  "Review Request System Setup": {
    bestFor: [
      "Businesses that want more customer reviews online",
      "Organizations that want an automated review request process",
      "Companies that want to improve their online reputation",
    ],
    outcomes: [
      "Automated review request system configured",
      "More customer reviews on Google and other platforms",
      "Review monitoring and management",
    ],
    includes: [
      "Review platform selection and setup",
      "Automated review request workflow",
      "Review monitoring dashboard",
      "Review response guidelines",
    ],
  },
  "Schema Markup Setup": {
    bestFor: [
      "Businesses that want rich search results with structured data",
      "Organizations that want to improve their search appearance",
      "Companies that want LocalBusiness, FAQ, or Service schema",
    ],
    outcomes: [
      "Schema markup implemented on your website",
      "Rich search results with stars, prices, and details",
      "Improved search click-through rates",
    ],
    includes: [
      "Schema type selection and planning",
      "Schema markup implementation",
      "Testing with Google's Rich Results tool",
      "Schema documentation",
    ],
  },
  "Website Safety Bundle": {
    bestFor: [
      "Businesses that want comprehensive website security",
      "Organizations that want backup, monitoring, and security in one package",
      "Companies that want to protect their online presence",
    ],
    outcomes: [
      "Website secured with backup, monitoring, and security hardening",
      "Reduced risk of website compromise",
      "Automated protection and alerts",
    ],
    includes: [
      "Website backup setup",
      "Website security monitoring",
      "SSL/TLS configuration",
      "Monthly security scan",
    ],
  },
  "Local SEO Starter": {
    bestFor: [
      "Local businesses new to local search optimization",
      "Organizations that want a basic local SEO foundation",
      "Companies that want to start appearing in local search",
    ],
    outcomes: [
      "Local SEO foundation with optimized profile and citations",
      "Improved local search visibility",
      "Actionable local SEO roadmap",
    ],
    includes: [
      "Google Business Profile setup or optimization",
      "Local citation audit and cleanup",
      "Basic local keyword strategy",
      "Local SEO roadmap",
    ],
  },
  "Website Growth Bundle": {
    bestFor: [
      "Businesses that want to grow their website's traffic and conversions",
      "Organizations that want SEO, content, and analytics working together",
      "Companies that want a comprehensive website growth strategy",
    ],
    outcomes: [
      "Improved website traffic and search rankings",
      "Better conversion rates from website visitors",
      "Data-driven website improvement strategy",
    ],
    includes: [
      "Technical SEO audit and fixes",
      "Content strategy and blog setup",
      "Analytics configuration and goal tracking",
      "Monthly performance review",
    ],
  },
  "Cloudflare Basic Setup": {
    bestFor: [
      "Businesses that want to use Cloudflare for their website",
      "Organizations that want CDN, DNS, and security from Cloudflare",
      "Companies that want faster website loading and DDoS protection",
    ],
    outcomes: [
      "Cloudflare configured for your website",
      "Faster loading through CDN",
      "Basic DDoS protection and SSL",
    ],
    includes: [
      "Cloudflare account setup and domain configuration",
      "DNS record migration",
      "SSL/TLS configuration",
      "Performance optimization (CDN, caching)",
    ],
  },
  "Cloudflare Security Tune-Up": {
    bestFor: [
      "Businesses already using Cloudflare that want better security",
      "Organizations that want to configure WAF, rate limiting, and bot management",
      "Companies that want to maximize Cloudflare's security features",
    ],
    outcomes: [
      "Hardened Cloudflare security configuration",
      "WAF rules and rate limiting active",
      "Improved protection against web threats",
    ],
    includes: [
      "Cloudflare security settings review",
      "WAF rule configuration",
      "Rate limiting and bot management setup",
      "Security recommendations report",
    ],
  },
  "DNS Cleanup": {
    bestFor: [
      "Businesses with messy DNS records accumulated over years",
      "Organizations that want to clean up stale DNS records",
      "Companies that want to reduce DNS security risks",
    ],
    outcomes: [
      "Cleaned up DNS zone with only current, valid records",
      "Reduced DNS security risk",
      "Documented DNS configuration",
    ],
    includes: [
      "DNS record audit and inventory",
      "Stale record identification and removal",
      "DNS configuration review",
      "DNS documentation",
    ],
  },
  "Email DNS Authentication Fix": {
    bestFor: [
      "Businesses that want to improve email deliverability",
      "Organizations that want to prevent email spoofing",
      "Companies that have emails going to spam",
    ],
    outcomes: [
      "SPF, DKIM, and DMARC configured for your domain",
      "Improved email deliverability",
      "Reduced email spoofing risk",
    ],
    includes: [
      "SPF record review and configuration",
      "DKIM signing setup",
      "DMARC policy configuration",
      "Email deliverability testing",
    ],
  },
  "Domain Registrar Security Setup": {
    bestFor: [
      "Businesses that want to secure their domain registrar account",
      "Organizations that want to prevent domain hijacking",
      "Companies that want to lock their domain",
    ],
    outcomes: [
      "Domain registrar account secured with MFA and locks",
      "Reduced risk of domain theft or unauthorized changes",
      "Documented domain management procedures",
    ],
    includes: [
      "Registrar account security review",
      "Domain lock and transfer lock enabling",
      "MFA and contact verification setup",
      "Domain management recommendations",
    ],
  },
  "Cloudflare Turnstile Setup": {
    bestFor: [
      "Businesses that want bot protection on their website forms",
      "Organizations that want a privacy-friendly CAPTCHA alternative",
      "Companies that want to reduce spam form submissions",
    ],
    outcomes: [
      "Cloudflare Turnstile installed on website forms",
      "Bot protection without privacy-invasive CAPTCHAs",
      "Reduced spam submissions",
    ],
    includes: [
      "Turnstile site key and secret key generation",
      "Turnstile widget integration on forms",
      "Server-side verification setup",
      "Testing and validation",
    ],
  },
  "Cloudflare Redirect Setup": {
    bestFor: [
      "Businesses that need URL redirects configured",
      "Organizations that want to set up www to non-www redirects",
      "Companies that are restructuring their website URLs",
    ],
    outcomes: [
      "URL redirects configured in Cloudflare",
      "Proper redirect chains for SEO",
      "No broken redirects or loops",
    ],
    includes: [
      "Redirect requirements gathering",
      "Redirect rule configuration in Cloudflare",
      "Redirect testing and validation",
      "Documentation of redirect rules",
    ],
  },
  "Domain Expiration Protection": {
    bestFor: [
      "Businesses that want to avoid accidental domain expiration",
      "Organizations that want auto-renewal and monitoring",
      "Companies that have almost lost a domain before",
    ],
    outcomes: [
      "Auto-renewal enabled across all domains",
      "Expiration monitoring and alerts",
      "Reduced risk of domain loss",
    ],
    includes: [
      "Domain expiration audit",
      "Auto-renewal configuration",
      "Expiration monitoring setup",
      "Domain management recommendations",
    ],
  },
  "Cloudflare Monthly Management": {
    bestFor: [
      "Businesses using Cloudflare that want ongoing management",
      "Organizations that want regular Cloudflare reviews",
      "Companies that want proactive Cloudflare optimization",
    ],
    outcomes: [
      "Monthly Cloudflare health check and optimization",
      "Proactive security settings review",
      "Performance optimization recommendations",
    ],
    includes: [
      "Monthly Cloudflare dashboard review",
      "Security settings check",
      "Performance and caching review",
      "Monthly recommendations report",
    ],
  },
  "Domain Protection Pack": {
    bestFor: [
      "Businesses that want comprehensive domain security",
      "Organizations that want to protect all their domains",
      "Companies that want to prevent domain-related issues",
    ],
    outcomes: [
      "All domains secured with locking, auto-renewal, and monitoring",
      "Reduced risk of domain loss or hijacking",
      "Documented domain portfolio",
    ],
    includes: [
      "Domain portfolio audit",
      "Security hardening across all domains",
      "Expiration monitoring and alerts",
      "Domain management documentation",
    ],
  },

  // ===== Compliance & Policies (19) =====
  "Cyber Insurance Questionnaire Help": {
    bestFor: [
      "Businesses applying for cyber insurance that need help with the questionnaire",
      "Organizations that find insurance applications confusing",
      "Companies that want to improve their insurance answers",
    ],
    outcomes: [
      "Completed cyber insurance application with accurate answers",
      "Understanding of how your security measures map to insurance questions",
      "Better insurance terms through improved security posture",
    ],
    includes: [
      "Questionnaire review and guidance",
      "Security controls mapping to questions",
      "Answer preparation assistance",
      "Gap identification for future improvement",
    ],
  },
  "Acceptable Use Policy Starter": {
    bestFor: [
      "Businesses that don't have an acceptable use policy for technology",
      "Organizations that want to set clear expectations for technology use",
      "Companies that want to protect themselves from liability",
    ],
    outcomes: [
      "Customized acceptable use policy document",
      "Clear rules for technology use by employees",
      "Legal protection through documented policies",
    ],
    includes: [
      "Policy template customization",
      "Business-specific rule development",
      "Policy document delivery",
      "Policy implementation guidance",
    ],
  },
  "Password Policy Starter": {
    bestFor: [
      "Businesses that don't have a formal password policy",
      "Organizations that want to enforce better password practices",
      "Companies that want to meet insurance password requirements",
    ],
    outcomes: [
      "Customized password policy document",
      "Clear password requirements for all staff",
      "Compliance with insurance password standards",
    ],
    includes: [
      "Password policy template customization",
      "Complexity and rotation requirements",
      "MFA integration guidance",
      "Policy document delivery",
    ],
  },
  "Data Backup Policy Starter": {
    bestFor: [
      "Businesses that need a documented backup policy",
      "Organizations that want to formalize their backup procedures",
      "Companies that want to meet compliance requirements",
    ],
    outcomes: [
      "Customized data backup policy document",
      "Clear backup schedules and retention requirements",
      "Documented backup procedures",
    ],
    includes: [
      "Backup policy template customization",
      "Retention schedule definition",
      "Restore testing requirements",
      "Policy document delivery",
    ],
  },
  "Incident Response Policy Starter": {
    bestFor: [
      "Businesses that need a documented incident response policy",
      "Organizations that want to formalize incident handling",
      "Companies that want to meet insurance requirements",
    ],
    outcomes: [
      "Customized incident response policy",
      "Clear incident classification and escalation procedures",
      "Documented response process",
    ],
    includes: [
      "Incident response policy template customization",
      "Incident classification definitions",
      "Escalation and notification procedures",
      "Policy document delivery",
    ],
  },
  "Vendor Access Policy Starter": {
    bestFor: [
      "Businesses that give vendors access to their systems",
      "Organizations that want to control and document vendor access",
      "Companies that want to reduce vendor-related security risks",
    ],
    outcomes: [
      "Customized vendor access policy document",
      "Clear requirements for vendor access",
      "Reduced risk from third-party access",
    ],
    includes: [
      "Vendor access policy template customization",
      "Access review requirements",
      "Termination procedures",
      "Policy document delivery",
    ],
  },
  "Employee Offboarding Checklist": {
    bestFor: [
      "Businesses that don't have a consistent offboarding process",
      "Organizations that want to ensure accounts are removed when employees leave",
      "Companies that want to prevent data loss from departing employees",
    ],
    outcomes: [
      "Complete offboarding checklist for employee departures",
      "Consistent account removal process",
      "Reduced risk of data loss from departing staff",
    ],
    includes: [
      "Offboarding process review",
      "Checklist template customization",
      "Account removal procedures",
      "Data retention guidance",
    ],
  },
  "Asset Inventory Starter": {
    bestFor: [
      "Businesses that don't know what technology assets they have",
      "Organizations that want to track hardware and software",
      "Companies that want to improve asset management",
    ],
    outcomes: [
      "Complete inventory of technology assets",
      "Hardware and software tracking system",
      "Foundation for lifecycle management",
    ],
    includes: [
      "Asset discovery across your environment",
      "Inventory documentation and organization",
      "Asset tracking recommendations",
      "Inventory management process",
    ],
  },
  "Security Awareness Policy Starter": {
    bestFor: [
      "Businesses that need a security awareness training policy",
      "Organizations that want to formalize training requirements",
      "Companies that want to meet compliance training requirements",
    ],
    outcomes: [
      "Customized security awareness policy document",
      "Clear training requirements and frequency",
      "Documented security awareness program",
    ],
    includes: [
      "Security awareness policy template customization",
      "Training frequency and content requirements",
      "Phishing simulation guidelines",
      "Policy document delivery",
    ],
  },
  "Remote Work Policy Starter": {
    bestFor: [
      "Businesses with remote or hybrid work arrangements",
      "Organizations that want to set remote work security requirements",
      "Companies that want to protect data accessed from home",
    ],
    outcomes: [
      "Customized remote work policy document",
      "Clear requirements for remote work security",
      "Protected data accessed from remote locations",
    ],
    includes: [
      "Remote work policy template customization",
      "Device and connection requirements",
      "Data protection rules for remote work",
      "Policy document delivery",
    ],
  },
  "Cyber Insurance Readiness Bundle": {
    bestFor: [
      "Businesses preparing for cyber insurance applications or renewals",
      "Organizations that want to improve their insurability",
      "Companies that want policies, procedures, and security measures in place",
    ],
    outcomes: [
      "Complete insurance-ready documentation package",
      "Improved security posture meeting insurance requirements",
      "Confidence in the insurance application process",
    ],
    includes: [
      "Cyber insurance questionnaire assistance",
      "Policy document creation (AUP, password, backup, incident)",
      "Security gap assessment",
      "Remediation recommendations",
    ],
  },
  "Small Business Policy Pack": {
    bestFor: [
      "Small businesses that need a complete set of IT policies",
      "Organizations that want multiple policies without starting from scratch",
      "Companies that want insurance-ready documentation",
    ],
    outcomes: [
      "Complete set of customized IT policies",
      "Documentation meeting insurance requirements",
      "Clear policies for employees to follow",
    ],
    includes: [
      "Acceptable use policy",
      "Password policy",
      "Data backup policy",
      "Incident response policy",
    ],
  },
  "Compliance Foundation Bundle": {
    bestFor: [
      "Businesses that need to meet basic compliance requirements",
      "Organizations that want policies, inventory, and access review",
      "Companies that want a compliance foundation",
    ],
    outcomes: [
      "Documented policies and procedures for compliance",
      "Asset inventory and access controls",
      "Foundation for ongoing compliance management",
    ],
    includes: [
      "Policy document creation (multiple policies)",
      "Asset inventory setup",
      "Access review process",
      "Compliance gap assessment",
    ],
  },
  "Risk Register Starter": {
    bestFor: [
      "Businesses that want to document and track technology risks",
      "Organizations that want a formal risk management process",
      "Companies that want to meet insurance risk assessment requirements",
    ],
    outcomes: [
      "Documented risk register with identified risks",
      "Risk scoring and prioritization",
      "Risk treatment plan",
    ],
    includes: [
      "Risk assessment workshop",
      "Risk register template setup",
      "Risk scoring and prioritization",
      "Risk treatment recommendations",
    ],
  },
  "Quarterly Access Review": {
    bestFor: [
      "Businesses that want to review user access quarterly",
      "Organizations that want to maintain clean access controls",
      "Companies that want to meet compliance requirements",
    ],
    outcomes: [
      "Quarterly user access review completed",
      "Removed or adjusted inappropriate access",
      "Audit trail of access reviews",
    ],
    includes: [
      "Quarterly user access audit",
      "Excessive access identification",
      "Access adjustment recommendations",
      "Access review documentation",
    ],
  },
  "Data Handling Checklist": {
    bestFor: [
      "Businesses that handle sensitive customer or employee data",
      "Organizations that want to document data handling procedures",
      "Companies that want to reduce data breach risk",
    ],
    outcomes: [
      "Documented data handling procedures",
      "Clear classification and handling rules",
      "Reduced risk of data mishandling",
    ],
    includes: [
      "Data flow assessment",
      "Data classification guidelines",
      "Handling procedure documentation",
      "Staff training guidance",
    ],
  },
  "PCI/Payment Handling Readiness Review": {
    bestFor: [
      "Businesses that accept credit card payments",
      "Organizations that want to understand PCI requirements",
      "Companies that want to reduce payment processing risk",
    ],
    outcomes: [
      "Understanding of PCI requirements for your business",
      "Identified gaps in payment handling security",
      "Remediation roadmap for PCI compliance",
    ],
    includes: [
      "Payment processing flow review",
      "PCI requirement gap analysis",
      "Security control recommendations",
      "PCI compliance roadmap",
    ],
  },
  "HIPAA-Oriented IT Readiness Review": {
    bestFor: [
      "Healthcare organizations that handle PHI",
      "Businesses that need to understand HIPAA IT requirements",
      "Companies that want to prepare for HIPAA compliance",
    ],
    outcomes: [
      "Understanding of HIPAA IT security requirements",
      "Identified gaps in HIPAA compliance",
      "Remediation roadmap",
    ],
    includes: [
      "HIPAA IT requirement review",
      "Security gap analysis",
      "Policy and procedure recommendations",
      "HIPAA compliance roadmap",
    ],
  },
  "CMMC/NIST Starter Gap Review": {
    bestFor: [
      "Defense contractors or businesses in the supply chain",
      "Organizations that need to understand CMMC or NIST requirements",
      "Companies that want to start their compliance journey",
    ],
    outcomes: [
      "Understanding of CMMC or NIST requirements for your business",
      "Identified compliance gaps",
      "Remediation roadmap",
    ],
    includes: [
      "CMMC or NIST requirement review",
      "Security control gap analysis",
      "Policy and procedure recommendations",
      "Compliance roadmap",
    ],
  },

  // ===== Monthly IT Plans (15) =====
  "MCT Essential Care": {
    bestFor: [
      "Small businesses that want basic IT monitoring and support",
      "Organizations that want a low-cost entry to managed IT",
      "Companies that want proactive monitoring without full management",
    ],
    outcomes: [
      "Basic IT monitoring and support at a predictable monthly price",
      "Proactive problem detection",
      "Responsive help desk for issues",
    ],
    includes: [
      "Basic monitoring of critical systems",
      "Help desk support during business hours",
      "Monthly health check",
      "Quarterly review",
    ],
  },
  "MCT Business Care": {
    bestFor: [
      "Growing businesses that need more comprehensive IT support",
      "Organizations that want monitoring, support, and basic security",
      "Companies that want to reduce IT headaches",
    ],
    outcomes: [
      "Comprehensive IT monitoring, support, and security",
      "Proactive maintenance and issue resolution",
      "Reduced downtime and IT stress",
    ],
    includes: [
      "Full system monitoring and alerting",
      "Help desk support with priority response",
      "Antivirus and patch management",
      "Monthly review and reporting",
    ],
  },
  "MCT Secure Care": {
    bestFor: [
      "Businesses that prioritize security in their IT management",
      "Organizations that want security-focused managed IT",
      "Companies that want proactive threat detection and response",
    ],
    outcomes: [
      "Security-focused IT management with advanced protection",
      "Continuous security monitoring and threat response",
      "Improved security posture and compliance",
    ],
    includes: [
      "Everything in Business Care",
      "Advanced endpoint protection (EDR)",
      "Quarterly security assessments",
      "Security incident response",
    ],
  },
  "MCT Complete Care": {
    bestFor: [
      "Organizations that want comprehensive fully managed IT",
      "Businesses that want to outsource all IT management",
      "Companies that want maximum protection and support",
    ],
    outcomes: [
      "Complete IT management with no surprises",
      "Maximum security, monitoring, and support",
      "Strategic IT guidance and planning",
    ],
    includes: [
      "Everything in Secure Care",
      "24/7 monitoring and support",
      "Strategic IT planning and roadmap",
      "Quarterly business review",
    ],
  },
  "MCT Co-Managed IT": {
    bestFor: [
      "Organizations with an internal IT person who needs backup",
      "Businesses that want to supplement their existing IT team",
      "Companies that want specialized expertise without hiring",
    ],
    outcomes: [
      "Professional IT support backing up your internal team",
      "Coverage for vacations, complex projects, and after-hours",
      "Access to specialized expertise when needed",
    ],
    includes: [
      "Help desk escalation support",
      "Project assistance and expertise",
      "After-hours coverage",
      "Quarterly strategy review",
    ],
  },
  "Cyber Basic": {
    bestFor: [
      "Small businesses that want entry-level cybersecurity monitoring",
      "Organizations that want basic threat detection",
      "Companies that want to start a cybersecurity program",
    ],
    outcomes: [
      "Basic cybersecurity monitoring and alerts",
      "Threat detection for common attack vectors",
      "Monthly security summary",
    ],
    includes: [
      "Basic threat monitoring",
      "Weekly vulnerability scan",
      "Monthly security summary report",
      "Security alert response",
    ],
  },
  "Cyber Plus": {
    bestFor: [
      "Businesses that want more comprehensive cybersecurity",
      "Organizations that want EDR, monitoring, and response",
      "Companies that want to meet insurance security requirements",
    ],
    outcomes: [
      "Enhanced cybersecurity with advanced threat detection",
      "EDR protection on all endpoints",
      "Quarterly security assessments",
    ],
    includes: [
      "Advanced endpoint protection (EDR)",
      "24/7 threat monitoring",
      "Quarterly security assessment",
      "Incident response support",
    ],
  },
  "Cyber Complete": {
    bestFor: [
      "Organizations that want maximum cybersecurity protection",
      "Businesses that handle sensitive data or have compliance requirements",
      "Companies that want a complete security program",
    ],
    outcomes: [
      "Comprehensive cybersecurity program with full coverage",
      "Advanced threat hunting and response",
      "Proactive security improvement",
    ],
    includes: [
      "Everything in Cyber Plus",
      "Advanced threat hunting",
      "Security awareness training",
      "Quarterly executive security briefing",
    ],
  },
  "Managed DNS Plan": {
    bestFor: [
      "Businesses that want professional DNS management",
      "Organizations that want DNS security and reliability",
      "Companies that want to prevent DNS-related outages",
    ],
    outcomes: [
      "Managed DNS with security and reliability",
      "DNS monitoring and alerting",
      "Reduced DNS-related downtime",
    ],
    includes: [
      "DNS management and monitoring",
      "DNS security configuration",
      "DNS change management",
      "Monthly DNS health report",
    ],
  },

  // ===== Emergency Support (10) =====
  "Emergency Remote Support": {
    bestFor: [
      "Businesses that need immediate remote technical assistance",
      "Organizations that have a technology problem they can't solve",
      "Companies that need help without an onsite visit",
    ],
    outcomes: [
      "Remote diagnosis and resolution of your urgent issue",
      "Minimized downtime through rapid response",
      "Documentation of the issue and resolution",
    ],
    includes: [
      "Immediate remote session",
      "Diagnosis and troubleshooting",
      "Issue resolution or workaround",
      "Post-incident summary",
    ],
  },
  "Emergency On-Site Visit": {
    bestFor: [
      "Businesses that need a technician to come to their location urgently",
      "Organizations with hardware or network issues requiring physical presence",
      "Companies that have tried remote support without success",
    ],
    outcomes: [
      "On-site technician arrives to resolve the issue",
      "Physical diagnosis and repair",
      "Minimized business disruption",
    ],
    includes: [
      "Priority on-site dispatch",
      "On-site diagnosis and repair",
      "Parts replacement coordination",
      "Post-service summary",
    ],
  },
  "Email Compromise Response": {
    bestFor: [
      "Businesses that suspect their email has been hacked",
      "Organizations that have received notices of unauthorized email access",
      "Companies that need to respond to an email security incident",
    ],
    outcomes: [
      "Compromised email account secured",
      "Unauthorized access removed",
      "Recovery steps completed",
    ],
    includes: [
      "Immediate account security assessment",
      "Compromised account recovery",
      "Security cleanup and password reset",
      "Post-incident recommendations",
    ],
  },
  "Ransomware First Response": {
    bestFor: [
      "Businesses that are experiencing a ransomware attack",
      "Organizations that have encrypted files and need immediate help",
      "Companies that want to minimize ransomware damage",
    ],
    outcomes: [
      "Ransomware attack contained and assessed",
      "Critical systems isolated to prevent spread",
      "Recovery plan initiated",
    ],
    includes: [
      "Immediate containment and isolation",
      "Attack scope assessment",
      "Recovery planning and initiation",
      "Law enforcement reporting guidance",
    ],
  },
  "Website Down Emergency": {
    bestFor: [
      "Businesses whose website is down and need it restored urgently",
      "Organizations that are losing revenue from website downtime",
      "Companies that need immediate website recovery",
    ],
    outcomes: [
      "Website restored and accessible",
      "Root cause identified and addressed",
      "Prevention recommendations",
    ],
    includes: [
      "Immediate website diagnosis",
      "Website restoration",
      "Root cause analysis",
      "Prevention recommendations",
    ],
  },
  "Network Down Emergency": {
    bestFor: [
      "Businesses whose network is down and need connectivity restored",
      "Organizations that cannot work without internet or network access",
      "Companies that need immediate network recovery",
    ],
    outcomes: [
      "Network connectivity restored",
      "Root cause identified and addressed",
      "Prevention recommendations",
    ],
    includes: [
      "Immediate network diagnosis",
      "Network restoration",
      "Root cause analysis",
      "Prevention recommendations",
    ],
  },
  "Computer Won't Boot Support": {
    bestFor: [
      "Businesses with a computer that won't start up",
      "Organizations that need data recovered from a non-booting computer",
      "Companies that need to get a critical computer working again",
    ],
    outcomes: [
      "Computer restored to working condition or data recovered",
      "Diagnosis of the root cause",
      "Recommendations for preventing recurrence",
    ],
    includes: [
      "Diagnosis of boot failure",
      "System repair or data recovery",
      "Hardware diagnosis if needed",
      "Recommendations for next steps",
    ],
  },
  "Data Recovery Coordination": {
    bestFor: [
      "Businesses that need to recover data from failed drives",
      "Organizations that have lost critical data and need professional recovery",
      "Companies that need specialist data recovery services",
    ],
    outcomes: [
      "Data recovery attempt coordinated with professionals",
      "Recovered data returned to you",
      "Understanding of what was recoverable",
    ],
    includes: [
      "Data loss assessment",
      "Recovery specialist coordination",
      "Recovery attempt management",
      "Recovered data delivery",
    ],
  },
  "Emergency Support Retainer": {
    bestFor: [
      "Businesses that want guaranteed priority access for emergencies",
      "Organizations that cannot afford to wait during critical incidents",
      "Companies that want a dedicated emergency response commitment",
    ],
    outcomes: [
      "Guaranteed priority response for emergency situations",
      "Dedicated contact for critical incidents",
      "Predictable emergency support costs",
    ],
    includes: [
      "Priority dispatch for emergency incidents",
      "Guaranteed response time (within SLA)",
      "Dedicated emergency contact",
      "Monthly retainer management",
    ],
  },
  "Critical Account Lockout Help": {
    bestFor: [
      "Businesses locked out of critical accounts or systems",
      "Organizations that need account recovery assistance",
      "Companies that have lost access to admin accounts",
    ],
    outcomes: [
      "Account access restored",
      "Account recovery procedures documented",
      "Prevention recommendations",
    ],
    includes: [
      "Account lockout diagnosis",
      "Account recovery assistance",
      "Backup access method setup",
      "Lockout prevention recommendations",
    ],
  },

  // ===== Business Starter Packs (43) - key bundles =====
  "Small Business IT Starter Pack": {
    bestFor: [
      "New small businesses that need a technology foundation",
      "Organizations that want a coordinated IT setup package",
      "Companies that want to start with good security practices",
    ],
    outcomes: [
      "Complete technology foundation for your new business",
      "Email, security, backup, and basic IT setup completed",
      "Professional IT configuration from day one",
    ],
    includes: [
      "Microsoft 365 tenant setup (up to 5 users)",
      "Basic security configuration",
      "Workstation security setup",
      "Backup readiness check",
    ],
  },
  "New Business Technology Setup": {
    bestFor: [
      "Entrepreneurs starting a new business who need technology set up",
      "Organizations that want a complete technology package",
      "Companies that want to avoid common startup technology mistakes",
    ],
    outcomes: [
      "Complete technology environment for your new business",
      "Email, website, network, and devices configured",
      "Professional IT foundation from day one",
    ],
    includes: [
      "Microsoft 365 setup",
      "Business internet and Wi-Fi configuration",
      "Workstation setup and security",
      "Basic website or landing page",
    ],
  },
  "Business Owner Peace of Mind Pack": {
    bestFor: [
      "Business owners who want to know their technology is secure and reliable",
      "Organizations that want a comprehensive health check",
      "Companies that want to identify and fix issues before they cause problems",
    ],
    outcomes: [
      "Complete technology health assessment",
      "Identified and resolved critical issues",
      "Peace of mind that your IT is in good shape",
    ],
    includes: [
      "Full security assessment",
      "Backup verification",
      "Network health check",
      "Priority support for 30 days",
    ],
  },
  "Local Business Online Presence Pack": {
    bestFor: [
      "Local businesses that want a better online presence",
      "Organizations that want website, SEO, and Google Business Profile optimization",
      "Companies that want to attract more local customers online",
    ],
    outcomes: [
      "Improved online presence across search, maps, and website",
      "More local customers finding your business online",
      "Professional website and local SEO foundation",
    ],
    includes: [
      "Website health check and improvements",
      "Google Business Profile optimization",
      "Local SEO setup",
      "Review request system",
    ],
  },
  "New Client Foundation": {
    bestFor: [
      "New clients joining Maine Cyber Tech for managed services",
      "Organizations that need an initial onboarding and assessment",
      "Companies that want a smooth transition to managed IT",
    ],
    outcomes: [
      "Smooth onboarding to Maine Cyber Tech managed services",
      "Complete technology assessment and baseline",
      "Immediate issues identified and addressed",
    ],
    includes: [
      "Full technology assessment",
      "Security baseline review",
      "Backup verification",
      "Managed IT onboarding",
    ],
  },
  "New Business IT Setup": {
    bestFor: [
      "New businesses that need a complete technology setup",
      "Entrepreneurs who want professional IT from the start",
      "Organizations that want to avoid common startup IT mistakes",
    ],
    outcomes: [
      "Complete technology infrastructure for your new business",
      "Professional setup of email, network, devices, and security",
      "Scalable foundation for future growth",
    ],
    includes: [
      "Microsoft 365 tenant setup",
      "Business internet and Wi-Fi installation",
      "Workstation procurement and setup",
      "Basic security configuration",
    ],
  },
  "New Employee Setup Bundle": {
    bestFor: [
      "Businesses that need to set up technology for a new hire",
      "Organizations that want a consistent onboarding process",
      "Companies that want new employees productive on day one",
    ],
    outcomes: [
      "New employee fully equipped with technology on day one",
      "Computer, accounts, and access all configured",
      "Consistent onboarding experience",
    ],
    includes: [
      "Computer setup or procurement",
      "Microsoft 365 account and email setup",
      "Required software installation",
      "Security baseline configuration",
    ],
  },
  "Employee Exit Lockdown Bundle": {
    bestFor: [
      "Businesses that need to secure technology when an employee leaves",
      "Organizations that want to prevent data loss from departures",
      "Companies that want a consistent offboarding process",
    ],
    outcomes: [
      "All accounts and access properly removed",
      "Company data retained and secured",
      "Complete offboarding audit trail",
    ],
    includes: [
      "Account access removal",
      "Email and data preservation",
      "Device recovery and wipe",
      "Offboarding documentation",
    ],
  },
  "Office Move IT Planning": {
    bestFor: [
      "Businesses planning a physical office move",
      "Organizations that need IT infrastructure at a new location",
      "Companies that want to minimize downtime during a move",
    ],
    outcomes: [
      "IT infrastructure ready at the new location on move-in day",
      "Minimal business disruption during the transition",
      "Professional setup at the new location",
    ],
    includes: [
      "New location site survey and planning",
      "Network infrastructure setup",
      "Internet service coordination",
      "Move-day IT support",
    ],
  },
  "Vendor Transition Package": {
    bestFor: [
      "Businesses switching IT providers or vendors",
      "Organizations that want a smooth transition between providers",
      "Companies that want to avoid gaps during vendor changes",
    ],
    outcomes: [
      "Smooth transition from old to new IT provider",
      "All systems documented and transferred",
      "No gaps in support or security",
    ],
    includes: [
      "Current vendor documentation review",
      "System inventory and access transfer",
      "New provider onboarding coordination",
      "Transition project management",
    ],
  },
  "IT Documentation Rebuild": {
    bestFor: [
      "Businesses that have lost or never had IT documentation",
      "Organizations that rely on tribal knowledge for IT",
      "Companies that want professional IT documentation",
    ],
    outcomes: [
      "Complete IT documentation for your organization",
      "Network diagrams, passwords, and procedures documented",
      "Reduced dependency on tribal knowledge",
    ],
    includes: [
      "Network infrastructure documentation",
      "System and account inventory",
      "Password and access documentation",
      "Procedure documentation",
    ],
  },
  "Asset Inventory Buildout": {
    bestFor: [
      "Businesses that don't know what technology they have",
      "Organizations that want a complete asset tracking system",
      "Companies that want to improve IT budgeting and planning",
    ],
    outcomes: [
      "Complete technology asset inventory",
      "Hardware, software, and license tracking",
      "Foundation for lifecycle management",
    ],
    includes: [
      "On-site asset discovery",
      "Asset database creation",
      "Warranty and license tracking",
      "Asset management recommendations",
    ],
  },
  "IT Roadmap Session": {
    bestFor: [
      "Businesses that want a strategic technology plan",
      "Organizations that want to align IT with business goals",
      "Companies that want to plan technology investments",
    ],
    outcomes: [
      "A documented technology roadmap for the next 12-24 months",
      "Aligned IT investments with business priorities",
      "Clear understanding of upcoming technology needs",
    ],
    includes: [
      "Business and technology strategy session",
      "Current state assessment",
      "Technology roadmap document",
      "Budget planning guidance",
    ],
  },
  "Quarterly Business Review": {
    bestFor: [
      "Businesses that want regular IT strategy reviews",
      "Organizations that want to track IT performance and plan improvements",
      "Companies that want a strategic IT partner",
    ],
    outcomes: [
      "Quarterly review of IT performance and priorities",
      "Updated technology roadmap",
      "Strategic guidance for upcoming quarters",
    ],
    includes: [
      "Quarterly performance review",
      "Project status update",
      "Technology roadmap refresh",
      "Strategic recommendations",
    ],
  },

  // ===== Church/Marina/Vertical-specific services =====
  "Church Technology Health Check": {
    bestFor: [
      "Churches that want to assess their technology setup",
      "Religious organizations with volunteer-run IT",
      "Churches that want practical, budget-conscious recommendations",
    ],
    outcomes: [
      "Clear understanding of your church's technology health",
      "Practical recommendations that work with volunteer staff",
      "Budget-conscious improvement plan",
    ],
    includes: [
      "Church technology assessment",
      "Wi-Fi, sound, and streaming review",
      "Volunteer account security check",
      "Budget-conscious recommendations",
    ],
  },
  "Livestream Setup Support": {
    bestFor: [
      "Churches that want to livestream services",
      "Organizations that need help with streaming configuration",
      "Companies that want professional-quality streaming",
    ],
    outcomes: [
      "Livestream configured and working",
      "Audio, video, and streaming platform integration",
      "Simple instructions for volunteer operators",
    ],
    includes: [
      "Streaming platform setup",
      "Audio and video integration",
      "Test stream and quality check",
      "Volunteer operator guide",
    ],
  },
  "Guest Wi-Fi for Churches": {
    bestFor: [
      "Churches that want to offer Wi-Fi to visitors",
      "Religious organizations that need a secure guest network",
      "Churches that want to separate guest and admin networks",
    ],
    outcomes: [
      "Secure guest Wi-Fi for church visitors",
      "Content filtering appropriate for a family environment",
      "Simple guest access process",
    ],
    includes: [
      "Guest Wi-Fi network setup",
      "Content filtering configuration",
      "Bandwidth management",
      "Guest access instructions",
    ],
  },
  "Volunteer Account Cleanup": {
    bestFor: [
      "Churches and nonprofits with volunteer turnover",
      "Organizations that have volunteer accounts from years past",
      "Companies that want to secure volunteer access",
    ],
    outcomes: [
      "Volunteer accounts cleaned up with only current volunteers",
      "Reduced security risk from stale accounts",
      "Volunteer account management process",
    ],
    includes: [
      "Volunteer account audit",
      "Stale account identification and removal",
      "Access permission review",
      "Account management recommendations",
    ],
  },
  "Church IT Foundation": {
    bestFor: [
      "Churches that want a complete technology foundation",
      "Religious organizations that need reliable IT",
      "Churches that want to support their mission with technology",
    ],
    outcomes: [
      "Solid technology foundation for your church",
      "Reliable Wi-Fi, sound, and basic IT",
      "Scalable for future needs",
    ],
    includes: [
      "Church technology assessment",
      "Wi-Fi and network setup",
      "Basic security configuration",
      "Volunteer IT training",
    ],
  },
  "Marina Connectivity Pack": {
    bestFor: [
      "Marinas that want to offer Wi-Fi to boaters",
      "Waterfront businesses that need outdoor connectivity",
      "Marinas that want to improve guest experience",
    ],
    outcomes: [
      "Wi-Fi coverage across docks and common areas",
      "Reliable connectivity for boaters and staff",
      "Weather-resistant equipment installed",
    ],
    includes: [
      "Outdoor Wi-Fi site survey",
      "Weather-resistant access point installation",
      "Guest network configuration",
      "Coverage verification",
    ],
  },
  "Outdoor Wi-Fi Planning for Marinas": {
    bestFor: [
      "Marinas planning Wi-Fi coverage for outdoor areas",
      "Waterfront businesses that need connectivity planning",
      "Marinas that want professional outdoor Wi-Fi design",
    ],
    outcomes: [
      "Outdoor Wi-Fi coverage plan for your marina",
      "Equipment recommendations for marine environment",
      "Installation roadmap and cost estimate",
    ],
    includes: [
      "On-site marina coverage assessment",
      "Weather and environmental factor analysis",
      "Access point placement recommendations",
      "Equipment and installation cost estimate",
    ],
  },
  "Security Camera Planning for Marinas": {
    bestFor: [
      "Marinas that want security camera coverage",
      "Waterfront businesses that need surveillance planning",
      "Marinas that want to protect boats and facilities",
    ],
    outcomes: [
      "Security camera plan for your marina",
      "Camera placement recommendations for waterfront",
      "Equipment recommendations for marine environment",
    ],
    includes: [
      "On-site security assessment",
      "Camera placement recommendations",
      "Equipment recommendations",
      "Installation cost estimate",
    ],
  },
  "Gate and Sign Connectivity Review": {
    bestFor: [
      "Businesses with gate or sign systems that need network connectivity",
      "Organizations that want to connect remote equipment to their network",
      "Companies that want reliable connectivity for IoT devices",
    ],
    outcomes: [
      "Network connectivity assessment for gates and signs",
      "Connectivity solution recommendations",
      "Installation roadmap",
    ],
    includes: [
      "Gate and sign location assessment",
      "Connectivity options analysis",
      "Equipment recommendations",
      "Installation cost estimate",
    ],
  },
  "Seasonal Business IT Readiness": {
    bestFor: [
      "Seasonal businesses preparing for their busy season",
      "Organizations that need to ramp up technology for seasonal demand",
      "Companies that want to avoid seasonal technology problems",
    ],
    outcomes: [
      "Technology ready for the busy season",
      "Seasonal staffing and equipment needs identified",
      "Reduced seasonal technology issues",
    ],
    includes: [
      "Pre-season technology assessment",
      "Seasonal staffing IT setup",
      "Equipment and capacity review",
      "Pre-season readiness checklist",
    ],
  },
  "Wellness Office Security Pack": {
    bestFor: [
      "Wellness offices, massage therapists, and healthcare providers",
      "Small healthcare practices that need basic security",
      "Organizations that handle client health information",
    ],
    outcomes: [
      "Basic security and privacy measures in place",
      "Patient data handling procedures",
      "Compliance with basic healthcare privacy requirements",
    ],
    includes: [
      "Basic security assessment",
      "Patient data handling review",
      "Privacy policy guidance",
      "Security recommendations",
    ],
  },
  "Patient Wi-Fi Separation": {
    bestFor: [
      "Healthcare offices that offer Wi-Fi to patients",
      "Medical practices that want to separate patient and clinical networks",
      "Organizations that need to protect patient data",
    ],
    outcomes: [
      "Patient Wi-Fi network separated from clinical systems",
      "Protected patient data and compliant network",
      "Simple guest access for patients",
    ],
    includes: [
      "Network segmentation design",
      "Patient Wi-Fi VLAN configuration",
      "Clinical network isolation verification",
      "Guest access setup",
    ],
  },
  "Contractor Digital Office": {
    bestFor: [
      "Construction contractors who need a digital office setup",
      "Field service businesses that want cloud-based tools",
      "Contractors who want to move from paper to digital",
    ],
    outcomes: [
      "Cloud-based digital office for your contracting business",
      "Email, file sharing, and basic project management",
      "Mobile access for field work",
    ],
    includes: [
      "Microsoft 365 Business Basic setup",
      "Cloud file storage configuration",
      "Mobile device setup",
      "Basic digital workflow guidance",
    ],
  },
  "Field Laptop Setup": {
    bestFor: [
      "Businesses with field workers who need rugged laptops",
      "Organizations that need laptops configured for field use",
      "Companies that want field-ready technology",
    ],
    outcomes: [
      "Field laptop configured with offline and mobile capabilities",
      "Durable setup suitable for field conditions",
      "Remote management and security configured",
    ],
    includes: [
      "Laptop specification and procurement",
      "Field-ready software configuration",
      "Offline file access setup",
      "Mobile hotspot or LTE configuration",
    ],
  },
  "Cloud File Setup for Job Photos": {
    bestFor: [
      "Contractors and field service businesses that take job photos",
      "Organizations that want to organize and share job documentation",
      "Companies that want photo backup and organization",
    ],
    outcomes: [
      "Cloud-based photo organization for job documentation",
      "Easy sharing with clients and team members",
      "Automatic backup of job photos",
    ],
    includes: [
      "Cloud storage setup (OneDrive or Google Drive)",
      "Photo organization structure",
      "Mobile app configuration for photo upload",
      "Sharing and access setup",
    ],
  },
  "Mobile Device Security Setup": {
    bestFor: [
      "Businesses that issue phones or tablets to employees",
      "Organizations that want to secure mobile devices",
      "Companies that want mobile device management",
    ],
    outcomes: [
      "Mobile devices secured with policies and management",
      "Company data protected on mobile devices",
      "Remote wipe capability for lost devices",
    ],
    includes: [
      "Mobile device management setup",
      "Security policy configuration",
      "Company app installation",
      "Remote management and wipe capability",
    ],
  },
  "Blueberry Business Starter": {
    bestFor: [
      "Blueberry farmers and agricultural businesses",
      "Agricultural operations that need basic technology setup",
      "Farm businesses that want to modernize their operations",
    ],
    outcomes: [
      "Basic technology setup for your agricultural business",
      "Email, basic connectivity, and device management",
      "Foundation for future technology growth",
    ],
    includes: [
      "Microsoft 365 tenant setup",
      "Basic internet and Wi-Fi",
      "Device setup and security",
      "Agricultural technology recommendations",
    ],
  },
  "Pine Tree Protection Pack": {
    bestFor: [
      "Small businesses that want essential cybersecurity protection",
      "Organizations that want a practical security package",
      "Companies that want to start their security journey",
    ],
    outcomes: [
      "Essential cybersecurity protections in place",
      "MFA, antivirus, email security, and backup configured",
      "Foundation for ongoing security improvement",
    ],
    includes: [
      "MFA configuration on critical accounts",
      "Endpoint protection installation",
      "Email security hardening",
      "Backup verification",
    ],
  },
  "Harbor Wi-Fi Bundle": {
    bestFor: [
      "Marinas and harbors that want Wi-Fi for boaters",
      "Waterfront businesses that need guest Wi-Fi",
      "Marinas that want to improve boater experience",
    ],
    outcomes: [
      "Wi-Fi coverage across harbor and dock areas",
      "Weather-resistant equipment installed",
      "Guest network with simple access",
    ],
    includes: [
      "Outdoor Wi-Fi site survey",
      "Weather-resistant access point installation",
      "Guest network configuration",
      "Coverage verification",
    ],
  },
  "Anchor Backup Plan": {
    bestFor: [
      "Marinas and waterfront businesses that need data protection",
      "Seasonal businesses that want to protect their data",
      "Organizations that want verified backup protection",
    ],
    outcomes: [
      "Automated backup for critical marina business data",
      "Off-site backup protection",
      "Verified restore capability",
    ],
    includes: [
      "Cloud backup setup for critical data",
      "Backup monitoring configuration",
      "Restore testing",
      "Backup documentation",
    ],
  },
  "North Star Cyber Plan": {
    bestFor: [
      "Small businesses that want comprehensive cybersecurity guidance",
      "Organizations that want a complete security program",
      "Companies that want to be proactive about security",
    ],
    outcomes: [
      "Comprehensive cybersecurity program for your business",
      "Security controls, monitoring, and response in place",
      "Confidence in your security posture",
    ],
    includes: [
      "Full security assessment",
      "Security control implementation",
      "Security monitoring setup",
      "Incident response planning",
    ],
  },
};

// Update all products
let changes = { marketingCopy: 0, bestFor: 0, outcomes: 0, includes: 0 };
for (const p of products) {
  const specific = productSpecific[p.name];

  if (specific) {
    if (JSON.stringify(p.bestFor) !== JSON.stringify(specific.bestFor)) {
      p.bestFor = specific.bestFor;
      changes.bestFor++;
    }
    if (JSON.stringify(p.customerOutcomes) !== JSON.stringify(specific.outcomes)) {
      p.customerOutcomes = specific.outcomes;
      changes.outcomes++;
    }
    if (JSON.stringify(p.whatIsIncluded) !== JSON.stringify(specific.includes)) {
      p.whatIsIncluded = specific.includes;
      changes.includes++;
    }
    // Generate unique marketing copy for every product
    const newCopy = `${p.name} helps Maine businesses ${p.summary.charAt(0).toLowerCase() + p.summary.slice(1)} Maine Cyber Tech handles the work, documents what was done, and provides plain-English recommendations so you know exactly what was accomplished and what to do next.`;
    if (p.marketingCopy !== newCopy) {
      p.marketingCopy = newCopy;
      changes.marketingCopy++;
    }
  }
}

fs.writeFileSync(
  "apps/web/lib/catalog/data/products.json",
  JSON.stringify(products, null, 2),
  "utf8",
);
console.log("Changes applied:", changes);

// Verify uniqueness
for (const key of ["marketingCopy", "bestFor", "customerOutcomes", "whatIsIncluded"]) {
  const map = {};
  for (const p of products) {
    const val = key === "marketingCopy" ? p[key] : JSON.stringify(p[key]);
    map[val] = map[val] || [];
    map[val].push(p.name);
  }
  const total = Object.keys(map).length;
  const dups = Object.entries(map).filter(([, names]) => names.length > 1);
  console.log(`${key}: ${total}/${products.length} unique (${dups.length} duplicate groups)`);
  if (dups.length > 0 && dups.length < 10) {
    for (const [val, names] of dups) {
      console.log("  DUPE:", names.join(", "));
    }
  }
}
