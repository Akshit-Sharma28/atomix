import { askCopilot } from "@/services/ai/openai.service";
import { requireAccess } from "@/services/users/access.service";
import {
  controlsForScope,
  peerReviewControls,
} from "@/services/peer-review/control-library";
import {
  extractPeerReviewFile,
  summarizeExtractedFiles,
  type ExtractedPeerReviewFile,
} from "@/services/peer-review/document-text.service";

function value(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function getFile(form: FormData, key: string) {
  const file = form.get(key);

  if (file instanceof File && file.size > 0) {
    return file;
  }

  return null;
}

function getFiles(form: FormData, key: string) {
  return form
    .getAll(key)
    .filter(
      (item): item is File =>
        item instanceof File && item.size > 0,
    );
}

function truncate(text: string, max = 9000) {
  if (text.length <= max) {
    return text;
  }

  return `${text.slice(0, max)}\n\n[Truncated ${text.length - max} characters]`;
}

function findEvidence(
  files: ExtractedPeerReviewFile[],
  terms: string[],
) {
  const joined = files
    .map((file) => file.text)
    .join("\n")
    .toLowerCase();

  return terms.filter((term) =>
    joined.includes(term.toLowerCase()),
  );
}

function fallbackAnalysis(
  scope: string,
  files: ExtractedPeerReviewFile[],
) {
  const controls = controlsForScope(scope);
  const evidence = {
    authentication: findEvidence(files, [
      "authentication",
      "password",
      "mfa",
      "otp",
      "lockout",
    ]),
    authorization: findEvidence(files, [
      "authorization",
      "idor",
      "access control",
      "privilege",
    ]),
    session: findEvidence(files, [
      "session",
      "cookie",
      "httponly",
      "secure flag",
      "csrf",
    ]),
    injection: findEvidence(files, [
      "xss",
      "sql injection",
      "command injection",
      "ssrf",
      "xxe",
    ]),
    api: findEvidence(files, [
      "jwt",
      "rate limit",
      "content-type",
      "api",
      "token",
    ]),
    llm: findEvidence(files, [
      "prompt injection",
      "jailbreak",
      "model dos",
      "data exfiltration",
      "plugin",
    ]),
  };

  const gaps = controls
    .filter((control) => {
      const haystack = files
        .map((file) => file.text)
        .join("\n")
        .toLowerCase();

      return !control.title
        .toLowerCase()
        .split(/[,\s/]+/)
        .filter((token) => token.length > 5)
        .some((token) => haystack.includes(token));
    })
    .slice(0, 8);

  return `
## Peer Review Agent Result

Local AI was not reachable, so Atomix generated a deterministic control-coverage review from the uploaded artifacts.

### Evidence Signals
- Authentication: ${evidence.authentication.join(", ") || "No strong keyword evidence found"}
- Authorization: ${evidence.authorization.join(", ") || "No strong keyword evidence found"}
- Session management: ${evidence.session.join(", ") || "No strong keyword evidence found"}
- Injection/input validation: ${evidence.injection.join(", ") || "No strong keyword evidence found"}
- API/JWT controls: ${evidence.api.join(", ") || "No strong keyword evidence found"}
- LLM controls: ${evidence.llm.join(", ") || "No strong keyword evidence found"}

### Controls Needing Reviewer Attention
${gaps
  .map(
    (control) =>
      `- ${control.id} — ${control.title}: ${control.missedFindingPrompt}`,
  )
  .join("\n")}

### Peer Review Decision
- Review uploaded FEAD/BEAD evidence against the controls above before approving.
- Confirm all applicable scanner reports are attached or explicitly marked not applicable.
- Re-run this agent with local AI online for deeper narrative analysis and finding-quality checks.
`;
}

export async function POST(req: Request) {
  try {
    await requireAccess([
      "ADMIN",
      "GOVERNANCE_TEAM",
      "QA_REVIEWER",
    ]);

    const form = await req.formData();
    const scope = value(form, "scope") || "Web only";
    const typeOfReview = value(form, "typeOfReview") || "FULL";
    const appType = value(form, "typeOfApplication") || "Internal";
    const network = value(form, "network") || "Adjacent";
    const referencePackage = value(form, "referencePackage");
    const reviewRecord = value(form, "reviewRecord");
    const targetUrl = value(form, "targetUrl");
    const ipAddress = value(form, "ipAddress");
    const roles = value(form, "roles");
    const authentication = value(form, "authentication");
    const overallRisk = value(form, "overallRisk") || "Medium";
    const notes = value(form, "notes");
    const risk = {
      confidentiality: value(form, "confidentiality") || "Medium",
      integrity: value(form, "integrity") || "Medium",
      availability: value(form, "availability") || "Medium",
    };

    const feadFile = getFile(form, "feadFile");
    const beadFile = getFile(form, "beadFile");
    const llmFeadFile =
      getFile(form, "llmFeadFile") ?? getFile(form, "aiQrmFile");
    const scanFiles = getFiles(form, "scanFiles");
    const scanTypes = form
      .getAll("scanTypes")
      .map((scanType) => String(scanType || "Unclassified"));
    const scanInventory = scanFiles.map(
      (file, index) =>
        `${scanTypes[index] ?? "Unclassified"}: ${file.name}`,
    );
    const filesToExtract = [
      feadFile,
      beadFile,
      llmFeadFile,
      ...scanFiles,
    ].filter(Boolean) as File[];

    if (!feadFile && !beadFile && scanFiles.length === 0) {
      return Response.json(
        {
          error:
            "Upload at least one FEAD, BEAD, or scanner report file.",
        },
        {
          status: 400,
        },
      );
    }

    const extractedFiles = await Promise.all(
      filesToExtract.map(extractPeerReviewFile),
    );
    const applicableControls = controlsForScope(scope);
    const controlText = applicableControls
      .map(
        (control) =>
          `${control.id} ${control.title} (${control.category})\nEvidence: ${control.evidencePrompt}\nMissed finding prompt: ${control.missedFindingPrompt}`,
      )
      .join("\n\n");

    const artifactText = extractedFiles
      .map(
        (file) =>
          `Artifact: ${file.name} (${file.type}, ${file.size} bytes)\n${truncate(file.text)}`,
      )
      .join("\n\n---\n\n");

    const prompt = `
Act as the Atomix Peer Review Agent.

Review metadata:
- Scope: ${scope}
- Type of Review: ${typeOfReview}
- SPR: ${referencePackage || "Not provided"}
- SR: ${reviewRecord || "Not provided"}
- Testing app URL: ${targetUrl || "Not provided"}
- IP address: ${ipAddress || "Not provided"}
- Role/s and RBAC roles: ${roles || "Not provided"}
- Application type: ${appType}
- Overall risk: ${overallRisk}
- CIA risk: C=${risk.confidentiality}, I=${risk.integrity}, A=${risk.availability}
- AV attack vector: ${network}
- Au authentication: ${authentication || "Not provided"}
- Scan inventory: ${scanInventory.length > 0 ? scanInventory.join("; ") : "No scan reports attached"}
- Reviewer notes: ${notes || "None"}

Applicable peer review controls:
${controlText}

Uploaded artifact excerpts:
${artifactText}

Return a structured peer review report in markdown with:
1. Executive peer review decision: Pass with conditions, Needs rework, or Escalate.
2. Artifact completeness table covering FEAD, BEAD, LLM FEAD, Qualys, Checkmarx, Mend, AquaSec, Burp, and manual evidence when applicable.
3. Controls covered with evidence.
4. Potential missed findings.
5. Controls requiring more testing.
6. Scanner-to-artifact mismatches.
7. Required reviewer actions before approval.
8. Suggested Atomix agent commands if records or findings should be created.
`;

    let analysis = "";
    let mode = "local-ai";

    try {
      analysis = await askCopilot(
        prompt,
        "Peer review checklist, uploaded Word/PDF/text artifacts, and scanner reports.",
      );
    } catch {
      mode = "deterministic-fallback";
      analysis = fallbackAnalysis(scope, extractedFiles);
    }

    return Response.json({
      ok: true,
      mode,
      scope,
      typeOfReview,
      referencePackage,
      reviewRecord,
      targetUrl,
      ipAddress,
      roles,
      authentication,
      overallRisk,
      typeOfApplication: appType,
      risk,
      network,
      scanInventory,
      artifacts: summarizeExtractedFiles(extractedFiles),
      applicableControlCount: applicableControls.length,
      controls: applicableControls.map((control) => ({
        id: control.id,
        title: control.title,
        category: control.category,
      })),
      analysis,
      availableControlLibrary: peerReviewControls.length,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Peer review failed",
      },
      {
        status: 400,
      },
    );
  }
}
