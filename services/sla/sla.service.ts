export function getSLADays(
  severity: string
) {
  switch (severity) {
    case "Critical":
      return 7;

    case "High":
      return 14;

    case "Medium":
      return 30;

    case "Low":
      return 60;

    default:
      return 30;
  }
}

export function calculateDueDate(
  severity: string
) {
  const slaDays =
    getSLADays(severity);

  const dueDate =
    new Date();

  dueDate.setDate(
    dueDate.getDate() +
      slaDays
  );

  return {
    slaDays,
    dueDate,
  };
}