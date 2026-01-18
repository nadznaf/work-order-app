import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google"; // Using prompt specific fonts
import "./globals.css";
import { RoleProvider } from "@/src/context/RoleContext";
import Navbar from "@/src/components/Navbar";


// Using Outfit as primary font for 'premium' look
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Work Order Management System",
  description: "Advanced Agentic Work Order Application for Heavy Equipment Maintenance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${inter.variable} font-sans antialiased bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen`}>
        <RoleProvider>
          <Navbar />
          <main className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {children}
          </main>
        </RoleProvider>
      </body>
    </html>
  );
}
