import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "../components/providers";
import { CompanyLink } from "../components/company-link";

export const metadata: Metadata = {
  title: "AI Cal Fit Count",
  description: "Personalized AI calorie, nutrition, and fitness tracker",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="flex min-h-full flex-col"><Providers>{children}<footer className="border-t bg-white px-4 py-4 text-center text-sm text-slate-500 sm:px-6">About us · <CompanyLink /></footer></Providers></body>
    </html>
  );
}
