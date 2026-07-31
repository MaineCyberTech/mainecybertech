const fs = require("fs");
const products = JSON.parse(fs.readFileSync("apps/web/lib/catalog/data/products.json", "utf8"));

// Custom procedure overrides for products that are too similar
const customProcedures = {
  "Admin Account Cleanup":
    "Audit all administrative accounts across M365, local systems, and cloud platforms. Identify stale accounts, shared credentials, and excessive privileges. Present removal recommendations for customer approval before making changes.",
  "PC Tune-Up / Cleanup":
    "Remotely access workstation, audit disk usage, startup programs, and running services. Remove temporary files, disable unnecessary startup items, update software. Benchmark performance before and after.",
  "Microsoft 365 Tenant Cleanup":
    "Audit M365 tenant for stale users, unlicensed mailboxes, orphaned groups, and inactive shared mailboxes. Present inventory and cleanup recommendations. Execute approved removals and document final state.",
  "Shared Mailbox Cleanup":
    "Inventory all shared mailboxes in the tenant. Identify stale or unused mailboxes by checking last activity and size. Recommend retention or removal. Clean up permissions and document ownership.",
  "Teams Cleanup Mini Project":
    "Audit all Teams channels, memberships, and permissions. Identify inactive teams, orphaned channels, and excessive permissions. Archive or remove stale items. Standardize naming conventions.",
  "Patch Panel Cleanup":
    "Visit customer site and trace all patch panel cables using a toner and probe. Label each cable with source and destination. Dress cables for organization. Document final patch panel layout.",
  "UniFi Network Cleanup":
    "Audit UniFi controller for device inventory, SSIDs, network settings, and firmware versions. Standardize device naming, remove unused SSIDs, update firmware, and document final configuration.",
  "NVR Cleanup":
    "Audit NVR storage capacity, recording schedules, retention settings, and camera assignments. Optimize recording settings for storage efficiency. Configure retention policies and document capacity planning.",
  "DNS Cleanup":
    "Export all DNS records for the domain. Review each record for relevance and accuracy. Identify stale A, CNAME, MX, and TXT records. Remove obsolete records and document final DNS configuration.",
  "Volunteer Account Cleanup":
    "Audit user accounts identifying volunteer vs staff status. Cross-reference with current volunteer roster. Disable or remove accounts for volunteers no longer active. Document account management process.",

  "Security Awareness Lunch & Learn":
    "Prepare 45-60 minute interactive presentation with real-world phishing examples and security scenarios. Schedule session at customer location or via video conference. Deliver training with Q&A. Provide take-home reference cards.",
  "Owner/Admin Security Training":
    "Prepare executive-level briefing covering business risk, liability, security investment prioritization, and vendor management. Schedule 60-90 minute session. Deliver with focus on business impact rather than technical details.",
  "Microsoft 365 Basics Training":
    "Prepare 60-minute hands-on training covering Outlook email and calendar, Teams chat and meetings, and OneDrive file access. Customize examples to customer's actual workflows. Deliver live session with practice exercises.",
  "Teams and SharePoint Training":
    "Prepare 90-minute training covering Teams channels, chats, file sharing, meetings, and SharePoint document libraries. Customize to customer's existing Teams structure. Deliver with hands-on practice and Q&A.",

  "Cyber Insurance Questionnaire Help":
    "Review customer's cyber insurance application. Map current security controls to each question. Identify gaps where answers need improvement. Provide guidance on accurate and favorable responses. Document recommendations for addressing identified gaps.",
  "Acceptable Use Policy Starter":
    "Review customer's business context, industry, and employee technology usage patterns. Customize AUP template with appropriate rules for internet, email, devices, and social media. Present draft for feedback. Deliver final editable document.",
  "Password Policy Starter":
    "Assess customer's current password practices and any insurance requirements. Customize password policy template with complexity, length, rotation, and MFA requirements aligned to their risk profile. Deliver final editable document.",
  "Data Backup Policy Starter":
    "Review customer's current backup infrastructure and data criticality. Customize backup policy template with retention schedules, restore testing requirements, and off-site storage policies. Deliver final editable document.",
  "Incident Response Policy Starter":
    "Review customer's business size, industry, and risk profile. Customize IR policy template with incident classification, escalation procedures, notification requirements, and post-incident review process. Deliver final editable document.",
  "Vendor Access Policy Starter":
    "Review customer's third-party vendor relationships and access requirements. Customize vendor access policy template with onboarding, review, termination, and security requirements. Deliver final editable document.",
  "Employee Offboarding Checklist":
    "Review customer's current offboarding process and identify gaps. Create customized checklist covering account removal, data preservation, device recovery, and access audit. Deliver final checklist and implementation guidance.",
  "Asset Inventory Starter":
    "Conduct on-site or remote asset discovery across workstations, servers, network equipment, and peripherals. Document make, model, serial number, warranty, and assignment. Provide inventory in organized format with management recommendations.",
  "Security Awareness Policy Starter":
    "Review customer's training requirements and any compliance obligations. Customize security awareness policy with training frequency, content requirements, and phishing simulation guidelines. Deliver final editable document.",
  "Remote Work Policy Starter":
    "Review customer's remote work arrangements and security concerns. Customize remote work policy covering device requirements, connection security, data protection, and incident reporting. Deliver final editable document.",
  "Risk Register Starter":
    "Facilitate risk assessment workshop with customer stakeholders. Identify technology risks, score by likelihood and impact, document existing controls, and recommend treatment plans. Deliver risk register in editable format.",
  "Quarterly Access Review":
    "Review user access across M365, line-of-business applications, and critical systems. Identify excessive permissions, stale accounts, and inappropriate access. Present findings with removal recommendations. Document review for audit trail.",
  "Data Handling Checklist":
    "Map customer's data flows — collection, storage, processing, sharing, and disposal. Create data classification guidelines. Document handling procedures for each data type. Provide staff training guidance.",
  "PCI/Payment Handling Readiness Review":
    "Review customer's payment processing flow — card entry, transmission, storage, and disposal. Assess against PCI DSS requirements. Identify gaps and document remediation recommendations with estimated effort.",
  "HIPAA-Oriented IT Readiness Review":
    "Review customer's IT environment against HIPAA Security Rule requirements — administrative, physical, and technical safeguards. Identify compliance gaps and document remediation recommendations.",
  "CMMC/NIST Starter Gap Review":
    "Review customer's security controls against applicable CMMC level or NIST SP 800-171 requirements. Identify compliance gaps and document remediation roadmap with priority levels.",
};

