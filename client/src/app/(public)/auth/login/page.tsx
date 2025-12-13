"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GalleryVerticalEnd } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    console.log("[LoginPage] useEffect running, user:", user?.email);
    if (user) {
      // Check if token still exists before redirecting
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      console.log("[LoginPage] Token exists:", !!token);
      if (token) {
        console.log("[LoginPage] User is logged in, redirecting to dashboard");
        router.push("/dashboard");
      }
    }
  }, [user, router]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          AI Hub Inc.
        </a>
        <LoginForm />
      </div>
    </div>
  );
}
