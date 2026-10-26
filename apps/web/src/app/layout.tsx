import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Neel Solutions - Creating Healthy World",
  description: "Welcome to Neel Solutions, dedicated to creating a healthy world with our premium products.",
};

import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { SiteSettingsProvider } from "@/context/SiteSettingsContext";
import { SiteIntro } from "@/components/SiteIntro";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <SiteSettingsProvider>
            <CartProvider>
              <SiteIntro>{children}</SiteIntro>
            </CartProvider>
          </SiteSettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
