import type React from "react"
import { Inter, Exo_2 } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"
import { AuthProvider } from "@/components/auth-provider"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const exo2 = Exo_2({ subsets: ["latin"], variable: "--font-exo2" })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ro" className={`${inter.variable} ${exo2.variable}`}>
      <head>
        <title>Fluxia - Platformă Medicală</title>
        <meta name="description" content="Sistem integrat pentru monitorizarea și îmbunătățirea stării pacienților" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
        {/* Add chunk error handling script */}
        <Script id="handle-chunk-error" strategy="beforeInteractive">{`
          window.addEventListener('error', function(e) {
            // Check if the error is a chunk load error
            if (e.message && e.message.includes('Loading chunk')) {
              // Reload the page
              window.location.reload();
            }
          });
        `}</Script>
      </body>
    </html>
  )
}



import './globals.css'

export const metadata = {
      generator: 'v0.dev'
    };
