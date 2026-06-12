import { getUsers } from "../../services/users/user.service";
import SwitchUserButton from "../../components/users/switch-user-button";

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-5xl font-bold">
          User Management
        </h1>

        <p className="text-slate-400 mt-2">
          RBAC Administration
        </p>
      </div>

      <div
        className="
        bg-slate-900
        border
        border-slate-800
        rounded-2xl
        overflow-hidden
        "
      >
        <table className="w-full">
          <thead>
            <tr>
              <th className="p-4 text-left">
                Name
              </th>

              <th className="p-4 text-left">
                Email
              </th>

              <th className="p-4 text-left">
                Role
              </th>

              <th className="p-4 text-left">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="
                border-b
                border-slate-800
                "
              >
                <td className="p-4">
                  {user.name}
                </td>

                <td className="p-4 text-slate-400">
                  {user.email}
                </td>

                <td className="p-4">
                  <span
                    className="
                    px-3
                    py-1
                    rounded-full
                    bg-cyan-500/10
                    text-cyan-400
                    "
                  >
                    {user.role}
                  </span>
                </td>

                <td className="p-4">
                  <SwitchUserButton
                    userId={user.id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}