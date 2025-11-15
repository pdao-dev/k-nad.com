# K-nad.com Frontend Development Agents

## 프로젝트 개요
**K-nad.com**은 한국에서 열리는 오프라인 이벤트 사진들을 NFT로 업로드하여 아카이빙하는 Web3 갤러리 플랫폼입니다.

- **체인**: Monad Testnet
- **참고 디자인**: [haerin.network](https://haerin.network/)
- **백엔드**: Cloudflare Workers + D1 + R2
- **프론트엔드**: Next.js 15 + React + TailwindCSS

---

## 핵심 기능 구현

### 1. Home 화면 (Gallery View)

#### 1.1 Hero Section
```typescript
// src/app/page.tsx
// 구현 사항:
// - 프로젝트 타이틀 "k-nad.com" 대형 디스플레이
// - 이미지 업로드 버튼 (중앙 배치)
// - haerin.network 스타일의 그라데이션 배경
// - 스크롤 인디케이터
```

**UI 컴포넌트**:
- `src/components/hero/HeroSection.tsx`
- `src/components/upload/UploadButton.tsx`

**디자인 요구사항**:
- Typography: 큰 타이틀 (font-size: 4rem 이상)
- 그라데이션 배경 (haerin.network 스타일)
- Glassmorphism 효과의 업로드 버튼

---

#### 1.2 Gallery Grid
```typescript
// src/components/gallery/GalleryGrid.tsx
// 구현 사항:
// - Masonry 레이아웃 (Pinterest 스타일)
// - Infinite scroll 구현
// - 이미지 lazy loading
// - Hover 효과 (업로더 정보 미리보기)
```

**데이터 구조**:
```typescript
interface NFTImage {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
  title: string;
  description: string;
  uploader: {
    address: string;
    username?: string;
    profileImage?: string;
  };
  nftMetadata: {
    tokenId: string;
    contractAddress: string;
    mintedAt: string;
  };
  createdAt: string;
}
```

**필요한 라이브러리**:
- `react-virtuoso` (무한 스크롤)
- `react-masonry-css` (그리드 레이아웃)

---

#### 1.3 Image Detail Modal
```typescript
// src/components/gallery/ImageDetailModal.tsx
// 구현 사항:
// - 이미지 클릭 시 팝업
// - 고해상도 이미지 표시
// - 업로더 정보 (프로필 이미지 + 이름/주소)
// - 이미지 설명
// - 복사 버튼 (NFT 링크, 이미지 URL)
// - 신고 버튼
```

**UI 구성**:
```
┌─────────────────────────────────┐
│   [ Close Button ]              │
│                                 │
│   ┌───────────────────┐        │
│   │                   │        │
│   │   Image Display   │        │
│   │                   │        │
│   └───────────────────┘        │
│                                 │
│   👤 Uploader Name              │
│   0x1234...5678                │
│                                 │
│   📝 Description here...        │
│                                 │
│   [Copy Link] [Report]         │
└─────────────────────────────────┘
```

**컴포넌트**:
- `src/components/gallery/ImageDetailModal.tsx`
- `src/components/gallery/UploaderInfo.tsx`
- `src/components/gallery/ActionButtons.tsx`

---

### 2. Login 화면 (Wallet Connection)

#### 2.1 Wallet Provider Setup
```typescript
// src/providers/WalletProvider.tsx
// 지원 지갑:
// - Phantom
// - MetaMask
// - WalletConnect
```

**설치 필요한 패키지**:
```bash
pnpm add @solana/wallet-adapter-react @solana/wallet-adapter-react-ui
pnpm add @solana/wallet-adapter-wallets @solana/web3.js
pnpm add ethers # Monad는 EVM 호환
```

**주의**: Monad는 EVM 체인이므로 Ethereum 기반 지갑 연동 필요, Phantom 포함
```typescript
// MetaMask 우선 권장
```

---

#### 2.2 Login Page
```typescript
// src/app/(auth)/connect/page.tsx
// 구현 사항:
// - 지갑 선택 UI
// - 연결 상태 관리
// - 에러 핸들링
// - 네트워크 확인 (Monad Testnet)
```

**UI 디자인**:
- 지갑 아이콘 그리드
- Connect 버튼
- 네트워크 스위치 안내

**컴포넌트**:
- `src/modules/auth/components/WalletConnectButton.tsx`
- `src/modules/auth/components/WalletSelector.tsx`
- `src/modules/auth/components/NetworkSwitcher.tsx`

---

### 3. User Profile 화면

#### 3.1 Profile Setup
```typescript
// src/app/profile/page.tsx
// 구현 사항:
// - 프로필 이미지 업로드 (R2 저장)
// - 사용자 이름 설정
// - 지갑 주소 표시
// - 업로드한 NFT 목록
```

**데이터 스키마**:
```typescript
// src/db/schemas/user.schema.ts
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  walletAddress: text('wallet_address').notNull().unique(),
  username: text('username'),
  profileImage: text('profile_image'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

**컴포넌트**:
- `src/modules/profile/components/ProfileImageUploader.tsx`
- `src/modules/profile/components/ProfileForm.tsx`
- `src/modules/profile/components/UserGallery.tsx`

---

### 4. 이미지 업로드 기능

#### 4.1 Upload Flow
```
1. 홈 화면 업로드 버튼 클릭
   ↓
2. /upload 페이지로 이동
   ↓
3. 이미지 선택 + 설명 입력
   ↓
4. R2에 이미지 업로드
   ↓
5. NFT 메타데이터 생성
   ↓
6. Monad Testnet에 NFT 민팅
   ↓
7. D1에 레코드 저장
   ↓
8. 갤러리로 리다이렉트
```

---

#### 4.2 Upload Page
```typescript
// src/app/upload/page.tsx
// 구현 사항:
// - 드래그 앤 드롭 이미지 업로드
// - 이미지 프리뷰
// - 설명 입력 (Textarea)
// - 업로드 진행률 표시
// - NFT 민팅 트랜잭션 확인
```

**UI 구성**:
```
┌─────────────────────────────────┐
│   Upload Your Memory            │
│                                 │
│   ┌───────────────────┐        │
│   │   Drop Image      │        │
│   │   or Click        │        │
│   └───────────────────┘        │
│                                 │
│   📝 Description                │
│   ┌───────────────────┐        │
│   │                   │        │
│   │   [Textarea]      │        │
│   │                   │        │
│   └───────────────────┘        │
│                                 │
│   [Upload & Mint NFT]          │
└─────────────────────────────────┘
```

**컴포넌트**:
- `src/modules/upload/components/ImageUploader.tsx`
- `src/modules/upload/components/UploadProgress.tsx`
- `src/modules/upload/components/NFTMintingStatus.tsx`

---

#### 4.3 R2 Image Upload
```typescript
// src/modules/upload/actions/upload-image.action.ts
'use server';

import { r2 } from '@/lib/r2';

export async function uploadImageToR2(
  file: File,
  userId: string
): Promise<{ url: string; key: string }> {
  const key = `images/${userId}/${Date.now()}-${file.name}`;

  // R2에 업로드
  await r2.put(key, file, {
    httpMetadata: {
      contentType: file.type,
    },
  });

  const url = `${process.env.CLOUDFLARE_R2_URL}/${key}`;
  return { url, key };
}
```

---

#### 4.4 NFT Minting on Monad
```typescript
// src/modules/nft/services/monad-nft.service.ts
import { ethers } from 'ethers';

export class MonadNFTService {
  private provider: ethers.Provider;
  private contract: ethers.Contract;

  constructor() {
    // Monad Testnet RPC
    this.provider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_MONAD_RPC_URL
    );
  }

  async mintNFT(
    imageUrl: string,
    metadata: {
      title: string;
      description: string;
      uploader: string;
    }
  ) {
    // NFT 메타데이터 생성
    const tokenMetadata = {
      name: metadata.title,
      description: metadata.description,
      image: imageUrl,
      attributes: [
        { trait_type: 'Uploader', value: metadata.uploader },
        { trait_type: 'Platform', value: 'k-nad.com' },
      ],
    };

    // IPFS 또는 Arweave에 메타데이터 저장 (선택)
    const metadataUri = await this.uploadMetadata(tokenMetadata);

    // NFT 민팅
    const tx = await this.contract.mint(metadata.uploader, metadataUri);
    const receipt = await tx.wait();

    return {
      tokenId: receipt.events[0].args.tokenId,
      transactionHash: receipt.transactionHash,
    };
  }
}
```

**환경 변수**:
```env
# .dev.vars
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
```

---

#### 4.5 Database Schema for Images
```typescript
// src/db/schemas/image.schema.ts
import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const images = pgTable('images', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  title: text('title'),
  description: text('description'),
  imageUrl: text('image_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  r2Key: text('r2_key').notNull(),

  // NFT 정보
  tokenId: text('token_id'),
  contractAddress: text('contract_address'),
  transactionHash: text('transaction_hash'),
  mintedAt: timestamp('minted_at'),

  // 신고 관련
  isReported: boolean('is_reported').default(false),
  reportCount: integer('report_count').default(0),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

---

## 추가 구현 에이전트

### 5. Report 기능
```typescript
// src/modules/report/actions/report-image.action.ts
'use server';

export async function reportImage(
  imageId: string,
  reason: string,
  reporterAddress: string
) {
  // 신고 내역 저장
  // 관리자 알림 (선택)
  // 일정 신고 수 도달 시 자동 숨김 처리
}
```

---

### 6. 검색 및 필터링
```typescript
// src/components/gallery/SearchBar.tsx
// 구현 사항:
// - 업로더 주소로 검색
// - 날짜 필터
// - 정렬 옵션 (최신순, 인기순)
```

---

### 7. 공유 기능
```typescript
// src/components/gallery/ShareButton.tsx
// 구현 사항:
// - 트위터 공유
// - 디스코드 공유
// - 링크 복사
```

---

## 디자인 시스템 (haerin.network 참고)

### Color Palette
```css
/* src/app/globals.css */
:root {
  --primary: #8B5CF6; /* Purple */
  --secondary: #EC4899; /* Pink */
  --background: #0F0F0F; /* Dark */
  --surface: #1A1A1A;
  --text-primary: #FFFFFF;
  --text-secondary: #A3A3A3;
}
```

### Typography
```css
/* Headings */
.hero-title {
  font-size: 6rem;
  font-weight: 900;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Body */
.body-text {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-secondary);
}
```

### Components
```css
/* Glassmorphism Card */
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}

/* Button */
.primary-button {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  padding: 1rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  transition: transform 0.2s;
}

.primary-button:hover {
  transform: translateY(-2px);
}
```

---

## 프로젝트 구조

```
src/
├── app/
│   ├── (auth)/
│   │   └── connect/              # 지갑 연결 페이지
│   │       └── page.tsx
│   ├── upload/                   # 이미지 업로드 페이지
│   │   └── page.tsx
│   ├── profile/                  # 사용자 프로필
│   │   └── page.tsx
│   ├── gallery/[id]/            # 개별 이미지 상세
│   │   └── page.tsx
│   └── page.tsx                  # 홈 (갤러리)
│
├── components/
│   ├── hero/
│   │   └── HeroSection.tsx
│   ├── gallery/
│   │   ├── GalleryGrid.tsx
│   │   ├── ImageCard.tsx
│   │   ├── ImageDetailModal.tsx
│   │   └── SearchBar.tsx
│   ├── upload/
│   │   └── UploadButton.tsx
│   └── ui/                       # Shadcn UI components
│
├── modules/
│   ├── auth/
│   │   ├── components/
│   │   │   ├── WalletConnectButton.tsx
│   │   │   ├── WalletSelector.tsx
│   │   │   └── NetworkSwitcher.tsx
│   │   └── utils/
│   │       └── wallet-adapter.ts
│   │
│   ├── nft/
│   │   ├── services/
│   │   │   └── monad-nft.service.ts
│   │   └── actions/
│   │       └── mint-nft.action.ts
│   │
│   ├── upload/
│   │   ├── components/
│   │   │   ├── ImageUploader.tsx
│   │   │   ├── UploadProgress.tsx
│   │   │   └── NFTMintingStatus.tsx
│   │   └── actions/
│   │       ├── upload-image.action.ts
│   │       └── create-nft-record.action.ts
│   │
│   ├── profile/
│   │   ├── components/
│   │   │   ├── ProfileForm.tsx
│   │   │   ├── ProfileImageUploader.tsx
│   │   │   └── UserGallery.tsx
│   │   └── actions/
│   │       └── update-profile.action.ts
│   │
│   └── report/
│       └── actions/
│           └── report-image.action.ts
│
├── db/
│   └── schemas/
│       ├── user.schema.ts
│       └── image.schema.ts
│
├── providers/
│   └── WalletProvider.tsx
│
└── lib/
    ├── r2.ts                     # R2 업로드 유틸
    ├── monad.ts                  # Monad 체인 설정
    └── utils.ts
```

---

## 개발 순서

### Phase 1: 기본 구조
1. [ ] 프로젝트 디렉토리 구조 생성
2. [ ] 데이터베이스 스키마 작성 (users, images)
3. [ ] 환경 변수 설정
4. [ ] Monad Testnet 연결 설정

### Phase 2: 인증
1. [ ] WalletProvider 설정
2. [ ] 지갑 연결 페이지 구현
3. [ ] 네트워크 체크 기능
4. [ ] 사용자 세션 관리

### Phase 3: 프로필
1. [ ] 프로필 페이지 UI
2. [ ] 프로필 이미지 업로드 (R2)
3. [ ] 사용자 정보 저장 (D1)

### Phase 4: 갤러리
1. [ ] Home 페이지 Hero Section
2. [ ] Gallery Grid (Masonry 레이아웃)
3. [ ] Infinite Scroll
4. [ ] Image Detail Modal
5. [ ] 검색 및 필터 기능

### Phase 5: 업로드 & NFT
1. [ ] 이미지 업로드 페이지 UI
2. [ ] R2 업로드 로직
3. [ ] NFT 스마트 컨트랙트 배포
4. [ ] NFT 민팅 기능
5. [ ] D1에 NFT 정보 저장

### Phase 6: 추가 기능
1. [ ] 신고 기능
2. [ ] 공유 기능
3. [ ] 에러 핸들링
4. [ ] 로딩 상태 UI

### Phase 7: 최적화
1. [ ] 이미지 최적화 (썸네일 생성)
2. [ ] SEO 최적화
3. [ ] 성능 최적화
4. [ ] 모바일 반응형

---

## 필수 패키지 설치

```bash
# Wallet Adapters
pnpm add ethers

# Image Upload & Processing
pnpm add react-dropzone

# Masonry Layout
pnpm add react-masonry-css

# Infinite Scroll
pnpm add react-virtuoso

# Date Formatting
pnpm add date-fns

# Clipboard
pnpm add copy-to-clipboard

# Icons
pnpm add lucide-react # 이미 설치됨
```

---

## 환경 변수 설정

```env
# .dev.vars
# Cloudflare (이미 존재)
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_D1_TOKEN=your-api-token
CLOUDFLARE_R2_URL=your-r2-url

# Monad Testnet
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_MONAD_CHAIN_ID=41454
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 참고 링크

- [Monad Documentation](https://docs.monad.xyz/)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Haerin Network](https://haerin.network/)

---

## 주의사항

1. **Monad Testnet Faucet**: 테스트를 위한 토큰 필요
2. **NFT 컨트랙트**: ERC-721 표준 사용 (Monad는 EVM 호환)
3. **이미지 저장**: R2에 원본 + 썸네일 두 버전 저장 권장
4. **신고 시스템**: 악용 방지를 위한 Rate Limiting 필요
5. **지갑 연결**: Phantom은 EVM 모드로 사용, MetaMask 우선 권장

---

## 다음 단계

1. 데이터베이스 스키마 생성 및 마이그레이션
2. NFT 스마트 컨트랙트 개발 및 배포
3. 기본 UI 컴포넌트 개발 (haerin.network 스타일)
4. 지갑 연결 기능 구현
5. 갤러리 그리드 구현

---

**작성일**: 2025-01-15
**프로젝트**: K-nad.com (Monad Hackathon)
**담당**: Frontend Development
