import PublicHeader from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ReactNode } from "react";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PublicHeader />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-6">{children}</div>
      </main>
      <Footer />
    </>
  );
}
