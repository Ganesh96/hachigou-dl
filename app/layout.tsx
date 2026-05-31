import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hachigou DL",
  description: "Kaijuu themed YouTube downloader workflow prototype"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}