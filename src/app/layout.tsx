import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Web3Provider } from "@/providers/Web3Provider";
import { Navbar } from "@/components/navigation/Navbar";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "K-nads.com : 코리아나드들의 오프라인 아카이브",
	description:
		"한국에서 열리는 오프라인 이벤트 사진들을 NFT로 업로드하여 영원히 아카이빙하는 Web3 갤러리 플랫폼",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
		<html lang="ko" className="dark">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<Web3Provider>
					<Navbar />
					<main>{children}</main>
					<Toaster
						position="bottom-right"
						toastOptions={{
							style: {
								background: "#1a1a1a",
								color: "#fff",
								border: "1px solid rgba(255, 255, 255, 0.1)",
							},
						}}
					/>
				</Web3Provider>
			</body>
		</html>
    );
}
