"use client";

import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import type { Address } from "viem";
import { useConfig, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { MONAD_GALLERY_NFT_ABI } from "@/lib/abi/monadGalleryNft";
import { NFT_CONTRACT_ADDRESS } from "@/lib/monad";
import { cn } from "@/lib/utils";
import { ImageUploader } from "@/modules/upload/components/ImageUploader";
import { useWeb3 } from "@/providers/Web3Provider";

type StepStatus = "pending" | "active" | "done" | "error";

interface UploadStep {
	id: "prepare" | "r2" | "mint" | "persist";
	label: string;
	description: string;
	status: StepStatus;
}

interface UploadApiResponse {
	success: boolean;
	error?: string;
	upload?: {
		id: string;
		imageUrl: string;
		metadataUrl: string;
	};
}

interface ConfirmApiResponse {
	success: boolean;
	error?: string;
}

const STEP_BLUEPRINT: Array<Omit<UploadStep, "status">> = [
	{
		id: "prepare",
		label: "데이터 준비",
		description: "지갑 세션과 메타데이터를 정리합니다.",
	},
	{
		id: "r2",
		label: "Cloudflare R2",
		description: "원본 이미지를 R2 스토리지에 업로드합니다.",
	},
	{
		id: "mint",
		label: "NFT 민팅",
		description: "Monad Testnet에 민팅 트랜잭션을 전송합니다.",
	},
	{
		id: "persist",
		label: "갤러리 반영",
		description: "D1 DB와 갤러리에 작품을 추가합니다.",
	},
];

const STEP_STYLES: Record<StepStatus, string> = {
	pending: "border-gray-800 bg-black/20 text-gray-400",
	active:
		"border-purple-500/60 bg-purple-500/10 text-white shadow-lg shadow-purple-500/20",
	done: "border-emerald-500/60 bg-emerald-500/10 text-white",
	error: "border-red-500/60 bg-red-500/10 text-white",
};

const STATUS_LABEL: Record<StepStatus, string> = {
	pending: "대기 중",
	active: "진행 중",
	done: "완료",
	error: "오류",
};

const createStepState = (): UploadStep[] =>
	STEP_BLUEPRINT.map((step) => ({ ...step, status: "pending" as StepStatus }));

export default function UploadPage() {
	const router = useRouter();
	const { account, isConnected, connect } = useWeb3();
	const { writeContractAsync } = useWriteContract();
	const wagmiConfig = useConfig();
	const [selectedImage, setSelectedImage] = useState<File | null>(null);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [isUploading, setIsUploading] = useState(false);
	const [steps, setSteps] = useState<UploadStep[]>(() => createStepState());

	const isSubmitDisabled = !selectedImage || !isConnected || isUploading;

	const resetSteps = () => {
		setSteps(createStepState());
	};

	const setStepStatus = (id: UploadStep["id"], status: StepStatus) => {
		setSteps((prev) =>
			prev.map((step) => (step.id === id ? { ...step, status } : step)),
		);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!selectedImage) {
			toast.error("이미지를 선택해주세요");
			return;
		}

		if (!isConnected || !account) {
			toast.error("업로드 전 지갑을 연결해주세요.");
			await connect();
			return;
		}

		if (!NFT_CONTRACT_ADDRESS) {
			toast.error("NFT 컨트랙트 주소가 설정되지 않았습니다.");
			return;
		}

		const trimmedTitle = title.trim();
		const trimmedDescription = description.trim();
		const formData = new FormData();
		formData.append("walletAddress", account);
		formData.append("file", selectedImage);
		if (trimmedTitle) {
			formData.append("title", trimmedTitle);
		}
		if (trimmedDescription) {
			formData.append("description", trimmedDescription);
		}

		setIsUploading(true);
		resetSteps();
		setStepStatus("prepare", "active");

		let mintHash: `0x${string}` | null = null;

		try {
			setStepStatus("r2", "active");
			const response = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});
			const payload = (await response.json().catch(
				() => null,
			)) as UploadApiResponse | null;

			if (!response.ok || !payload?.success) {
				setStepStatus("prepare", "error");
				setStepStatus("r2", "error");
				throw new Error(
					payload?.error ||
						"업로드 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
				);
			}

			setStepStatus("prepare", "done");
			setStepStatus("r2", "done");

			const uploadResult = payload.upload;
			if (!uploadResult) {
				throw new Error("업로드 결과를 확인할 수 없습니다. 다시 시도해주세요.");
			}

			const metadataInput = {
				title: trimmedTitle,
				description: trimmedDescription,
				mediaUrl: uploadResult.imageUrl,
				metadataUrl: uploadResult.metadataUrl,
			};

			setStepStatus("mint", "active");
			try {
				mintHash = await writeContractAsync({
					abi: MONAD_GALLERY_NFT_ABI,
					address: NFT_CONTRACT_ADDRESS as Address,
					functionName: "mintWithMetadata",
					args: [metadataInput],
					account: account as `0x${string}`,
				});

				await waitForTransactionReceipt(wagmiConfig, { hash: mintHash });
				setStepStatus("mint", "done");
			} catch (mintError) {
				setStepStatus("mint", "error");
				throw mintError;
			}

			if (!mintHash) {
				throw new Error("민팅 트랜잭션을 확인할 수 없습니다.");
			}

			setStepStatus("persist", "active");
			try {
				const confirmResponse = await fetch("/api/upload/confirm", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						imageId: uploadResult.id,
						transactionHash: mintHash,
					}),
				});
				const confirmPayload = (await confirmResponse.json().catch(
					() => null,
				)) as ConfirmApiResponse | null;

				if (!confirmResponse.ok || !confirmPayload?.success) {
					throw new Error(
						confirmPayload?.error ||
							"민팅 정보 저장에 실패했습니다. 잠시 후 다시 시도해주세요.",
					);
				}
				setStepStatus("persist", "done");
			} catch (persistError) {
				setStepStatus("persist", "error");
				throw persistError;
			}

			toast.success("업로드가 완료되었습니다. 갤러리에서 작품을 확인해보세요!");
			router.push("/");
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "업로드에 실패했습니다. 다시 시도해주세요.";
			toast.error(message);
		} finally {
			setIsUploading(false);
		}
	};

	const statusIcon = useMemo(() => {
		return (status: StepStatus) => {
			if (status === "done") {
				return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
			}
			if (status === "error") {
				return <AlertTriangle className="w-5 h-5 text-red-400" />;
			}
			if (status === "active") {
				return <Loader2 className="w-5 h-5 text-purple-300 animate-spin" />;
			}
			return <div className="w-3 h-3 rounded-full bg-gray-600" />;
		};
	}, []);

	return (
		<div className="min-h-screen gradient-bg">
			<div className="container mx-auto px-4 py-12">
				{/* Header */}
				<div className="mb-8">
					<Link
						href="/"
						className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
					>
						<ArrowLeft className="w-4 h-4" />
						<span>홈으로 돌아가기</span>
					</Link>
					<h1 className="text-4xl font-bold text-white mb-2">
						추억을 NFT로 영원히
					</h1>
					<p className="text-gray-400">
						이벤트 사진을 업로드하고 블록체인에 기록하세요
					</p>
				</div>

				{!isConnected && (
					<div className="glass-card border border-amber-500/40 p-4 mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<div>
							<p className="text-white font-semibold mb-1">
								지갑을 연결해야 업로드할 수 있습니다.
							</p>
							<p className="text-sm text-amber-200/80">
								MetaMask 또는 다른 EVM 지갑을 연결해 업로드 권한을 활성화하세요.
							</p>
						</div>
						<button
							type="button"
							onClick={connect}
							className="primary-button w-full md:w-auto"
						>
							지갑 연결하기
						</button>
					</div>
				)}

				{/* Upload Form */}
				<form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
					<ImageUploader
						onImageSelect={setSelectedImage}
						selectedImage={selectedImage}
						onClear={() => setSelectedImage(null)}
					/>

					{/* Title Input */}
					<div>
						<label
							htmlFor="title"
							className="block text-sm font-medium text-gray-300 mb-2"
						>
							제목 (선택)
						</label>
						<input
							type="text"
							id="title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="예: 모나드 밋업 2024"
							className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
						/>
					</div>

					{/* Description Input */}
					<div>
						<label
							htmlFor="description"
							className="block text-sm font-medium text-gray-300 mb-2"
						>
							설명
						</label>
						<textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="이 순간에 대해 설명해주세요..."
							rows={4}
							className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
						/>
					</div>

					{/* Upload Steps */}
					<div className="glass-card p-6 space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="text-white text-lg font-semibold">
								업로드 진행 상태
							</h3>
							{isUploading && (
								<span className="text-sm text-purple-200">
									실시간으로 R2 업로드와 민팅을 진행 중입니다...
								</span>
							)}
						</div>
						<div className="grid gap-4 md:grid-cols-2">
							{steps.map((step) => (
								<div
									key={step.id}
									className={cn(
										"rounded-2xl border p-4 transition-all",
										STEP_STYLES[step.status],
									)}
								>
									<div className="flex items-center gap-3 mb-2">
										{statusIcon(step.status)}
										<div>
											<p className="text-sm font-semibold">{step.label}</p>
											<p className="text-xs text-gray-300">
												{STATUS_LABEL[step.status]}
											</p>
										</div>
									</div>
									<p className="text-xs text-gray-400">{step.description}</p>
								</div>
							))}
						</div>
					</div>

					{/* Submit Button */}
					<button
						type="submit"
						disabled={isSubmitDisabled}
						className="w-full primary-button disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
					>
						{isUploading ? (
							<>
								<Loader2 className="w-5 h-5 animate-spin" />
								<span>업로드 & 민팅 중...</span>
							</>
						) : (
							<span>업로드 & NFT 민팅</span>
						)}
					</button>

					<p className="text-sm text-gray-500 text-center">
						업로드된 이미지는 Monad Testnet에 NFT로 민팅되며, 이 과정은 되돌릴
						수 없습니다.
					</p>
				</form>
			</div>
		</div>
	);
}
