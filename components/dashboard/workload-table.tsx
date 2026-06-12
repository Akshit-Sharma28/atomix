interface Workload {
  id: string;
  name: string;
  role: string;
  findingCount: number;
}

export default function WorkloadTable({
  users,
}: {
  users: Workload[];
}) {
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
      <h2
        className="
        text-2xl
        font-bold
        mb-6
        "
      >
        Developer Workload
      </h2>

      <div className="space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="
            flex
            items-center
            justify-between
            bg-slate-800
            rounded-xl
            p-4
            "
          >
            <div>
              <p className="font-semibold text-white">
                {user.name}
              </p>

              <p className="text-sm text-slate-400">
                {user.role}
              </p>
            </div>

            <div
              className="
              text-cyan-400
              text-2xl
              font-bold
              "
            >
              {user.findingCount}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}