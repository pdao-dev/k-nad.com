"use client";

import { Loader2, LogOut, ShieldCheck, ShieldX } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface PendingImage {
	id: string;
	title: string;
	description: string;
	imageUrl: string;
	metadataUrl?: string | null;
	tokenId?: string | null;
	mintedAt?: string | null;
	uploader: {
		address: string;
		username: string | null;
	};
}

type AuthState = "checking" | "login" | "dashboard";

interface AdminSessionResponse {
	authenticated: boolean;
}

interface AdminImagesResponse {
	success: boolean;
	images?: PendingImage[];
	error?: string;
}

export default function AdminPage() {
	const [authState, setAuthState] = useState<AuthState>("checking");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
	const [isLoadingImages, setIsLoadingImages] = useState(false);
	const [approvingId, setApprovingId] = useState<string | null>(null);

	useEffect(() => {
		const checkSession = async () => {
			try {
				const res = await fetch("/api/admin/session");
				const data: AdminSessionResponse = await res.json();
				if (data?.authenticated) {
					setAuthState("dashboard");
					void loadPendingImages();
				} else {
					setAuthState("login");
				}
			} catch (error) {
				console.error("Session check failed", error);
				setAuthState("login");
			}
		};

		void checkSession();
	}, []);

	const loadPendingImages = async () => {
		setIsLoadingImages(true);
		try {
			const res = await fetch("/api/admin/images");
			if (res.status === 401) {
				setAuthState("login");
				return;
			}

			const data: AdminImagesResponse = await res.json();
			if (data?.success) {
				setPendingImages(data.images ?? []);
			} else {
				toast.error(data?.error ?? "대기 중인 이미지를 불러오지 못했습니다.");
			}
		} catch (error) {
			console.error("Failed to fetch pending images", error);
			toast.error("이미지를 불러오는 중 오류가 발생했습니다.");
		} finally {
			setIsLoadingImages(false);
		}
	};

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		try {
			const res = await fetch("/api/admin/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, password }),
			});
			const data = (await res.json()) as { success?: boolean; error?: string };
			if (!res.ok) {
				throw new Error(data?.error || "로그인에 실패했습니다.");
			}

			setAuthState("dashboard");
			setUsername("");
			setPassword("");
			toast.success("관리자 로그인 성공");
			void loadPendingImages();
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "로그인에 실패했습니다.";
			toast.error(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleLogout = async () => {
		await fetch("/api/admin/logout", { method: "POST" });
		setAuthState("login");
		setPendingImages([]);
		toast.success("로그아웃 되었습니다.");
	};

	const handleApprove = async (id: string) => {
		setApprovingId(id);
		try {
			const res = await fetch(`/api/admin/images/${id}/approve`, {
				method: "POST",
			});
			const data = (await res.json()) as { success?: boolean; error?: string };
			if (!res.ok || !data?.success) {
				throw new Error(data?.error || "승인에 실패했습니다.");
			}

			setPendingImages((prev) => prev.filter((image) => image.id !== id));
			toast.success("이미지가 승인되었습니다.");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "승인에 실패했습니다.";
			toast.error(message);
		} finally {
			setApprovingId(null);
		}
	};

	const renderLoginForm = () => (
		<form
			onSubmit={handleLogin}
			className="glass-card max-w-md mx-auto p-8 space-y-6"
		>
			<div className="space-y-2 text-center">
				<h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
					<ShieldCheck className="w-6 h-6 text-violet-400" />
					관리자 로그인
				</h1>
				<p className="text-gray-400 text-sm">
					허가된 관리자만 접근할 수 있습니다.
				</p>
			</div>

			<div className="space-y-2">
				<label className="text-sm text-gray-300">아이디</label>
				<input
					type="text"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					className="w-full rounded-lg border border-gray-700 bg-black/40 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
					placeholder="admin"
					autoComplete="username"
				/>
			</div>

			<div className="space-y-2">
				<label className="text-sm text-gray-300">비밀번호</label>
				<input
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					className="w-full rounded-lg border border-gray-700 bg-black/40 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
					placeholder="••••••••"
					autoComplete="current-password"
				/>
			</div>

			<button
				type="submit"
				disabled={isSubmitting}
				className="w-full primary-button flex items-center justify-center gap-2 disabled:opacity-50"
			>
				{isSubmitting ? (
					<>
						<Loader2 className="w-5 h-5 animate-spin" />
						<span>확인 중...</span>
					</>
				) : (
					<span>로그인</span>
				)}
			</button>
		</form>
	);

	const renderPendingGrid = () => (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-semibold text-white">
						승인 대기 이미지
					</h2>
					<p className="text-gray-400 text-sm">
						민팅된 콘텐츠를 검토 후 승인하세요.
					</p>
				</div>
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => void loadPendingImages()}
						className="glass-card px-4 py-2 text-sm text-white"
						disabled={isLoadingImages}
					>
						{isLoadingImages ? "새로고침 중..." : "새로고침"}
					</button>
					<button
						type="button"
						onClick={handleLogout}
						className="glass-card px-4 py-2 flex items-center gap-2 text-sm text-white"
					>
						<LogOut className="w-4 h-4" />
						로그아웃
					</button>
				</div>
			</div>

			{isLoadingImages ? (
				<div className="flex justify-center py-12">
					<Loader2 className="w-6 h-6 animate-spin text-violet-400" />
				</div>
			) : pendingImages.length === 0 ? (
				<div className="glass-card border border-dashed border-emerald-500/40 p-10 text-center">
					<ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
					<p className="text-white font-semibold">
						승인 대기 중인 이미지가 없습니다.
					</p>
					<p className="text-sm text-gray-400">
						새로운 업로드가 들어오면 이곳에 표시됩니다.
					</p>
				</div>
			) : (
				<div className="grid gap-6 md:grid-cols-2">
					{pendingImages.map((image) => (
						<div key={image.id} className="glass-card p-4 space-y-4">
							<div className="relative h-64 w-full overflow-hidden rounded-lg">
								<Image
									src={image.imageUrl}
									alt={image.title || "Pending image"}
									fill
									className="object-cover"
								/>
							</div>
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<h3 className="text-white font-semibold text-lg">
										{image.title || "Untitled"}
									</h3>
									<span className="text-xs text-gray-400 font-mono">
										Token #{image.tokenId ?? "-"}
									</span>
								</div>
								<p className="text-sm text-gray-300">
									{image.description || "설명이 없습니다."}
								</p>
								<div className="text-xs text-gray-400">
									<p>
										업로더: {image.uploader.username || "Unknown"} (
										{image.uploader.address.slice(0, 6)}...
										{image.uploader.address.slice(-4)})
									</p>
									{image.metadataUrl && (
										<p className="truncate">
											메타데이터:
											{" "}
											<a
												href={image.metadataUrl}
												target="_blank"
												rel="noreferrer"
												className="text-violet-300 underline"
											>
												{image.metadataUrl}
											</a>
										</p>
									)}
								</div>
							</div>
							<button
								type="button"
								onClick={() => void handleApprove(image.id)}
								disabled={approvingId === image.id}
								className="w-full primary-button flex items-center justify-center gap-2 disabled:opacity-50"
							>
								{approvingId === image.id ? (
									<>
										<Loader2 className="w-4 h-4 animate-spin" />
										<span>승인 중...</span>
									</>
								) : (
									<>
										<ShieldX className="w-4 h-4" />
										<span>승인하기</span>
									</>
								)}
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	);

	return (
		<div className="min-h-screen gradient-bg py-20">
			<div className="container mx-auto px-4">
				{authState === "checking" && (
					<div className="flex justify-center py-20">
						<Loader2 className="w-6 h-6 animate-spin text-violet-400" />
					</div>
				)}
				{authState === "login" && renderLoginForm()}
				{authState === "dashboard" && renderPendingGrid()}
			</div>
		</div>
	);
}
