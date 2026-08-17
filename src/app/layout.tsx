import type { ReactNode } from "react";
import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { RecordStoreProvider } from "@/components/RecordStoreProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tracking",
  description: "Daily packing and fulfillment log",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <RecordStoreProvider>
          <AppHeader />
          <main>{children}</main>
        </RecordStoreProvider>
      </body>
    </html>
  );
}
