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
  
  let hasOtherRole = false;
  if (session) {
    const { prisma } = await import("@/lib/prisma");
    if (session.email) {
      if (session.role === "OWNER") {
        const candidate = await prisma.candidate.findUnique({ where: { email: session.email } });
        hasOtherRole = !!candidate;
      } else {
        const owner = await prisma.user.findUnique({ where: { email: session.email } });
        hasOtherRole = !!owner;
      }
    }
  }

  return (
    <html
      lang="fr"
      className={`${fontSans.variable} font-sans h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7186584588652268" crossOrigin="anonymous"></script>
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Header session={session} hasOtherRole={hasOtherRole} />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <UserSwitcher />
      </body>
    </html>
  );
}
