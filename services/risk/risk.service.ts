export function calculateRisk(
  findings: {
    severity: string;
  }[]
) {
  let score = 0;

  findings.forEach((finding) => {
    switch (finding.severity) {
      case "Critical":
        score += 10;
        break;

      case "High":
        score += 7;
        break;

      case "Medium":
        score += 4;
        break;

      case "Low":
        score += 1;
        break;
    }
  });

  return score;
}