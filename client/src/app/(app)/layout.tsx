import { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <div className="container mx-auto">{children}</div>;
}
