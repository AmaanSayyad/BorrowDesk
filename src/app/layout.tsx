import type { Metadata } from "next";
import { Providers } from "./providers";
import { MusicRouteGuard } from "@/components/ui/MusicRouteGuard";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://borrowdesk.fun",
  ),
  title: "BorrowDesk - Borrow against Stock Tokens",
  description:
    "Keep your Stock Tokens. Unlock USDG liquidity on Robinhood Chain. Built for Arbitrum Open House Singapore.",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon.png", sizes: "256x256", type: "image/png" },
      { url: "/favicon.ico", sizes: "48x48" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon-32.png",
  },
  openGraph: {
    title: "BorrowDesk - Borrow against Stock Tokens",
    description:
      "Collateralized USDG credit lines against tokenized equities on Robinhood Chain.",
    type: "website",
    images: [
      {
        url: "/brand/borrowdesk-mark.jpg",
        width: 1024,
        height: 1024,
        alt: "BorrowDesk",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "BorrowDesk - Borrow against Stock Tokens",
    description:
      "Collateralized USDG credit lines against tokenized equities on Robinhood Chain.",
    images: ["/brand/borrowdesk-mark.jpg"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-black font-sans text-white">
        <Providers>
          <MusicRouteGuard />
          {children}
        </Providers>
      </body>
    </html>
  );
}
