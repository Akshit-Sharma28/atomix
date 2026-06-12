export async function generateFindingAnalysis(
  title: string,
  severity: string,
  description?: string
) {
  const severityScores: Record<string, number> = {
    Critical: 95,
    High: 80,
    Medium: 60,
    Low: 30,
  };

  const riskScore =
    severityScores[severity] ?? 50;

  return {
    riskScore,

    businessImpact: `
This vulnerability could impact business operations,
customer trust, regulatory compliance,
and overall security posture.
`.trim(),

    technicalImpact: `
An attacker may exploit this issue to gain
unauthorized access, manipulate data,
or affect application availability.
`.trim(),

    remediationPlan: `
Review affected components,
implement remediation,
perform validation testing,
and conduct retesting before closure.
`.trim(),

    developerGuidance: `
Review the vulnerable code path,
apply secure coding practices,
add validation controls,
and create regression tests.
`.trim(),

    executiveSummary: `
This finding represents a ${severity}
security risk requiring remediation
based on business priority and exposure.
`.trim(),
  };
}