"use client";

export default function SwitchUserButton({
  userId,
}: {
  userId: string;
}) {
  async function switchUser() {
    await fetch(
      "/api/auth/switch-user",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          userId,
        }),
      }
    );

    window.location.reload();
  }

  return (
    <button
      onClick={switchUser}
      className="
      px-3
      py-2
      rounded-lg
      bg-cyan-500/20
      text-cyan-400
      hover:bg-cyan-500/30
      "
    >
      Switch User
    </button>
  );
}