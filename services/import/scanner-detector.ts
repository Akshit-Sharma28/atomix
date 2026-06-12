export function detectScanner(
  content: string
) {
  if (content.includes("<issues>")) {
    return "Burp";
  }

  if (
    content.includes("Checkmarx")
  ) {
    return "Checkmarx";
  }

  if (
    content.includes("Qualys")
  ) {
    return "Qualys";
  }

  if (
    content.includes("Mend")
  ) {
    return "Mend";
  }

  return "Unknown";
}