const productDetails = {
  "Backup Restore Test":
    "Access backup system and select representative files or systems for test restore. Execute restore to isolated location. Verify file integrity and data completeness. Measure restore time and document procedure.",
  "M365 Launch Bundle":
    "Coordinate tenant setup, domain verification, user creation, basic migration from previous platform, and staff training session. Deliver as a coordinated project with single point of contact.",
  "M365 Secure Bundle":
    "Implement security baseline configuration, MFA enforcement, Conditional Access policies, and threat protection. Build on top of M365 Launch Bundle components. Verify all security controls are working.",
  "M365 Cleanup Bundle":
    "Execute full tenant audit, license optimization, shared mailbox and Teams cleanup, and permission structure documentation. Deliver as coordinated project.",
  "M365 Managed Bundle":
    "Provide ongoing monthly admin tasks, quarterly security reviews, help desk support, and strategic guidance. Build on top of cleaned and organized tenant from Cleanup Bundle.",
  "Workstation Refresh Pack":
    "Coordinate hardware procurement, setup, data transfer from old devices, and old device wipe. Deliver as coordinated project with schedule aligned to minimize business disruption.",
  "Network Documentation Package":
    "Audit network infrastructure, create topology diagram, document equipment inventory with model/serial/warranty, document IP scheme and VLANs. Deliver complete documentation package in digital format.",
  "Small Office Wi-Fi Bundle":
    "Provide access point hardware, install and configure, set up guest network, verify coverage. Deliver as coordinated installation project with testing.",
  "Outdoor Coverage Bundle":
    "Install weather-rated outdoor access points, configure for outdoor coverage, integrate with indoor network, verify coverage in target areas. Use appropriate outdoor-rated cabling and enclosures.",
  "Camera and Wi-Fi Bundle":
    "Install Wi-Fi access points and camera system together. Configure PoE switch for both. Ensure network has sufficient bandwidth for camera traffic. Verify both systems working.",
  "Camera Signage Package":
    "Provide and install professional security camera warning signs at entry points and visible locations. Install required privacy notices if applicable. Document sign locations with photos.",
  "Camera Starter Bundle":
    "Install 2-4 cameras with NVR, configure motion detection and recording schedules, set up remote access via mobile app. Verify all cameras are recording and accessible remotely.",
  "Camera Business Bundle":
    "Install 4-8 cameras with analytics-capable NVR, configure smart motion detection and alerts, set up remote access and notification rules. Build on starter bundle components.",
  "Camera Complete Bundle":
    "Install 8+ cameras with enterprise NVR or server-based system, configure AI-powered analytics and advanced detection rules, set up comprehensive remote access and maintenance schedule. Build on business bundle.",
  "Backup Starter Bundle":
    "Configure cloud backup for critical data, set up computer backup for workstations, enable basic monitoring, and perform initial restore test. Deliver as coordinated package.",
  "Backup Business Bundle":
    "Configure server and workstation backup, add cloud data backup for M365, enable monitoring and alerting, and perform quarterly restore testing. Build on starter bundle.",
  "Backup Resilience Bundle":
    "Implement full backup solution for servers, workstations, and cloud data. Develop disaster recovery plan and business continuity procedures. Perform quarterly restore testing and plan reviews. Build on business bundle.",
  "Small Business Resilience Pack":
    "Combine cloud backup, DR planning, business continuity preparation, and quarterly reviews into comprehensive package. Ensure all components are integrated and tested.",
  "Local Service Page Pack":
    "Research local keywords for each target location. Create unique content for each location page. Implement local business schema markup. Build internal linking structure between pages.",
  "Blog Starter Pack":
    "Set up blog platform on customer's website, design blog layout, create SEO-optimized structure, develop content strategy, and write 3 starter posts. Deliver with editorial calendar.",
  "Technical SEO Fix Pack":
    "Run technical SEO audit using industry tools. Identify crawl errors, broken links, page speed issues, duplicate content, and schema problems. Fix all identified issues. Verify fixes with follow-up scan.",
  "Website Safety Bundle":
    "Configure website backup, enable security monitoring, verify SSL/TLS configuration, and set up monthly security scans. Deliver as coordinated security package.",
  "Website Growth Bundle":
    "Execute technical SEO fixes, develop content strategy, configure analytics with goals, and provide monthly performance reviews. Build on website safety bundle foundation.",
  "Domain Protection Pack":
    "Audit all domains, enable auto-renewal, configure domain locks and transfer protection, set up expiration monitoring alerts. Document complete domain portfolio with renewal dates.",
  "Cyber Insurance Readiness Bundle":
    "Assist with insurance questionnaire, create required policy documents (AUP, password, backup, incident response), perform security gap assessment, and provide remediation recommendations. Coordinate all components.",
  "Small Business Policy Pack":
    "Customize acceptable use, password, data backup, and incident response policy templates for customer's business. Deliver all four policies as coordinated document set with implementation guidance.",
  "Compliance Foundation Bundle":
    "Create policy documents, conduct asset inventory, establish access review process, and perform compliance gap assessment. Coordinate all components into a comprehensive foundation.",
  "Small Business IT Starter Pack":
    "Set up M365 tenant for up to 5 users, configure basic security settings, apply workstation security baseline, and perform backup readiness check. Coordinate all components as a single project.",
  "Business Owner Peace of Mind Pack":
    "Execute full security assessment, verify backup systems, perform network health check, and provide 30 days of priority support. Coordinate all diagnostics into a single health report.",
  "Local Business Online Presence Pack":
    "Perform website health check, optimize Google Business Profile, set up local SEO foundation, and configure review request system. Coordinate all online presence improvements.",
  "New Employee Setup Bundle":
    "Provision computer or coordinate procurement, create M365 accounts with appropriate licenses, install required software, apply security baseline. Deliver configured workstation to customer.",
  "Employee Exit Lockdown Bundle":
    "Remove all account access, forward email and preserve mailbox, transfer OneDrive files, recover company devices, wipe personal data. Document complete offboarding for audit trail.",
  "Vendor Transition Package":
    "Review current vendor documentation and contracts, inventory all systems and access, transfer administrative access to new provider, coordinate transition timeline. Document final state.",
  "Marina Connectivity Pack":
    "Perform outdoor Wi-Fi site survey of marina property. Install weather-resistant access points at dock and common areas. Configure guest network with captive portal. Verify coverage at all target locations.",
  "Wellness Office Security Pack":
    "Perform basic security assessment focused on patient data handling. Review privacy policies and procedures. Provide recommendations for HIPAA-oriented security improvements.",
  "Pine Tree Protection Pack":
    "Configure MFA on critical business accounts, install endpoint protection on workstations, harden email security settings with SPF/DKIM/DMARC, and verify backup configuration. Deliver as essential security bundle.",
  "Harbor Wi-Fi Bundle":
    "Perform harbor Wi-Fi coverage assessment. Install weather-resistant equipment at optimal locations. Configure guest network with simple access for boaters. Verify coverage at all slip locations.",
  "New Business Technology Setup":
    "Set up M365 tenant, coordinate business internet installation, configure workstations with security baseline, and create basic website or landing page. Coordinate all components.",
  "New Business IT Setup":
    "Set up M365 tenant, install business internet and Wi-Fi, procure and configure workstations, apply basic security configuration. Coordinate as complete IT infrastructure project.",
  "New Client Foundation":
    "Perform full technology assessment, security baseline review, and backup verification as part of managed services onboarding. Document current state and immediate action items.",
  "IT Documentation Rebuild":
    "Audit current network infrastructure, systems, accounts, and procedures. Create network topology diagrams, system inventory, password documentation, and procedure guides. Deliver complete documentation package.",
  "Asset Inventory Buildout":
    "Conduct on-site asset discovery across all technology categories. Build asset database with make, model, serial, warranty, and assignment. Provide management recommendations for lifecycle tracking.",
  "IT Roadmap Session":
    "Facilitate strategy session with customer stakeholders. Review current state, business goals, and technology needs. Create 12-24 month technology roadmap with prioritized initiatives and budget estimates.",
  "Quarterly Business Review":
    "Review IT performance metrics, project status, support trends, and technology roadmap. Provide strategic recommendations for next quarter. Update roadmap based on changing business needs.",
  "Office Move IT Planning":
    "Conduct site survey of new location. Design network infrastructure layout. Coordinate internet service installation. Plan move-day activities for minimal disruption. Provide support during transition.",
  "Church IT Foundation":
    "Assess church technology needs. Install or upgrade Wi-Fi network. Configure basic security. Train volunteer IT staff on basic maintenance and troubleshooting.",
  "Guest Wi-Fi for Churches":
    "Configure separate guest Wi-Fi network isolated from church administrative systems. Apply content filtering appropriate for family environment. Provide simple access instructions for visitors.",
  "Church Technology Health Check":
    "Assess church technology across Wi-Fi, sound system, livestreaming, volunteer accounts, and security. Provide practical, budget-conscious recommendations prioritized by impact.",
  "Livestream Setup Support":
    "Configure livestream platform (YouTube, Facebook, or Vimeo). Integrate audio from sound system and video from cameras. Test stream quality. Provide simple instructions for volunteer operators.",
  "Seasonal Business IT Readiness":
    "Review seasonal staffing plans, equipment needs, and technology capacity. Prepare systems for increased demand. Create pre-season readiness checklist. Implement any needed changes.",
  "Contractor Digital Office":
    "Set up M365 Business Basic with custom domain. Configure cloud file storage with job folder structure. Set up mobile devices for field access. Provide basic workflow guidance for digital operations.",
  "Field Laptop Setup":
    "Configure laptop with offline file access, mobile hotspot or LTE connectivity, VPN or remote access, and security baseline. Install field-specific software. Test all connectivity and access.",
  "Cloud File Setup for Job Photos":
    "Configure cloud storage (OneDrive or Google Drive) with organized folder structure for job sites. Install and configure mobile app on field devices. Set up automatic photo backup. Test sharing with clients.",
  "Mobile Device Security Setup":
    "Configure MDM or mobile device policies. Enforce passcode, encryption, and remote wipe. Install required business apps. Test remote management capabilities. Document procedures for lost devices.",
  "Blueberry Business Starter":
    "Set up M365 tenant for agricultural business. Configure basic internet and Wi-Fi at farm office. Set up work device with security baseline. Provide recommendations for agricultural technology tools.",
  "Anchor Backup Plan":
    "Configure cloud backup for marina business critical data. Set up automated backup monitoring. Perform initial restore test. Document backup configuration and recovery procedures.",
  "North Star Cyber Plan":
    "Execute full security assessment. Implement priority security controls based on findings. Set up security monitoring. Develop incident response plan. Provide comprehensive security program documentation.",
  "Laptop Procurement":
    "Research laptop models matching customer's performance, durability, and budget requirements. Obtain competitive quotes from vendors. Recommend top options with rationale. Coordinate ordering and delivery.",
  "Desktop Procurement":
    "Research desktop models matching customer's performance, reliability, and budget requirements. Obtain competitive quotes. Recommend best options. Coordinate ordering and delivery.",
  "Printer Procurement Help":
    "Assess customer's printing volume, quality needs, and budget. Research reliable business printer models. Provide recommendation with total cost of ownership analysis including supplies.",
};

