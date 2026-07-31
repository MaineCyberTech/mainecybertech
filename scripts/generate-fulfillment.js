const fs = require("fs");
const products = JSON.parse(fs.readFileSync("apps/web/lib/catalog/data/products.json", "utf8"));

// ============================================================
// Detailed runbook steps for each product
// ============================================================
const runbooks = {
  // ==================== QUICK FIXES ====================
  "Password Security Checkup": {
    triage: [
      "1. Confirm purchase scope: password security checkup for [business name] with [N] users",
      "2. Schedule 45-60 minute remote session with customer contact",
      "3. Request list of business accounts and platforms used (M365, Google, CRM, banking, etc.)",
      "4. Verify customer has admin access to M365 or Google Workspace before proceeding",
      "5. Create ticket with product ID, customer details, scope boundaries, and follow-up path",
    ],
    delivery: [
      "1. Start remote session and review current password practices with the contact person",
      "2. Audit M365 tenant: check password policy settings (Password expiration, lockout threshold, complexity requirements) via https://admin.microsoft.com -> Settings -> Org settings -> Security & Privacy",
      "3. Run HaveIBeenPwned domain scan at https://haveibeenpwned.com/DomainSearch using the business email domain to identify compromised accounts",
      "4. Review shared password practices: check for shared mailboxes, shared M365 accounts, or password spreadsheets",
      "5. Assess password manager readiness: check if any password manager is already in use, evaluate business needs against Bitwarden, 1Password, or Keeper",
      "6. Document all findings in a password security scorecard",
      "7. Present findings to customer and discuss recommended next steps",
    ],
    documentation: [
      "1. Create Password Security Report including: password policy settings review, compromised account scan results, shared account inventory, password manager readiness assessment, prioritized recommendations",
      "2. Include screenshots of M365 password policy settings and HaveIBeenPwned results",
      "3. Write plain-English summary: what was checked, what was found, what to do next",
      "4. Never store actual passwords, password hashes, or login credentials in documentation",
    ],
    qa: [
      "1. Verify all findings are documented and categorized by severity",
      "2. Confirm customer received the report and understands the recommendations",
      "3. Verify no passwords or credentials were stored in any documentation",
      "4. Check that follow-up recommendations include specific next steps with estimated effort",
    ],
    closeout: [
      "1. Send final Password Security Report via secure delivery method",
      "2. Recommend password manager rollout as next step if not already deployed",
      "3. Recommend MFA Setup Session if MFA is not fully enabled",
      "4. Recommend Cyber Insurance Readiness Package if customer is applying for insurance",
      "5. Close temporary access to customer systems and confirm revocation",
      "6. Add internal notes for future reference",
    ],
  },

  "MFA Setup Session": {
    triage: [
      "1. Confirm purchase scope: MFA setup session for [business name] identifying [N] critical accounts",
      "2. Schedule 60-minute remote session with customer contact who has admin access",
      "3. Request list of business-critical accounts and platforms (M365, Google, banking, payroll, CRM, etc.)",
      "4. Verify customer has admin privileges to enable MFA on identified platforms",
      "5. Create ticket with product ID, customer details, and list of target platforms",
    ],
    delivery: [
      "1. Start remote session and audit current MFA status across all identified platforms",
      "2. For M365: navigate to https://admin.microsoft.com -> Users -> Active Users -> Multi-factor authentication. Check each user's MFA status. Enable MFA for users who are ready",
      "3. For M365: configure Conditional Access policies at https://portal.azure.com -> Azure Active Directory -> Security -> Conditional Access. Create policy requiring MFA for all users",
      "4. For Google Workspace: navigate to https://admin.google.com -> Security -> 2-Step Verification. Enforce 2SV for all users",
      "5. For banking/payroll platforms: guide customer through enabling MFA in each platform's security settings",
      "6. Configure MFA methods: prefer authenticator app (Microsoft Authenticator, Google Authenticator, or Authy) over SMS where possible",
      "7. For each user: demonstrate the MFA enrollment process and provide step-by-step instructions",
      "8. Test MFA on at least one account per platform to verify it works correctly",
      "9. Document backup/recovery codes per platform and store in customer's secure location",
    ],
    documentation: [
      "1. Create MFA Setup Summary including: platforms reviewed, MFA status before/after, users enrolled, MFA methods configured, recovery code storage location",
      "2. Create user-facing MFA enrollment guide with screenshots for each platform",
      "3. Include instructions for what to do if phone is lost (recovery codes, backup methods)",
      "4. Never store MFA recovery codes, backup codes, or TOTP seeds in documentation",
    ],
    qa: [
      "1. Verify MFA is enabled and enforced on at least the most critical accounts",
      "2. Test MFA login on each platform to confirm it works",
      "3. Confirm customer has recovery codes stored in a safe location",
      "4. Verify no MFA recovery codes or secrets are stored in documentation",
    ],
    closeout: [
      "1. Send MFA Setup Summary and user enrollment guide",
      "2. Recommend Password Manager Rollout if customer doesn't have one",
      "3. Recommend Security Awareness Training for staff on phishing and MFA best practices",
      "4. Schedule follow-up in 30 days to verify MFA is still active and no issues arose",
      "5. Close remote access and confirm revocation",
    ],
  },

  "Phishing Readiness Mini Audit": {
    triage: [
      "1. Confirm purchase scope: phishing readiness mini audit for [business name] with [N] users",
      "2. Schedule 30-minute pre-audit call to understand current email security setup",
      "3. Request email domain name and list of all user email addresses for the audit",
      "4. Verify customer has admin access to email security platforms (M365 Exchange Admin, Google Admin, etc.)",
      "5. Create ticket with product ID, customer details, and audit scope",
    ],
    delivery: [
      "1. Review email security configuration: check SPF, DKIM, and DMARC records using https://mxtoolbox.com for the customer's domain",
      "2. Check M365 anti-phish policy: navigate to https://security.microsoft.com -> Policies & Rules -> Threat Policies -> Anti-phishing. Review impersonation protection and spoof intelligence settings",
      "3. Check M365 anti-spam policy: navigate to https://security.microsoft.com -> Policies & Rules -> Threat Policies -> Anti-spam. Review spam threshold and action settings",
      "4. If using a third-party email security gateway (Mimecast, Proofpoint, Barracuda), review its phishing protection settings",
      "5. Review mailbox rules: sample 3-5 user mailboxes and check for suspicious forwarding rules that could indicate compromise",
      "6. Conduct a basic phishing simulation: craft a safe test email (e.g., 'You have a voicemail') and send to a small test group via a controlled platform or manual send. Track how many click/reply",
      "7. Document findings: email security gaps, staff awareness level, and risk rating",
    ],
    documentation: [
      "1. Create Phishing Readiness Report including: email security configuration review, SPF/DKIM/DMARC status, anti-phishing policy settings, mailbox rule audit results, phishing simulation results (if conducted), prioritized recommendations",
      "2. Include screenshots of key security settings and any identified gaps",
      "3. Provide clear risk ratings: Critical, High, Medium, Low for each finding",
    ],
    qa: [
      "1. Verify all email security settings have been reviewed and documented",
      "2. Confirm phishing simulation was conducted safely with no real risk to the customer",
      "3. Verify recommendations are prioritized and actionable",
      "4. Check that no sensitive email content was exposed in documentation",
    ],
    closeout: [
      "1. Send Phishing Readiness Report to customer",
      "2. Recommend Security Awareness Training Setup as next step",
      "3. Recommend Email Security Hardening for any identified email configuration gaps",
      "4. Offer to conduct a full phishing simulation campaign as a follow-up service",
      "5. Close temporary access to email systems",
    ],
  },
};

