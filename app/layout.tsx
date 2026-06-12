import type { Metadata } from "next"
import { Bebas_Neue, DM_Sans, Playfair_Display } from "next/font/google"
import { GeistMono } from "geist/font/mono"
import "./globals.css"

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-lux",
  display: "swap",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://facuregalos.com"),
  title: "Facuregalos",
  description: "Facuregalos",

  // icons: {
  //   icon: "/facuregalos.jpeg",
  //   shortcut: "/facuregalos.jpeg",
  //   apple: "/facuregalos.jpeg",
  // },
  // openGraph: {
  //   type: "website",
  //   url: "https://facuregalos.com",
  //   siteName: "Facuregalos",
  //   title: "Facuregalos",
  //   description: "Facuregalos",
  //   images: [
  //     {
  //       url: "/facuregalos.jpeg",
  //       width: 1200,
  //       height: 630,
  //       alt: "Logo de Facuregalos",
  //     },
  //   ],
  // },
  // twitter: {
  //   card: "summary_large_image",
  //   title: "Facuregalos",
  //   description: "Facuregalos",
  //   images: ["/facuregalos.jpeg"],
  // },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${bebasNeue.variable} ${dmSans.variable} ${playfair.variable} ${GeistMono.variable}`}
    >
      <head>{/* <link rel="icon" href="/facuregalos.jpeg" /> */}</head>
      <body className="font-sans">{children}</body>
    </html>
  )
}
