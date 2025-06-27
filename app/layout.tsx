
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Image from "next/image";
import Logo from './logo.svg'
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CCIP USDC Bridge",
  description: "Cross-chain USDC transfers using Chainlink CCIP",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "20px" }}>
        <div className={"w-60"}>
          <Link href="/">
            <Image src={Logo} alt="CCIP USDC Bridge Logo" />
          </Link>
        </div>
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
