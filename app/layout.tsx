import type { Metadata } from "next";
import "@/app/globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "PixelDeck",
  description: "Local-first media asset manager for large AI image and video libraries"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body>
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
