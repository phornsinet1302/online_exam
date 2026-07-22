import type { Metadata } from "next";
import "../styles/index.css";

export const metadata: Metadata = {
  title: "exam.ai",
  description: "AI-powered exam platform experience",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
