export function normalizeSeverity(
  severity: string
): string {

  const value =
    severity.toLowerCase();

  if (
    value.includes("critical")
  )
    return "Critical";

  if (
    value.includes("high")
  )
    return "High";

  if (
    value.includes("medium")
  )
    return "Medium";

  if (
    value.includes("low")
  )
    return "Low";

  return "Info";
}