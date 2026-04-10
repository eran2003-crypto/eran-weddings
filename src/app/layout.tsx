import type { Metadata } from "next";
import { Inter, Playfair_Display, Cormorant_Garamond, Bebas_Neue, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-playfair",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cormorant",
});

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-bebas",
});

const space = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-space",
});

export const metadata: Metadata = {
  title: "Eran Yosef | Wedding Club",
  description: "Eran Yosef | Wedding Club",
  openGraph: {
    title: "Eran Yosef | Wedding Club",
    description: "Eran Yosef | Wedding Club",
    images: ["/hero-bg.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${inter.className} ${playfair.variable} ${cormorant.variable} ${bebas.variable} ${space.variable} min-h-screen bg-white text-black antialiased`}>
        {children}
      </body>
    </html>
  );
}
