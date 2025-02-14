import type { Metadata } from "next";
import { Lora, Ubuntu } from "next/font/google";
import "./globals.css";

const ubuntu = Ubuntu({
  variable: "--font-ubuntu-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

const lora = Lora({
  variable: "--font-lora-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Kitwek Victoria - Strengthening the Kalenjin Community",
  description:
    "Kitwek Victoria fosters cultural preservation, social empowerment, and economic advancement for the Kalenjin community in Victoria, Australia. Join us in promoting heritage, education, and integration within Australian society.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          type="image/png"
          href="/favicon/favicon-96x96.png"
          sizes="96x96"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon/favicon.svg" />
        <link rel="shortcut icon" href="/favicon/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/favicon/apple-touch-icon.png"
        />
        <meta name="apple-mobile-web-app-title" content="Kitwek Australia" />
        <link rel="manifest" href="/favicon/site.webmanifest" />
      </head>
      <body className={`${ubuntu.variable} ${lora.variable} w-full`}>
          {children}
      </body>
    </html>
  );
}
