import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "../components/providers";
import { CompanyLink } from "../components/company-link";

export const metadata: Metadata = {
  title: "AI Cal Fit Count",
  description: "Personalized AI calorie, nutrition, and fitness tracker",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col"><Providers>{children}<footer className="border-t bg-white px-6 py-4 text-center text-sm text-slate-500">About us · <CompanyLink /></footer></Providers></body>
    </html>
  );
}
