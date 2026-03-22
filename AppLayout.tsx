import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { TopBar } from "./TopBar";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <TopBar />
      <main className="page-shell">{children}</main>
      <BottomNav />
    </div>
  );
}
