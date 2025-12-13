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
      console.log("[LoginPage] User is logged in, redirecting to dashboard");
      router.push("/dashboard");
    }
  }, [user, router]);

  // Show redirecting state while user is logged in
  if (user) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6 items-center">
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

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