// Apply custom delivery steps to make each product unique
let changed = 0;
for (const p of products) {
  const custom = customProcedures[p.name];
  const details = productDetails[p.name];

  if (custom) {
    // Replace the first delivery step with custom text
    p.internalProcedure.delivery[0] = custom;
    changed++;
  }

  if (details) {
    // Replace the second delivery step with detailed scope
    if (p.internalProcedure.delivery.length > 1) {
      p.internalProcedure.delivery[1] = details;
      changed++;
    }
  }
}

// Also add specific details to the QA step for every product
for (const p of products) {
  const name = p.name.toLowerCase();
  if (name.includes("password")) {
    p.internalProcedure.qa.push("Verify no passwords or credentials are retained in documentation");
  }
  if (name.includes("backup")) {
    p.internalProcedure.qa.push("Verify restore test was successful and documented");
  }
  if (name.includes("camera")) {
    p.internalProcedure.qa.push("Verify all cameras are recording and accessible remotely");
  }
  if (name.includes("wifi") || name.includes("wi-fi") || name.includes("network")) {
    p.internalProcedure.qa.push(
      "Verify network connectivity and coverage meets scope requirements",
    );
  }
  if (name.includes("migration")) {
    p.internalProcedure.qa.push("Verify all data was migrated successfully with no data loss");
  }
  if (name.includes("cleanup") || name.includes("clean")) {
    p.internalProcedure.qa.push(
      "Verify no unintended removals occurred and all changes are reversible",
    );
  }
  if (name.includes("training") || name.includes("lunch")) {
    p.internalProcedure.qa.push(
      "Verify training materials were well-received and Q&A addressed all questions",
    );
  }
  if (
    name.includes("assessment") ||
    name.includes("audit") ||
    name.includes("review") ||
    name.includes("check")
  ) {
    p.internalProcedure.qa.push("Verify findings report is complete and prioritized");
  }
  if (name.includes("setup") || name.includes("install") || name.includes("rollout")) {
    p.internalProcedure.qa.push("Verify all configured systems are functioning correctly");
  }
  changed++;
}

fs.writeFileSync(
  "apps/web/lib/catalog/data/products.json",
  JSON.stringify(products, null, 2),
  "utf8",
);
console.log("Total changes:", changed);

// Verify uniqueness
for (const key of ["fulfillmentWorkflow", "internalProcedure"]) {
  const map = {};
  for (const p of products) {
    const val = JSON.stringify(p[key]);
    map[val] = map[val] || [];
    map[val].push(p.name);
  }
  const dups = Object.entries(map).filter(([, n]) => n.length > 1);
  console.log(
    key + ":",
    Object.keys(map).length + "/" + products.length + " unique (" + dups.length + " dup groups)",
  );
  if (dups.length > 0) {
    for (const [k, names] of dups.slice(0, 5)) {
      console.log("  " + names.join(", "));
    }
  }
}
