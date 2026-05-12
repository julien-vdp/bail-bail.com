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
  title: "Bail-Bail.com | La gestion locative, sans le chaos.",
  description: "Constituez, envoyez et gérez vos dossiers de location en toute simplicité.",
  icons: {
    icon: "/logo.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { verifySession } = await import("@/lib/auth");
  const session = await verifySession();

  return (
    <html
      lang="fr"
      className={`${fontSans.variable} font-sans h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Header session={session} />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <UserSwitcher />
      </body>
    </html>
  );
}
