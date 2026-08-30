import type { Metadata } from "next";
import "./globals.css";
import "@/styles/globals.css";
import { AuthProvider } from "@/lib/firebase/authContext";
import { AppInitializer } from "@/lib/firebase/AppInitializer";

export const metadata: Metadata = {
  title: "Diseño Divino — The UI/UX & Creative Tech Club",
  description:
    "Official portal for Diseño Divino. A multidisciplinary creative technology collective crafting next-generation digital interfaces, generative 3D web apps, and immersive spatial design systems.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Geist:wght@300;400;500;600;700&family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,600&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800&family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/main.css" />
      </head>
      <body className="bg-[#050505] text-[#dde4e2] antialiased selection:bg-primary/30 selection:text-primary min-h-screen">
        <AuthProvider>
          <AppInitializer />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
