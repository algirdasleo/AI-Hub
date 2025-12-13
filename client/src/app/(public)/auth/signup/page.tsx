"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignupForm } from "@/components/auth/SignupForm";
import { GalleryVerticalEnd } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function SignupPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    console.log("[SignupPage] useEffect running, user:", user?.email);
    if (user) {
      console.log("[SignupPage] User is logged in, redirecting to dashboard");
      router.push("/dashboard");
    }
  }, [user, router]);

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
        <SignupForm />
      </div>
    </div>
  );
}
