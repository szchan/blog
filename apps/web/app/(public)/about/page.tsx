import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "About",
  description: "About me and this blog.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-8 text-4xl font-bold gradient-text">About Me</h1>
      <div className="flex flex-col gap-4 text-muted leading-relaxed">
        <p>
          I&apos;m a full-stack developer passionate about building things for
          the web. This blog is where I share what I learn about software
          engineering, system design, and the tools I use day to day.
        </p>
        <p>
          This site is built with Next.js, FastAPI, PostgreSQL, and Tailwind
          CSS — the full source code is open source and available on GitHub.
          It serves as both a writing platform and a portfolio of my work.
        </p>
        <p>
          Feel free to reach out if you have questions about any of the
          articles or projects here.
        </p>
      </div>
      <div className="mt-8 flex gap-4">
        <Button href="/blog">Read the Blog</Button>
        <Button href="/projects" variant="secondary">
          View Projects
        </Button>
      </div>
    </div>
  );
}
