"use client";

import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-4xl font-bold mb-6">Welcome to AI Hub</h1>

      {user ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-green-800 dark:text-green-300 mb-2">
            ✓ You are authenticated!
          </h2>
          <div className="space-y-2 text-green-700 dark:text-green-400">
            <p>
              <strong>Name:</strong> {user.display_name}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Role:</strong> {user.role}
            </p>
            <p>
              <strong>Subscription:</strong> {user.subscription_tier}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
            You are not authenticated
          </h2>
          <p className="text-yellow-700 dark:text-yellow-400">
            Please{" "}
            <a href="/auth/login" className="underline font-semibold">
              log in
            </a>{" "}
            or{" "}
            <a href="/auth/signup" className="underline font-semibold">
              sign up
            </a>{" "}
            to continue.
          </p>
        </div>
      )}
    </div>
  );
}
