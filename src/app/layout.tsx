import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Navbar } from "@/components/navigation/Navbar";
import { Web3Provider } from "@/providers/Web3Provider";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "K-NADS ARCHIVE : 코리아나드들의 오프라인 이벤트 아카이브",
	description:
		"강력한 코리아 모나드 커뮤니티를 느껴보세요",
	icons: {
		icon: "/logo.PNG",
		shortcut: "/logo.PNG",
		apple: "/logo.PNG",
	},
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
