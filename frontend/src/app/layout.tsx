import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FleetOS+ — Enterprise Fleet Management",
  description: "Monitor every vehicle in real time, optimise routes with AI, and reduce operational costs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css"
        />
      </head>
      <body className="h-full">{children}</body>
    </html>
  );
}
