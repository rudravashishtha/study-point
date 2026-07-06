import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "1plus1 Mathematics",
    template: "%s | 1plus1 Mathematics",
  },
  description:
    "Mobile-first platform foundation for CBSE and CISCE mathematics coaching.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
