import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { TRPCProvider } from "@/lib/trpc/provider";
import { Navbar } from "@/components/ui/navbar";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

// Load Geist fonts locally to avoid network requests during build
// This prevents build failures in environments with restricted network access
const geistSans = localFont({
  src: [
    {
      path: "../fonts/Geist-Variable.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-geist-sans",
});

const geistMono = localFont({
  src: [
    {
      path: "../fonts/GeistMono-Variable.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "CryptoSentiment - AI-Powered Crypto Analysis",
  description: "Real-time cryptocurrency sentiment analysis powered by AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <TRPCProvider>
              <ErrorBoundary>
                <div className="min-h-screen bg-background">
                  <Navbar />
                  <main className="min-h-screen navbar-offset">
                    {children}
                  </main>
                  <OnboardingWizard />
                </div>
              </ErrorBoundary>
            </TRPCProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
