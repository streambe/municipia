import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MunicipIA — Tu asistente municipal",
  description:
    "Consultá información sobre tu municipio de forma fácil e inmediata. Asistentes virtuales municipales potenciados por inteligencia artificial. Proyecto open source de Streambe.",
  openGraph: {
    title: "MunicipIA — Tu asistente municipal",
    description:
      "Consultá información sobre tu municipio de forma fácil e inmediata con inteligencia artificial.",
    type: "website",
    locale: "es_AR",
    siteName: "MunicipIA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <a href="#main-content" className="skip-to-content">
          Ir al contenido principal
        </a>
        {children}
      </body>
    </html>
  );
}
