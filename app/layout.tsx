import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MechCareer | Mechanical Job Dashboard",
  description: "A private workspace to track mechanical engineering opportunities and prepare applications.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
