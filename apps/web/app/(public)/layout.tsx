import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { GradientBackground } from "@/components/effects/GradientBackground";
import { Navbar } from "@/components/layout/Navbar";
import { PageTransition } from "@/components/effects/PageTransition";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <GradientBackground />
      <Navbar />
      <main className="mx-auto min-h-[calc(100vh-8rem)] max-w-5xl px-6 py-12">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </>
  );
}
