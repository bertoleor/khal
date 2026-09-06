import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Khal — Admin",
  description: "Backoffice de la agenda virtual",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
