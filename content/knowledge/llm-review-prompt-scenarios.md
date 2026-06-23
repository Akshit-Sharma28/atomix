---
title: LLM Review Prompt Scenario Guide
source: Atomix Library
documentType: LLM FEAD
summary: LLM security scenarios for authorized model-enabled application reviews.
---
# LLM Review Prompt Scenario Guide

Use these categories when reviewing applications that include model responses, RAG, prompts, tool invocation, plugin actions, or autonomous workflows.

## Scenario categories
- Model DoS: excessive generation, recursive tasks, tool loops, and rate-limit pressure.
- Prompt injection: direct instruction override, role confusion, system prompt extraction, and policy bypass attempts.
- Indirect prompt injection: malicious retrieved documents, web content, emails, tickets, or uploaded files.
- Data exfiltration: context dumps, encoded leakage, cross-role data disclosure, and sensitive retrieved content.
- Data poisoning: untrusted knowledge content that self-assigns authority or alters model behavior.
- Plugin invocation: unauthorized tool execution, argument smuggling, state-changing actions, and missing human confirmation.
- Sensitive data leakage: PII, secrets, credentials, private notes, or unrelated workspace data in responses.
- Audit and explainability: missing source evidence, missing assumptions, or untraceable model-assisted decisions.

## Reviewer evidence
For each scenario, capture payload, role, model response, retrieved context if available, tool calls if available, expected safe signal, actual behavior, and remediation guidance.
