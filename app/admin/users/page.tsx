import { getUsers } from "../../../services/users/user.service";

export const dynamic =
  "force-dynamic";

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-5xl font-bold mb-8">
        User Management
      </h1>

      <div className="space-y-4">
        {users.map((user) => (
          <div
            key={user.id}
            className="
              bg-slate-900
              border
              border-slate-800
              rounded-xl
              p-5
            "
          >
            <div className="flex justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {user.name}
                </h2>

                <p className="text-slate-400">
                  {user.email}
                </p>
              </div>

              <span
                className="
                  px-3
                  py-1
                  rounded-full
                  bg-cyan-500/20
                  text-cyan-400
                  text-sm
                "
              >
                {user.role}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
