export interface ParsedFinding {
  title: string;

  severity: string;

  description?: string;

  remediation?: string;

  source: string;

  cvssScore?: number;

  cvssVector?: string;

  cweId?: string;

  owaspCategory?: string;
}