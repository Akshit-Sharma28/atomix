export default function QRMCard() {
  return (
    <div
      className="
      bg-slate-900
      border
      border-slate-800
      rounded-2xl
      p-6
      "
    >
      <h2 className="text-xl font-bold mb-4">
        LLM FEAD Status
      </h2>

      <div className="space-y-3">

        <div>
          Controls Reviewed:
          {" "}
          12
        </div>

        <div>
          Risks Accepted:
          {" "}
          3
        </div>

        <div>
          Mitigated:
          {" "}
          8
        </div>

        <div>
          Pending Review:
          {" "}
          5
        </div>

      </div>
    </div>
  );
}
