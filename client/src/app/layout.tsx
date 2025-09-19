import Header from "@/components/layout/Header";
import "./globals.css";
import { ReactNode } from "react";
import { Providers } from "./providers";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "AI Hub",
  description: "Platform to experiment with AI models",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen bg-background font-sans">
        <Providers>
          <Header />
          <main className="flex-grow">
            <div className="container mx-auto px-4 py-6">{children}</div>
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
