import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

interface UserContextValue {
  currentUser: User | null;
  allUsers: User[];
  switchUser: (id: number) => void;
}

const UserContext = createContext<UserContextValue>({
  currentUser: null,
  allUsers: [],
  switchUser: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState(() => Number(localStorage.getItem("lp-user-id") || 1));
  const { data: allUsers = [] } = useQuery<User[]>({ queryKey: ["/api/users"] });

  const currentUser = useMemo(() => allUsers.find((user) => user.id === userId) ?? null, [allUsers, userId]);

  const switchUser = (id: number) => {
    setUserId(id);
    localStorage.setItem("lp-user-id", String(id));
  };

  return <UserContext.Provider value={{ currentUser, allUsers, switchUser }}>{children}</UserContext.Provider>;
}

export function useCurrentUser() {
  return useContext(UserContext);
}
