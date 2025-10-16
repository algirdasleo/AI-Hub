"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function parseTokensFromHash() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  return {
    accessToken: params.get("access_token"),
    refreshToken: params.get("refresh_token"),
  };
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const { accessToken, refreshToken } = parseTokensFromHash();

        if (!accessToken || !refreshToken) {
          setError("Missing verification code. The link may have expired.");
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/callback`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken }),
        });

        const data = await response.json();

        if (!data.success) {
          setError(data.error || "Verification failed");
          return;
        }

        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              window.close();
              setTimeout(() => {
                router.push("/");
              }, 100);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      } catch (err) {
        console.error("Verification error:", err);
        setError("An unexpected error occurred");
      }
    };

    verifyEmail();
  }, [router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Verification Failed</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-destructive">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Email Verified!</CardTitle>
          <CardDescription>This window will close in {countdown} seconds</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="text-green-600">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
