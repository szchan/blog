import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blog",
  description: "Personal blog + portfolio",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