// ============================================================
// Generate runbook for any product not in the manual map
// ============================================================
function generateRunbook(p) {
  const name = p.name;
  const cat = p.category;
  const summary = p.summary || "";
  const isCheck =
    name.includes("Check") ||
    name.includes("Snapshot") ||
    name.includes("Audit") ||
    name.includes("Assessment") ||
    name.includes("Review");
  const isSetup =
    name.includes("Setup") ||
    name.includes("Install") ||
    name.includes("Rollout") ||
    name.includes("Deployment") ||
    name.includes("Enforcement");
  const isCleanup = name.includes("Cleanup") || name.includes("Clean");
  const isBundle = name.includes("Bundle") || name.includes("Pack");
  const isPlan = cat === "Monthly IT Plans";
  const isEmergency = cat === "Emergency Support";
  const isPolicy = cat === "Compliance & Policies";
  const isTraining = name.includes("Training") || name.includes("Lunch") || name.includes("Learn");
  const isMigration = name.includes("Migration");
  const isProcurement =
    name.includes("Procurement") ||
    name.includes("Replacement") ||
    name.includes("Lifecycle") ||
    name.includes("Refresh");
  const isWebsite = cat === "Website & SEO";
  const isCamera = cat === "Security Cameras";
  const isNetwork = cat === "Wi-Fi & Networking";
  const isBackup = cat === "Backup & Recovery";
  const isM365 = cat === "Microsoft 365";
  const isCyber = cat === "Cybersecurity";

  // Determine tools and systems
  let tools = [];
  if (isM365 || name.includes("M365") || name.includes("Microsoft"))
    tools = [
      "M365 Admin Center (https://admin.microsoft.com)",
      "Azure AD (https://portal.azure.com)",
      "Exchange Admin Center (https://admin.exchange.microsoft.com)",
      "M365 Defender (https://security.microsoft.com)",
    ];
  else if (isNetwork)
    tools = [
      "UniFi Controller (https://unifi.ui.com)",
      "Wi-Fi analyzer (Ekahau or NetSpot)",
      "Cable tester",
      "Toner and probe",
      "Laptop with management access",
    ];
  else if (isCamera)
    tools = [
      "UniFi Protect or NVR web interface",
      "Mobile app (UniFi Protect or vendor app)",
      "Ladder and tools for camera mounting",
      "PoE tester",
      "Ethernet cabling tools",
    ];
  else if (isBackup)
    tools = [
      "Backup software console (Veeam, Acronis, or cloud backup portal)",
      "Test restore environment",
      "Backup monitoring dashboard",
    ];
  else if (isWebsite)
    tools = [
      "Google Search Console",
      "Google Analytics",
      "PageSpeed Insights (https://pagespeed.web.dev)",
      "GTmetrix",
      "SSL Labs (https://ssllabs.com/ssltest/)",
      "Screaming Frog SEO Spider",
    ];
  else if (isCyber)
    tools = [
      "Microsoft Defender for Business",
      "HaveIBeenPwned (https://haveibeenpwned.com)",
      "MXToolbox (https://mxtoolbox.com)",
      "Nessus or OpenVAS vulnerability scanner",
      "Microsoft Secure Score dashboard",
    ];
  else if (isPolicy)
    tools = ["Policy template library", "Word processor", "Customer current policy documents"];
  else if (isSetup)
    tools = [
      "Remote desktop tools (ScreenConnect, TeamViewer, or RMM)",
      "Software installation media",
      "Windows deployment tools",
      "Antivirus/EDR management console",
    ];
  else
    tools = [
      "Remote access tools",
      "Administrative access to customer systems",
      "Documentation templates",
    ];

  // Generate triage steps
  const triage = [
    `1. Confirm purchase scope: ${name} for [business name]. Verify customer expectations and boundaries`,
    `2. Schedule engagement with customer contact who has authority to make decisions`,
    `3. Verify customer has necessary admin access and credentials available before starting`,
    `4. Gather any existing documentation or configuration information from the customer`,
    `5. Create ticket with product ID, customer details, scope boundaries, and expected deliverables`,
  ];

  // Generate delivery steps
  const delivery = [];
  if (isCheck) {
    delivery.push(`1. Access customer systems per authorization using least privilege`);
    delivery.push(`2. Perform ${name} assessment: ${summary}`);
    if (tools.length > 0)
      delivery.push(`3. Use the following tools for assessment: ${tools.join(", ")}`);
    delivery.push(`4. Document all findings, configurations reviewed, and identified issues`);
    delivery.push(`5. Categorize findings by severity: Critical, High, Medium, Low`);
    delivery.push(`6. Prepare findings report with prioritized recommendations`);
  } else if (isSetup) {
    delivery.push(`1. Access customer systems and verify current state before making changes`);
    delivery.push(`2. Execute ${name} per scope: ${summary}`);
    if (tools.length > 0)
      delivery.push(`3. Use the following tools for implementation: ${tools.join(", ")}`);
    delivery.push(`4. Test all configurations and verify functionality`);
    delivery.push(`5. Document setup details, configuration notes, and any changes made`);
    delivery.push(`6. Verify customer can use the configured system before closing`);
  } else if (isCleanup) {
    delivery.push(`1. Audit current state and inventory all items within scope`);
    delivery.push(`2. Identify stale, unused, or unnecessary items for removal`);
    delivery.push(`3. Present cleanup candidates to customer for approval before making changes`);
    delivery.push(`4. Execute approved cleanup: remove or archive identified items`);
    delivery.push(`5. Verify environment after cleanup and document final state`);
  } else if (isMigration) {
    delivery.push(`1. Perform pre-migration audit of source environment`);
    delivery.push(`2. Create migration plan with timeline, dependencies, and rollback procedures`);
    delivery.push(`3. Execute migration in phases: start with test group, then full rollout`);
    delivery.push(`4. Verify data integrity and functionality after each migration phase`);
    delivery.push(`5. Document post-migration state and any issues encountered`);
  } else if (isBundle) {
    delivery.push(`1. Review all bundled components and plan delivery order based on dependencies`);
    delivery.push(`2. Execute each component in sequence: ${summary}`);
    delivery.push(`3. Verify each component works correctly before proceeding to the next`);
    delivery.push(`4. Test integration between components where applicable`);
    delivery.push(`5. Deliver consolidated documentation covering all bundled services`);
  } else if (isPlan) {
    delivery.push(`1. Review customer's current environment and service history`);
    delivery.push(`2. Execute recurring tasks per plan scope: ${summary}`);
    delivery.push(`3. Document all work performed and any issues found during the cycle`);
    delivery.push(`4. Respond to customer requests and issues per service level agreement`);
  } else if (isEmergency) {
    delivery.push(`1. Initiate immediate response: contact customer and assess the situation`);
    delivery.push(`2. Triage the incident: determine scope, severity, and impact`);
    delivery.push(
      `3. Contain or mitigate active damage: isolate affected systems, stop ongoing attacks`,
    );
    delivery.push(`4. Restore critical systems to operational status`);
    delivery.push(`5. Document root cause, actions taken, and remaining issues`);
  } else if (isPolicy) {
    delivery.push(`1. Review customer's current policies or lack thereof`);
    delivery.push(
      `2. Customize policy templates to match customer's business size, industry, and risks`,
    );
    delivery.push(`3. Present draft policies for customer review and feedback`);
    delivery.push(`4. Finalize policies based on customer input and deliver in editable format`);
  } else if (isTraining) {
    delivery.push(
      `1. Prepare training materials customized to customer's environment and workflows`,
    );
    delivery.push(`2. Schedule and conduct training session (onsite or virtual)`);
    delivery.push(`3. Facilitate Q&A and hands-on practice during the session`);
    delivery.push(`4. Provide take-home reference materials and recording if applicable`);
  } else if (isProcurement) {
    delivery.push(`1. Assess customer's needs: specifications, quantity, budget, timeline`);
    delivery.push(`2. Research options and obtain competitive quotes from vendors`);
    delivery.push(`3. Present recommendations with rationale and total cost analysis`);
    delivery.push(`4. Coordinate ordering, delivery, and receiving as requested`);
  } else {
    delivery.push(`1. Access customer systems per authorization using least privilege`);
    delivery.push(`2. Execute ${name} per scope: ${summary}`);
    delivery.push(`3. Document all findings, configurations, and changes made`);
    delivery.push(`4. Verify outcomes and test functionality`);
    delivery.push(`5. Prepare summary of work performed`);
  }

  // Generate documentation steps
  const documentation = [
    `1. Document all findings, configurations, changes, and decisions made during the service`,
    `2. Provide plain-English summary suitable for non-technical customer review`,
    `3. Include screenshots or evidence where appropriate for clarity`,
    `4. Document any issues discovered outside scope as separate observations with recommendations`,
    `5. Never store passwords, recovery codes, MFA seeds, API keys, private keys, or unredacted sensitive data`,
  ];

  // Generate QA steps
  const qa = [
    `1. Verify work matches purchased scope: ${name}`,
    `2. Confirm customer authorization was obtained for any changes made`,
    `3. Verify no secrets are retained in documentation`,
    `4. Verify deliverables are complete and ready for customer review`,
    `5. Flag follow-up work as optional, recommended, or urgent`,
  ];
  if (isCheck) qa.push("6. Verify findings are categorized and prioritized correctly");
  if (isSetup) qa.push("6. Verify all configured systems are functioning correctly");
  if (isCleanup) qa.push("6. Verify no unintended removals occurred");
  if (isMigration) qa.push("6. Verify all data was migrated successfully with no data loss");

  // Generate closeout steps
  const closeout = [
    `1. Send customer summary with deliverables, findings, and documentation`,
    `2. Attach or link all relevant reports, guides, and documentation`,
    `3. Recommend next-step services based on findings and customer needs`,
    `4. Close temporary access or remind customer to revoke it`,
    `5. Record internal notes for future reference and ticket closure`,
  ];
  if (isPlan || isBundle) closeout.push("6. Schedule follow-up review or next recurring cycle");
  if (isCheck) closeout.push("6. Schedule a follow-up to review implementation of recommendations");

  const workflow = [
    triage[0],
    triage[1],
    delivery[0],
    delivery[1],
    qa[0],
    qa[1],
    closeout[0],
    closeout[1],
  ].slice(0, 7);

  return { workflow, triage, delivery, documentation, qa, closeout };
}

