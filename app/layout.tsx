import './globals.css'
import type { Metadata } from "next";
import { Inter, Source_Code_Pro } from "next/font/google";
import { SafeArea } from "@coinbase/onchainkit/minikit";
import { minikitConfig } from "../minikit.config";
import { RootProvider } from "./rootProvider";

export const metadata: Metadata = {
  title: "Base Habit Tracker",
  description: "Track your daily habits on-chain with Base",
  applicationName: "Base Habit Tracker",
appleWebApp: {
  capable: true,
  title: "Base Habit Tracker",
  statusBarStyle: "default",
},
openGraph: {
  title: "Base Habit Tracker",
  description: "Track your daily habits on-chain with Base",
  images: ['/blue-hero.png'],
},
  other: {
    'base:app_id': '6967c08f4991800a6d9d62f8',
    "fc:frame": JSON.stringify({
      version: minikitConfig.miniapp.version,
      imageUrl: minikitConfig.miniapp.heroImageUrl,
      button: {
        title: `Join the ${minikitConfig.miniapp.name} Waitlist`,
        action: {
          name: `Launch ${minikitConfig.miniapp.name}`,
          type: "launch_frame",
        },
      },
    }),
  },
};

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-source-code-pro",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RootProvider>
      <html lang="en">
        <body className={`${inter.variable} ${sourceCodePro.variable}`}>
          <SafeArea>{children}</SafeArea>
        </body>
      </html>
    </RootProvider>
  );
}
