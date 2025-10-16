"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function VerifyEmailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const email = searchParams.get("email");
    if (!email) {
      console.error("No email provided for verification tracking");
      return;
    }

    const redirectToDashboard = () => {
      setIsVerifying(true);
      setTimeout(() => {
        router.push("/");
      }, 500);
    };

    const url = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/verification-status?email=${encodeURIComponent(email)}`;
    const eventSource = new EventSource(url, { withCredentials: true });

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === "verified") {
          redirectToDashboard();
          eventSource.close();
        }
      } catch (err) {
        console.error("Error parsing SSE message:", err);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
    };

    return () => {
      eventSource.close();
    };
  }, [router, searchParams]);

  if (isVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Email Verified!</CardTitle>
            <CardDescription>Taking you to your dashboard...</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>We&apos;ve sent you a verification link to confirm your email address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-center">
            <svg
              className="mx-auto h-16 w-16 text-muted-foreground mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm text-muted-foreground">
              Click the link in the email to verify your account and start using AI Hub
            </p>
          </div>

          <div className="text-sm text-center space-y-2">
            <p className="text-muted-foreground">Didn&apos;t receive the email?</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Check your spam folder</li>
              <li>• Make sure you entered the correct email address</li>
              <li>• Wait a few minutes and check again</li>
            </ul>
          </div>

          <div className="pt-4 space-y-2">
            <Button variant="outline" className="w-full" onClick={() => router.push("/auth/login")}>
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
