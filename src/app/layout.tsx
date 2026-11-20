import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Fleet & Incident Console", description: "Public transport fleet and incident management" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body>{children}</body></html>);
}
