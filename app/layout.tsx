import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "SmashCourt - Pickleball Reservations",
  description: "A working mock booking site for SmashCourt Pickleball.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
