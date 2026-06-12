interface FindingPreview {
  title: string;
  severity: string;
}

export default function ImportPreview({
  findings,
}: {
  findings: FindingPreview[];
}) {
  return (
    <div className="
      bg-slate-900
      border
      border-slate-800
      rounded-2xl
      p-6
      mt-6
    ">
      <h2 className="text-xl font-bold mb-4">
        Findings Preview
      </h2>

      <div className="space-y-3">
        {findings.map((finding, index) => (
          <div
            key={index}
            className="
              bg-slate-800
              rounded-lg
              p-4
            "
          >
            <p className="font-medium">
              {finding.title}
            </p>

            <p className="text-slate-400">
              {finding.severity}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}