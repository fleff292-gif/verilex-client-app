import type { Metadata } from "next";
import "./globals.css";
import firmConfig from "@/firm.config";

export const metadata: Metadata = {
  title: `${firmConfig.name} — Client Intake`,
  description: `Submit your enquiry to ${firmConfig.name}.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