// ============================================================
// Apply to all products
// ============================================================
let changed = 0;
for (const p of products) {
  const runbook = runbooks[p.name];
  if (runbook) {
    // Manual detailed runbook exists
    if (
      JSON.stringify(p.fulfillmentWorkflow) !==
      JSON.stringify(
        runbook.triage
          .slice(0, 2)
          .concat(
            runbook.delivery.slice(0, 2),
            runbook.qa.slice(0, 1),
            runbook.closeout.slice(0, 2),
          ),
      )
    ) {
      p.fulfillmentWorkflow = runbook.triage
        .slice(0, 2)
        .concat(runbook.delivery.slice(0, 2), runbook.qa.slice(0, 1), runbook.closeout.slice(0, 2));
      changed++;
    }
    p.internalProcedure = {
      triage: runbook.triage,
      delivery: runbook.delivery,
      documentation: runbook.documentation,
      qa: runbook.qa,
      closeout: runbook.closeout,
    };
    changed++;
  } else {
    // Generate runbook
    const gen = generateRunbook(p);
    // Check if anything changed
    const oldW = JSON.stringify(p.fulfillmentWorkflow);
    const newW = JSON.stringify(gen.workflow);
    const oldP = JSON.stringify(p.internalProcedure);
    const newP = JSON.stringify(gen);
    if (oldW !== newW) {
      p.fulfillmentWorkflow = gen.workflow;
      changed++;
    }
    if (oldP !== newP) {
      p.internalProcedure = {
        triage: gen.triage,
        delivery: gen.delivery,
        documentation: gen.documentation,
        qa: gen.qa,
        closeout: gen.closeout,
      };
      changed++;
    }
  }
}

