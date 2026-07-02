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

export const maxDuration = 60;

const maxPeerReviewUploadBytes = 4 * 1024 * 1024;
const peerReviewArtifactChunkChars = 3500;
const peerReviewArtifactExcerptChars = 12000;
const peerReviewAiTimeoutMs = 45000;
const peerReviewOutputTokenBudget = 700;

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

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function estimateTokens(characters: number) {
  return Math.ceil(characters / 4);
}

function estimateChunks(characters: number) {
  return Math.max(1, Math.ceil(characters / peerReviewArtifactChunkChars));
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
  aiError?: string,
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

  const haystack = files
    .map((file) => file.text)
    .join("\n")
    .toLowerCase();

  const controlCoverage = controls.map((control) => {
    const matchedTokens = control.title
      .toLowerCase()
      .split(/[,\s/]+/)
      .filter((token) => token.length > 5)
      .filter((token) => haystack.includes(token));

    return {
      control,
      matchedTokens,
      status: matchedTokens.length > 0 ? "Evidence signal found" : "Needs reviewer attention",
    };
  });

  return `
## Peer Review Agent Result

Local AI did not return a peer-review response in time, so Atomix generated a deterministic control-coverage review from the uploaded artifacts.
${aiError ? `\nAI status detail: ${aiError}\n` : ""}

### Peer Reviewer Comments
- FEAD evidence was checked against the active Atomix peer review control library for ${scope}.
- Reviewer must confirm each applicable FEAD control has clear test evidence, a result, and a finding or not-applicable rationale.
- Where scanner evidence is attached, reviewer must reconcile scanner output with FEAD/BEAD conclusions before approval.
- Any missing authentication, authorization, session, input validation, cryptography, data protection, or AI-control evidence should be returned for rework.

### Evidence Signals
- Authentication: ${evidence.authentication.join(", ") || "No strong keyword evidence found"}
- Authorization: ${evidence.authorization.join(", ") || "No strong keyword evidence found"}
- Session management: ${evidence.session.join(", ") || "No strong keyword evidence found"}
- Injection/input validation: ${evidence.injection.join(", ") || "No strong keyword evidence found"}
- API/JWT controls: ${evidence.api.join(", ") || "No strong keyword evidence found"}
- LLM controls: ${evidence.llm.join(", ") || "No strong keyword evidence found"}

### Complete Applicable Control Coverage
${controlCoverage
  .map(
    ({ control, matchedTokens, status }) =>
      `- ${control.id} — ${control.title}: ${status}. ${matchedTokens.length > 0 ? `Signals: ${matchedTokens.join(", ")}.` : control.missedFindingPrompt}`,
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
    const grcRiskProfile =
      value(form, "grcRiskProfile") || overallRisk;
    const agentSuggestedRiskProfile =
      value(form, "agentSuggestedRiskProfile") || overallRisk;
    const riskProfileConfirmed =
      value(form, "riskProfileConfirmed") === "on";
    const riskValidationComment = value(form, "riskValidationComment");
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
    const uploadBytes = filesToExtract.reduce(
      (total, file) => total + file.size,
      0,
    );

    if (!feadFile && !beadFile && !llmFeadFile && scanFiles.length === 0) {
      return Response.json(
        {
          error:
            "Upload at least one FEAD, BEAD, LLM FEAD, or scanner report file.",
        },
        {
          status: 400,
        },
      );
    }

    if (uploadBytes > maxPeerReviewUploadBytes) {
      return Response.json(
        {
          ok: false,
          error: `Selected files total ${formatBytes(uploadBytes)}. The current peer review route supports up to ${formatBytes(maxPeerReviewUploadBytes)} per run. Please upload a smaller FEAD/BEAD extract or one artifact at a time.`,
        },
        {
          status: 413,
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
          `Artifact: ${file.name} (${file.type}, ${file.size} bytes)\n${truncate(file.text, peerReviewArtifactExcerptChars)}`,
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
- GRC risk profile: ${grcRiskProfile}
- Agent-suggested risk profile: ${agentSuggestedRiskProfile}
- Peer reviewer risk confirmation: ${riskProfileConfirmed ? "Confirmed" : "Not confirmed"}
- Risk validation comment: ${riskValidationComment || "None"}
- AV attack vector: ${network}
- Au authentication: ${authentication || "Not provided"}
- Scan inventory: ${scanInventory.length > 0 ? scanInventory.join("; ") : "No scan reports attached"}
- Reviewer notes: ${notes || "None"}

Applicable peer review controls:
${controlText}

Uploaded artifact excerpts:
${artifactText}

Current Atomix peer review control flow:
- Confirm FEAD controls match the declared scope, review type, application exposure, CIA rating, AV, Au, target URL/IP, and RBAC roles.
- Use BEAD when backend, API, service, data-flow, authentication, authorization, integration, or persistence controls are applicable.
- Use LLM FEAD when model workflows, prompt flows, tool use, data leakage, model DoS, data poisoning, or AI governance controls are in scope.
- Validate applicable Qualys, Checkmarx, Mend, AquaSec, Burp, manual evidence, and LLM FEAD outputs are present or explicitly marked not applicable.
- Compare scanner findings with FEAD/BEAD conclusions to detect missing, downgraded, duplicated, unsupported, or untracked findings.
- Produce peer reviewer comments that a QA reviewer can paste into governance validation.

Return a complete structured peer review report in markdown. Keep it under ${peerReviewOutputTokenBudget} tokens and cover every applicable control that has weak, missing, or unclear evidence:
1. Executive peer review decision: Pass with conditions, Needs rework, or Escalate.
2. Artifact completeness gaps across uploaded FEAD, BEAD, LLM FEAD, and scan evidence.
3. Controls with evidence, using Atomix control IDs where possible.
4. Controls needing reviewer attention, using Atomix control IDs and one-line rationale for each.
5. Required reviewer actions before approval.
6. Suggested Atomix agent commands, only if useful.
`;

    let analysis = "";
    let mode = "local-ai-ollama";
    let aiElapsedMs = 0;
    let aiStatusDetail = "Completed";
    const extractedCharacters = extractedFiles.reduce(
      (total, file) => total + file.text.length,
      0,
    );
    const artifactChunks = extractedFiles.reduce(
      (total, file) => total + estimateChunks(file.text.length),
      0,
    );
    const promptCharacters = prompt.length;
    const estimatedPromptTokens = estimateTokens(promptCharacters);
    const aiStartedAt = Date.now();

    try {
      analysis = await askCopilot(
        prompt,
        "Local AI peer review of FEAD, BEAD, LLM FEAD, scanner artifacts, control coverage, and governance validation comments.",
        {
          timeoutMs: peerReviewAiTimeoutMs,
          numPredict: peerReviewOutputTokenBudget,
          think: false,
        },
      );
      aiElapsedMs = Date.now() - aiStartedAt;
    } catch (error) {
      mode = "deterministic-fallback";
      aiElapsedMs = Date.now() - aiStartedAt;
      aiStatusDetail =
        error instanceof Error ? error.message : "Unknown AI error";
      analysis = fallbackAnalysis(
        scope,
        extractedFiles,
        aiStatusDetail,
      );
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
      grcRiskProfile,
      agentSuggestedRiskProfile,
      riskProfileConfirmed,
      riskValidationComment,
      typeOfApplication: appType,
      risk,
      network,
      scanInventory,
      artifacts: summarizeExtractedFiles(extractedFiles),
      processingInsights: {
        uploadBytes,
        uploadLimitBytes: maxPeerReviewUploadBytes,
        extractedCharacters,
        estimatedExtractedTokens: estimateTokens(extractedCharacters),
        artifactChunks,
        chunkSizeCharacters: peerReviewArtifactChunkChars,
        vectorDbUsed: false,
        promptCharacters,
        estimatedPromptTokens,
        excerptLimitPerArtifactCharacters: peerReviewArtifactExcerptChars,
        aiTimeoutMs: peerReviewAiTimeoutMs,
        aiElapsedMs,
        aiStatusDetail,
        outputTokenBudget: peerReviewOutputTokenBudget,
      },
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
