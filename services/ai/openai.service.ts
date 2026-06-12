import { askOllama } from "./ollama.service";

export async function askCopilot(
  question: string,
  context: string
) {
  const prompt = `
You are Atomix Security Copilot.

Security Findings:

${context}

Question:
${question}

Answer:
`;

  return askOllama(prompt);
}

export async function analyzeFinding(
  title: string,
  description: string
) {
  const prompt = `
You are a senior penetration tester.

Analyze this security finding.

Title:
${title}

Description:
${description}

Provide:

1. Business Impact
2. Technical Impact
3. Remediation Plan
4. Developer Guidance
5. Executive Summary
6. Risk Score (1-10)

Format as markdown.
`;

  return askOllama(prompt);
}