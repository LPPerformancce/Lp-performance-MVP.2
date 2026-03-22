import { useCurrentUser } from "@/lib/userContext";

export function TopBar() {
  const { currentUser, allUsers, switchUser } = useCurrentUser();

  return (
    <header className="topbar">
      <div>
        <div className="eyebrow">LP Performance</div>
        <h1>{currentUser?.role === "coach" ? "Coach MVP" : "Client MVP"}</h1>
      </div>
      <select
        className="user-switch"
        value={currentUser?.id ?? ""}
        onChange={(e) => switchUser(Number(e.target.value))}
      >
        {allUsers.map((user) => (
          <option key={user.id} value={user.id}>
            {user.displayName} · {user.role}
          </option>
        ))}
      </select>
    </header>
  );
}
