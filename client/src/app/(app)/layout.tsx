"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="container mx-auto">{children}</div>
    </AuthProvider>
  );
}
