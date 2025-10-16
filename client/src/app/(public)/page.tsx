"use client";

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-4xl font-bold mb-6">Welcome to AI Hub</h1>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-blue-800 dark:text-blue-300 mb-4">Get Started with AI Hub</h2>
        <p className="text-blue-700 dark:text-blue-400 mb-4">
          Explore and experiment with multiple AI models in one place.
        </p>
        <div className="space-y-2">
          <p className="text-blue-700 dark:text-blue-400">
            <a href="/auth/login" className="underline font-semibold hover:text-blue-900 dark:hover:text-blue-200">
              Log in
            </a>{" "}
            to access your dashboard
          </p>
          <p className="text-blue-700 dark:text-blue-400">
            New user?{" "}
            <a
              href="/auth/signup"
              className="underline font-semibold hover:text-blue-900 dark:hover:text-blue-200"
            >
              Sign up
            </a>{" "}
            to get started
          </p>
        </div>
      </div>
    </div>
  );
}
