import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { CartProvider } from "./cart-context";
import "./globals.css";

const bodyFont = DM_Sans({ subsets: ["latin"], variable: "--font-body" });
const displayFont = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Bazar da Ana Rebeca | Peças escolhidas com carinho",
  description:
    "Roupas bem cuidadas, preços gentis e uma nova história para cada peça.",
};

export default function RootLayout({ children, modal }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body><CartProvider>{children}{modal}</CartProvider></body>
    </html>
  );
}
