import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { UserSwitcher } from "@/components/UserSwitcher";

const fontSans = Nunito({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Bail-Bail.com | Les dossiers locatifs, sans le chaos.",
  description: "Déposez votre dossier locatif simplement et suivez son avancement en temps réel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${fontSans.variable} font-sans h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <UserSwitcher />
      </body>
    </html>
  );
}