fs.writeFileSync(
  "apps/web/lib/catalog/data/products.json",
  JSON.stringify(products, null, 2),
  "utf8",
);

// ============================================================
// Verify uniqueness
// ============================================================
const wf = {},
  ip = {};
for (const p of products) {
  const wk = JSON.stringify(p.fulfillmentWorkflow);
  wf[wk] = wf[wk] || [];
  wf[wk].push(p.name);
  const ik = JSON.stringify(p.internalProcedure);
  ip[ik] = ip[ik] || [];
  ip[ik].push(p.name);
}
const wfDups = Object.entries(wf).filter(([, n]) => n.length > 1);
const ipDups = Object.entries(ip).filter(([, n]) => n.length > 1);
console.log("Fields changed:", changed);
console.log(
  "fulfillmentWorkflow:",
  Object.keys(wf).length + "/" + products.length + " unique (" + wfDups.length + " dup groups)",
);
console.log(
  "internalProcedure:",
  Object.keys(ip).length + "/" + products.length + " unique (" + ipDups.length + " dup groups)",
);
if (wfDups.length > 0) {
  console.log("Workflow dup groups:");
  for (const [k, names] of wfDups.slice(0, 5)) {
    console.log("  " + names.join(", "));
  }
}
if (ipDups.length > 0) {
  console.log("Procedure dup groups:");
  for (const [k, names] of ipDups.slice(0, 5)) {
    console.log("  " + names.join(", "));
  }
}

// Show a sample of detailed content
console.log("\n=== Sample: Password Security Checkup ===");
const p = products.find((x) => x.name === "Password Security Checkup");
console.log("Triage:", p.internalProcedure.triage.length, "steps");
p.internalProcedure.triage.forEach((s) => console.log("  " + s));
console.log("Delivery:", p.internalProcedure.delivery.length, "steps");
p.internalProcedure.delivery.forEach((s) => console.log("  " + s));
