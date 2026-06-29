import { askCopilot } from "@/services/ai/openai.service";
import { requireAccess } from "@/services/users/access.service";

function value(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function values(form: FormData, key: string) {
  return form.getAll(key).map(String).filter(Boolean);
}

function fallbackScopeDocument(data: Record<string, string | string[]>) {
  return `# Atomix Pre-Review Scope Document

## 1. Review Identity
- Project Name: ${data.projectName || "TBD"}
- Application Name: ${data.applicationName || "TBD"}
- Business Owner: ${data.businessOwner || "TBD"}
- SPR: ${data.spr || "TBD"}
- SR: ${data.sr || "TBD"}
- Charge Code: ${data.chargeCode || "TBD"}
- Testing URL: ${data.targetUrl || "TBD"}
- IP Address: ${data.ipAddress || "TBD"}

## 2. Scope and Review Details
- Scope: ${data.scope || "TBD"}
- Review Type: ${data.typeOfReview || "TBD"}
- Application Type: ${data.typeOfApplication || "TBD"}
- BEAD Required: ${data.beadRequired || "TBD"}
- LLM FEAD Required: ${data.llmReviewRequired || "TBD"}
- Previous Security Review Attached: ${data.previousReportAttached || "TBD"}
- Tenant Type: ${data.tenantType || "TBD"}
- Public/Internal: ${data.publicInternal || "TBD"}
- Internet Exposed: ${data.internetExposed || "TBD"}
- APIs Available: ${data.apisAvailable || "TBD"}
- LLM/AI Usage: ${data.llmUsage || "TBD"}
- External Integrations: ${data.externalIntegrations || "TBD"}

## 3. Risk Profile
- Overall Risk: ${data.overallRisk || "TBD"}
- GRC Risk Profile: ${data.grcRiskProfile || "TBD"}
- Agent-Suggested Risk Profile: ${data.agentSuggestedRiskProfile || "TBD"}
- CIA: C=${data.confidentiality || "TBD"}, I=${data.integrity || "TBD"}, A=${data.availability || "TBD"}
- AV: ${data.network || "TBD"}
- Au: ${data.authentication || "TBD"}
- Data Classification: ${data.dataClassification || "TBD"}
- Confidential / sensitive data processed: ${data.sensitiveData || "TBD"}

## 4. In-Scope Scan Reports
${Array.isArray(data.scanReports) && data.scanReports.length > 0 ? data.scanReports.map((scan) => `- ${scan}`).join("\n") : "- TBD / Not in scope"}

## 5. Application Features to Confirm
- File upload: ${data.fileUpload || "TBD"}
- Forms-based email functions: ${data.emailFunctions || "TBD"}
- View-state / client-side state: ${data.viewState || "TBD"}
- Challenge-response / CAPTCHA / OTP: ${data.challengeResponse || "TBD"}
- Session management token or cookie: ${data.sessionManagement || "TBD"}
- JWT / token algorithm notes: ${data.tokenDetails || "TBD"}

## 6. Technical Stack
- Database: ${data.database || "TBD"}
- Application Server: ${data.appServer || "TBD"}
- Operating System: ${data.operatingSystem || "TBD"}
- API Style: ${data.apiStyle || "TBD"}
- Authentication Mechanism: ${data.authMechanism || "TBD"}
- Cloud Services: ${data.cloudServices || "TBD"}
- AD / SSO integrated: ${data.identityIntegration || "TBD"}

## 7. Roles and Access
- RBAC Roles: ${data.roles || "TBD"}
- Multi-tenant: ${data.multiTenant || "TBD"}
- Test Credentials Required: ${data.credentials || "TBD"}

## 8. Environment and Access Notes
- Environment readiness: ${data.environmentReadiness || "TBD"}
- Host information / machine name: ${data.hostDetails || "TBD"}
- Information architecture notes: ${data.architectureNotes || "TBD"}

## 9. Open Questions Before Review Start
- Confirm whether scan reports are complete and current.
- Confirm whether BEAD, LLM FEAD, and API controls are in scope.
- Confirm whether sensitive data is necessary for application processing.
- Confirm whether all RBAC roles and test accounts are available.
- Confirm any exceptions before test start.

## 10. Demo Call Notes
${data.demoNotes || "No demo call notes provided."}
`;
}

export async function POST(req: Request) {
  try {
    await requireAccess([
      "ADMIN",
      "GOVERNANCE_TEAM",
      "VALIDATOR",
      "PROJECT_MANAGER",
      "CONSULTANT",
    ]);

    const form = await req.formData();
    const data = {
      projectName: value(form, "projectName"),
      applicationName: value(form, "applicationName"),
      businessOwner: value(form, "businessOwner"),
      numberOfRoles: value(form, "numberOfRoles"),
      spr: value(form, "spr"),
      sr: value(form, "sr"),
      chargeCode: value(form, "chargeCode"),
      targetUrl: value(form, "targetUrl"),
      ipAddress: value(form, "ipAddress"),
      scope: value(form, "scope"),
      typeOfReview: value(form, "typeOfReview"),
      typeOfApplication: value(form, "typeOfApplication"),
      beadRequired: value(form, "beadRequired"),
      llmReviewRequired: value(form, "llmReviewRequired"),
      previousReportAttached: value(form, "previousReportAttached"),
      tenantType: value(form, "tenantType"),
      dataClassification: value(form, "dataClassification"),
      publicInternal: value(form, "publicInternal"),
      internetExposed: value(form, "internetExposed"),
      apisAvailable: value(form, "apisAvailable"),
      llmUsage: value(form, "llmUsage"),
      externalIntegrations: value(form, "externalIntegrations"),
      grcRiskProfile: value(form, "grcRiskProfile"),
      agentSuggestedRiskProfile: value(form, "agentSuggestedRiskProfile"),
      overallRisk: value(form, "overallRisk"),
      confidentiality: value(form, "confidentiality"),
      integrity: value(form, "integrity"),
      availability: value(form, "availability"),
      network: value(form, "network"),
      authentication: value(form, "authentication"),
      sensitiveData: value(form, "sensitiveData"),
      scanReports: values(form, "scanReports"),
      fileUpload: value(form, "fileUpload"),
      emailFunctions: value(form, "emailFunctions"),
      viewState: value(form, "viewState"),
      challengeResponse: value(form, "challengeResponse"),
      sessionManagement: value(form, "sessionManagement"),
      tokenDetails: value(form, "tokenDetails"),
      database: value(form, "database"),
      appServer: value(form, "appServer"),
      operatingSystem: value(form, "operatingSystem"),
      apiStyle: value(form, "apiStyle"),
      authMechanism: value(form, "authMechanism"),
      cloudServices: value(form, "cloudServices"),
      identityIntegration: value(form, "identityIntegration"),
      roles: value(form, "roles"),
      multiTenant: value(form, "multiTenant"),
      credentials: value(form, "credentials"),
      environmentReadiness: value(form, "environmentReadiness"),
      hostDetails: value(form, "hostDetails"),
      architectureNotes: value(form, "architectureNotes"),
      demoNotes: value(form, "demoNotes"),
    };

    const prompt = `
Act as the Atomix Scope Call Agent for an information security review.

Using the demo-call facts below, generate a final pre-review scope document that a PM/reviewer can share before the review starts.

The document must include:
1. Review identity and target details.
2. Scope and review type.
3. Risk profile with Overall Risk, CIA, AV, and Au.
4. GRC risk profile vs Demo Call Agent suggested risk profile.
5. Required artifacts and scan reports.
6. Application features to verify during review.
7. Technical stack.
8. Roles, access, credentials, and RBAC notes.
9. Tenant, API, LLM/AI, internet exposure, and integration impacts.
10. FEAD controls that should be NA with reusable comments.
11. Review prerequisites, assumptions, open questions, and out-of-scope items.
12. Final reviewer checklist.

Facts:
${JSON.stringify(data, null, 2)}
`;

    let document = "";
    let mode = "local-ai";

    try {
      document = await askCopilot(
        prompt,
        "Atomix pre-review scoping workflow and demo-call notes.",
      );
    } catch {
      mode = "deterministic-fallback";
      document = fallbackScopeDocument(data);
    }

    return Response.json({
      ok: true,
      mode,
      document,
      data,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Scope document generation failed",
      },
      {
        status: 400,
      },
    );
  }
}
