import type { Metadata } from "next"
import { Bebas_Neue, DM_Sans } from "next/font/google"
import { GeistMono } from "geist/font/mono"
import "./globals.css"

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://www.sosamotos.com.ar"),
  title: "Sosa Motos",
  description: "Web demo de Sosa Motos",
  generator: "v0.dev",
  icons: {
    icon: "/sosamotos.jpeg",
    shortcut: "/sosamotos.jpeg",
    apple: "/sosamotos.jpeg",
  },
  openGraph: {
    type: "website",
    url: "https://www.sosamotos.com.ar",
    siteName: "Sosa Motos",
    title: "Sosa Motos",
    description: "Web demo de Sosa Motos",
    images: [
      {
        url: "/sosamotos.jpeg",
        width: 1200,
        height: 630,
        alt: "Logo de Sosa Motos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sosa Motos",
    description: "Web demo de Sosa Motos",
    images: ["/sosamotos.jpeg"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${bebasNeue.variable} ${dmSans.variable} ${GeistMono.variable}`}>
      <head>
        <link rel="icon" href="/sosamotos.jpeg" />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  )
}
