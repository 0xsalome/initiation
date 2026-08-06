# フェーズ0: 技術検証(スパイク)実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** リスクの高い4要素(SIWE 認証 / Polygon 切替+トークン追加 / さくらの AI Engine / DB 候補比較)がひとつのプロトタイプ上でつながることを確認する。

**Architecture:** Next.js(App Router)のモノリス上に、ウォレット接続〜SIWE 認証〜shiniri 相当のウォレットセットアップを1ページで通すプロトタイプを作る。AI Engine と DB は独立スパイクとして検証し、結果を `docs/decisions.md` に記録する。プロトタイプは「捨ててよい」前提だが、SIWE 検証ロジックなどフェーズ1に持ち越す純粋ロジックにはテストを書く。

**Tech Stack:** Next.js 15(App Router)/ TypeScript(strict)/ wagmi v2 + viem / siwe / iron-session / Vitest

## Global Constraints

- Node.js / パッケージ管理は mise 経由(`mise exec -- npm <cmd>` で解決できること)。パッケージマネージャは npm。
- チェーンは Polygon(chainId 137)。HENKAKU トークンのコントラクトアドレス・symbol・decimals は環境変数で注入し、コードにハードコードしない。
- SIWE の nonce はサーバー発行の一回限り。domain / URI / chainId / アドレスをサーバーで検証する。
- セッション Cookie は HttpOnly / Secure / SameSite=Lax。
- `wallet_watchAsset` の成否を認証や完了条件にしない(補助情報として扱う)。
- シークレット(セッションパスワード、AI Engine の API キー、Supabase キー)は `.env.local` に置き、コミットしない。`.env.example` に変数名のみ記載する。
- ウォレット実機フロー(MetaMask 操作)はユニットテスト対象外とし、本計画内の手動検証チェックリストで確認する。純粋ロジック(SIWE 検証・設定値組み立て)はテストを書く。
- 各スパイクの結論(選定・却下・未確定)は `docs/decisions.md` に日付付きで記録する。

## 決定事項(この計画で固定する前提)

- セッションは iron-session(Cookie ベース)。フェーズ1でもそのまま使う想定。
- DB 第一候補は Supabase(ホスト付き PostgreSQL + migration CLI)。Task 6 の比較で覆った場合は `docs/decisions.md` に理由を書き、フェーズ1計画の該当箇所を差し替える。
- Google Spreadsheet は主 DB 候補からは外す方向で検証する(同時更新・migration・型の弱さ)。ただし管理用エクスポート先としての適性は Task 6 で確認する。

---

### Task 1: プロジェクト scaffold と Vitest セットアップ

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`(create-next-app 生成物)
- Create: `vitest.config.ts`
- Create: `.env.example`
- Create: `AGENTS.md`
- Test: `lib/__tests__/smoke.test.ts`

**Interfaces:**
- Consumes: なし(初回タスク)
- Produces: `npm run dev` / `npm test` が動くリポジトリ。以降の全タスクの土台。

- [x] **Step 1: create-next-app でリポジトリ直下に scaffold する**

```bash
cd /Users/masumi/tmp/initiation
mise exec -- npx create-next-app@latest . --typescript --app --eslint --no-tailwind --no-src-dir --import-alias "@/*" --use-npm
```

既存の `docs/` はそのまま残す(create-next-app は非空ディレクトリで確認を求めた場合は上書きせず続行を選ぶ。失敗する場合は一時ディレクトリに生成してから `docs/` 以外を移動する)。

- [x] **Step 2: Vitest を導入する**

```bash
mise exec -- npm install -D vitest @vitest/coverage-v8
```

`vitest.config.ts`:

```ts
// ABOUTME: Vitest 設定。Node 環境でサーバーサイドロジックをテストする。
// ABOUTME: ブラウザ/ウォレット依存のフローはテスト対象外(手動検証)。
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/__tests__/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname) },
  },
});
```

`package.json` の scripts に追加: `"test": "vitest run"`

- [x] **Step 3: スモークテストを書き、実行して通ることを確認する**

`lib/__tests__/smoke.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("runs vitest", () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `mise exec -- npm test`
Expected: PASS(1 test)

- [x] **Step 4: `.env.example` と `AGENTS.md` を作る**

`.env.example`:

```bash
# セッション暗号化用 32 文字以上のランダム文字列
SESSION_PASSWORD=
# さくらの AI Engine
SAKURA_AI_API_KEY=
SAKURA_AI_BASE_URL=
# Supabase(Task 6 で使用)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
# HENKAKU トークン(Polygon)
NEXT_PUBLIC_HENKAKU_TOKEN_ADDRESS=
NEXT_PUBLIC_HENKAKU_TOKEN_SYMBOL=HENKAKU
NEXT_PUBLIC_HENKAKU_TOKEN_DECIMALS=18
NEXT_PUBLIC_HENKAKU_TOKEN_LOGO_URL=
```

`AGENTS.md`(最初は短く):

```markdown
# AGENTS.md

HENKAKU Initiation。docs/development-plan.md が全体計画、docs/superpowers/plans/ が実装計画。

- Node/npm は mise 経由: `mise exec -- npm <cmd>`
- テスト: `mise exec -- npm test`(Vitest)
- 環境変数は .env.local(コミット禁止)。変数名一覧は .env.example
- 決定事項は docs/decisions.md に記録
```

- [x] **Step 5: dev サーバーが起動することを確認してコミット**

Run: `mise exec -- npm run dev` を起動し、`http://localhost:3000` が 200 を返すことを確認して停止。

```bash
git add -A
git commit -m "chore: scaffold Next.js app with Vitest"
```

---

### Task 2: ウォレット接続(wagmi v2 + MetaMask)

**Files:**
- Create: `lib/wagmi.ts`
- Create: `app/providers.tsx`
- Modify: `app/layout.tsx`
- Create: `components/ConnectWallet.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: Task 1 の scaffold
- Produces: `lib/wagmi.ts` の `export const wagmiConfig`(chains: `[polygon]`、connector: `injected()`)。Task 3・4 のフックはこの config 上で動く。`<ConnectWallet />` は接続済みのとき `useAccount()` のアドレスを表示する。

- [ ] **Step 1: 依存を追加する**

```bash
mise exec -- npm install wagmi viem @tanstack/react-query
```

- [ ] **Step 2: wagmi config と Provider を実装する**

`lib/wagmi.ts`:

```ts
// ABOUTME: wagmi v2 の共有設定。Polygon 単一チェーン + injected(MetaMask 基準)。
import { http, createConfig } from "wagmi";
import { polygon } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [polygon],
  connectors: [injected()],
  transports: { [polygon.id]: http() },
});
```

`app/providers.tsx`:

```tsx
// ABOUTME: wagmi + react-query の Client Provider。layout から全ページに適用する。
"use client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wagmi";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
```

`app/layout.tsx` の `<body>` 直下を `<Providers>{children}</Providers>` で包む。

- [ ] **Step 3: 接続コンポーネントを実装してページに置く**

`components/ConnectWallet.tsx`:

```tsx
// ABOUTME: MetaMask(injected)接続ボタン。接続拒否は復帰可能なエラーとして表示する。
"use client";
import { useAccount, useConnect, useDisconnect } from "wagmi";

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, error } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div>
        <p data-testid="address">{address}</p>
        <button onClick={() => disconnect()}>切断</button>
      </div>
    );
  }
  return (
    <div>
      <button onClick={() => connect({ connector: connectors[0] })}>
        ウォレットを接続
      </button>
      {error && <p role="alert">接続できませんでした: {error.message}</p>}
    </div>
  );
}
```

`app/page.tsx` を `<ConnectWallet />` を置くだけのページに置き換える。

- [ ] **Step 4: 手動検証**

`mise exec -- npm run dev` で確認:
- MetaMask あり: 接続 → アドレス表示 → 切断が動く
- MetaMask のダイアログで「拒否」→ エラーメッセージが出て、再度ボタンを押せば復帰できる

- [ ] **Step 5: コミット**

```bash
git add -A
git commit -m "feat: wallet connection with wagmi v2 injected connector"
```

---

### Task 3: SIWE 認証(nonce 発行・署名検証・セッション)

**Files:**
- Create: `lib/session.ts`
- Create: `lib/siwe.ts`
- Create: `app/api/auth/nonce/route.ts`
- Create: `app/api/auth/verify/route.ts`
- Create: `app/api/auth/logout/route.ts`
- Create: `app/api/auth/me/route.ts`
- Create: `components/SignInWithEthereum.tsx`
- Modify: `app/page.tsx`
- Test: `lib/__tests__/siwe.test.ts`

**Interfaces:**
- Consumes: Task 2 の `wagmiConfig`、`useAccount` / `useSignMessage`
- Produces:
  - `lib/session.ts`: `type SessionData = { address?: \`0x${string}\`; chainId?: number; nonce?: string }` と `getSession(): Promise<IronSession<SessionData>>`
  - `lib/siwe.ts`: `verifySiweMessage(params: { message: string; signature: \`0x${string}\`; expectedNonce: string; expectedDomain: string; expectedChainId: number }): Promise<{ ok: true; address: \`0x${string}\` } | { ok: false; reason: string }>`
  - API: `GET /api/auth/nonce` → `{ nonce }` / `POST /api/auth/verify` → 200 or 401 / `POST /api/auth/logout` / `GET /api/auth/me` → `{ address }` or 401

- [ ] **Step 1: 依存を追加する**

```bash
mise exec -- npm install siwe iron-session
```

- [ ] **Step 2: SIWE 検証ロジックの失敗するテストを書く**

viem でテスト用秘密鍵から実署名を作り、本物の署名検証を通す。

`lib/__tests__/siwe.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { SiweMessage } from "siwe";
import { verifySiweMessage } from "@/lib/siwe";

const DOMAIN = "localhost:3000";
const CHAIN_ID = 137;

async function buildSignedMessage(overrides: Partial<{ nonce: string; domain: string; chainId: number }> = {}) {
  const pk = generatePrivateKey();
  const account = privateKeyToAccount(pk);
  const message = new SiweMessage({
    domain: overrides.domain ?? DOMAIN,
    address: account.address,
    statement: "Sign in to HENKAKU Initiation",
    uri: `http://${overrides.domain ?? DOMAIN}`,
    version: "1",
    chainId: overrides.chainId ?? CHAIN_ID,
    nonce: overrides.nonce ?? "abcdefgh12345678",
  }).prepareMessage();
  const signature = await account.signMessage({ message });
  return { message, signature, address: account.address };
}

describe("verifySiweMessage", () => {
  it("accepts a valid message signed by the address", async () => {
    const { message, signature, address } = await buildSignedMessage();
    const result = await verifySiweMessage({
      message, signature,
      expectedNonce: "abcdefgh12345678",
      expectedDomain: DOMAIN,
      expectedChainId: CHAIN_ID,
    });
    expect(result).toEqual({ ok: true, address });
  });

  it("rejects a nonce mismatch", async () => {
    const { message, signature } = await buildSignedMessage();
    const result = await verifySiweMessage({
      message, signature,
      expectedNonce: "differentnonce00",
      expectedDomain: DOMAIN,
      expectedChainId: CHAIN_ID,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a domain mismatch", async () => {
    const { message, signature } = await buildSignedMessage({ domain: "evil.example.com" });
    const result = await verifySiweMessage({
      message, signature,
      expectedNonce: "abcdefgh12345678",
      expectedDomain: DOMAIN,
      expectedChainId: CHAIN_ID,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a chainId mismatch", async () => {
    const { message, signature } = await buildSignedMessage({ chainId: 1 });
    const result = await verifySiweMessage({
      message, signature,
      expectedNonce: "abcdefgh12345678",
      expectedDomain: DOMAIN,
      expectedChainId: CHAIN_ID,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a tampered signature", async () => {
    const { message } = await buildSignedMessage();
    const result = await verifySiweMessage({
      message,
      signature: ("0x" + "ab".repeat(65)) as `0x${string}`,
      expectedNonce: "abcdefgh12345678",
      expectedDomain: DOMAIN,
      expectedChainId: CHAIN_ID,
    });
    expect(result.ok).toBe(false);
  });
});
```

- [ ] **Step 3: テストが失敗することを確認する**

Run: `mise exec -- npm test`
Expected: FAIL(`@/lib/siwe` が存在しない)

- [ ] **Step 4: `lib/siwe.ts` を実装する**

```ts
// ABOUTME: SIWE メッセージ検証。nonce / domain / chainId / 署名をサーバー側で確認する。
// ABOUTME: 有効期限は SiweMessage の expirationTime があれば siwe ライブラリが検証する。
import { SiweMessage } from "siwe";

type VerifyParams = {
  message: string;
  signature: `0x${string}`;
  expectedNonce: string;
  expectedDomain: string;
  expectedChainId: number;
};

export async function verifySiweMessage(
  params: VerifyParams
): Promise<{ ok: true; address: `0x${string}` } | { ok: false; reason: string }> {
  let siwe: SiweMessage;
  try {
    siwe = new SiweMessage(params.message);
  } catch {
    return { ok: false, reason: "malformed message" };
  }
  if (siwe.chainId !== params.expectedChainId) {
    return { ok: false, reason: "chainId mismatch" };
  }
  const result = await siwe
    .verify({
      signature: params.signature,
      nonce: params.expectedNonce,
      domain: params.expectedDomain,
    })
    .catch((e) => ({ success: false as const, error: e }));
  if (!result.success) {
    return { ok: false, reason: "verification failed" };
  }
  return { ok: true, address: siwe.address as `0x${string}` };
}
```

- [ ] **Step 5: テストが通ることを確認する**

Run: `mise exec -- npm test`
Expected: PASS(5 tests)

- [ ] **Step 6: セッションと API ルートを実装する**

`lib/session.ts`:

```ts
// ABOUTME: iron-session による Cookie セッション。nonce と認証済みアドレスを保持する。
import { getIronSession, type IronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type SessionData = {
  address?: `0x${string}`;
  chainId?: number;
  nonce?: string;
};

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_PASSWORD!,
  cookieName: "initiation_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}
```

`app/api/auth/nonce/route.ts`:

```ts
import { generateNonce } from "siwe";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  session.nonce = generateNonce();
  await session.save();
  return Response.json({ nonce: session.nonce });
}
```

`app/api/auth/verify/route.ts`:

```ts
import { getSession } from "@/lib/session";
import { verifySiweMessage } from "@/lib/siwe";
import { polygon } from "wagmi/chains";

export async function POST(request: Request) {
  const session = await getSession();
  const { message, signature } = await request.json();
  if (!session.nonce) {
    return Response.json({ error: "nonce not issued" }, { status: 401 });
  }
  const host = request.headers.get("host") ?? "";
  const result = await verifySiweMessage({
    message,
    signature,
    expectedNonce: session.nonce,
    expectedDomain: host,
    expectedChainId: polygon.id,
  });
  session.nonce = undefined; // nonce は一回限り
  if (!result.ok) {
    await session.save();
    return Response.json({ error: result.reason }, { status: 401 });
  }
  session.address = result.address;
  session.chainId = polygon.id;
  await session.save();
  return Response.json({ address: result.address });
}
```

`app/api/auth/logout/route.ts`:

```ts
import { getSession } from "@/lib/session";

export async function POST() {
  const session = await getSession();
  session.destroy();
  return Response.json({ ok: true });
}
```

`app/api/auth/me/route.ts`:

```ts
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.address) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  return Response.json({ address: session.address });
}
```

- [ ] **Step 7: サインインコンポーネントを実装する**

`components/SignInWithEthereum.tsx`:

```tsx
// ABOUTME: SIWE サインイン。アカウント/チェーン変更を検知したらサーバーセッションを破棄する。
"use client";
import { useEffect, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { SiweMessage } from "siwe";
import { polygon } from "wagmi/chains";

export function SignInWithEthereum() {
  const { address, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [signedInAs, setSignedInAs] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // アカウント変更・チェーン変更時はセッション無効化
  useEffect(() => {
    if (signedInAs && (address !== signedInAs || chainId !== polygon.id)) {
      fetch("/api/auth/logout", { method: "POST" });
      setSignedInAs(null);
    }
  }, [address, chainId, signedInAs]);

  async function signIn() {
    setError(null);
    try {
      const { nonce } = await (await fetch("/api/auth/nonce")).json();
      const message = new SiweMessage({
        domain: window.location.host,
        address: address!,
        statement: "Sign in to HENKAKU Initiation",
        uri: window.location.origin,
        version: "1",
        chainId: polygon.id,
        nonce,
        expirationTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      }).prepareMessage();
      const signature = await signMessageAsync({ message });
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, signature }),
      });
      if (!res.ok) throw new Error("サーバー検証に失敗しました");
      setSignedInAs(address!);
    } catch (e) {
      setError(e instanceof Error ? e.message : "署名がキャンセルされました");
    }
  }

  if (!address) return null;
  if (signedInAs) return <p>サインイン済み: {signedInAs}</p>;
  return (
    <div>
      <button onClick={signIn}>署名してサインイン</button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
```

`app/page.tsx` に `<SignInWithEthereum />` を追加する。

- [ ] **Step 8: 手動検証**

- 接続 → 署名 → 「サインイン済み」表示、`GET /api/auth/me` が 200 を返す
- 署名ダイアログで「拒否」→ エラー表示 → 再試行で復帰できる
- MetaMask でアカウントを切り替える → サインイン状態が解除され `me` が 401 になる
- チェーンを Polygon 以外に切り替える → 同様に解除される

- [ ] **Step 9: コミット**

```bash
git add -A
git commit -m "feat: SIWE authentication with iron-session"
```

---

### Task 4: Polygon 切替 + トークン追加(shiniri 相当)

**Files:**
- Create: `lib/henkakuToken.ts`
- Create: `components/WalletSetup.tsx`
- Modify: `app/page.tsx`
- Test: `lib/__tests__/henkakuToken.test.ts`

**Interfaces:**
- Consumes: Task 2 の `wagmiConfig`、`useSwitchChain` / `useWatchAsset`(wagmi v2)
- Produces: `lib/henkakuToken.ts` の `henkakuTokenConfig(): { address: \`0x${string}\`; symbol: string; decimals: number; image?: string }`(env から組み立て、必須値欠落時は throw)。`<WalletSetup />` は「接続→切替→追加」の3ステップ UI。フェーズ1 Task 5 が同じ構成で本実装する。

- [ ] **Step 1: トークン設定の失敗するテストを書く**

`lib/__tests__/henkakuToken.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { henkakuTokenConfig } from "@/lib/henkakuToken";

describe("henkakuTokenConfig", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_HENKAKU_TOKEN_ADDRESS = "0x1234567890123456789012345678901234567890";
    process.env.NEXT_PUBLIC_HENKAKU_TOKEN_SYMBOL = "HENKAKU";
    process.env.NEXT_PUBLIC_HENKAKU_TOKEN_DECIMALS = "18";
  });

  it("builds config from env vars", () => {
    expect(henkakuTokenConfig()).toEqual({
      address: "0x1234567890123456789012345678901234567890",
      symbol: "HENKAKU",
      decimals: 18,
      image: undefined,
    });
  });

  it("throws when address is missing", () => {
    delete process.env.NEXT_PUBLIC_HENKAKU_TOKEN_ADDRESS;
    expect(() => henkakuTokenConfig()).toThrow(/HENKAKU_TOKEN_ADDRESS/);
  });

  it("throws when address is not a hex address", () => {
    process.env.NEXT_PUBLIC_HENKAKU_TOKEN_ADDRESS = "not-an-address";
    expect(() => henkakuTokenConfig()).toThrow(/address/i);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `mise exec -- npm test`
Expected: FAIL(`@/lib/henkakuToken` が存在しない)

- [ ] **Step 3: `lib/henkakuToken.ts` を実装する**

```ts
// ABOUTME: HENKAKU トークン(ERC20 / Polygon)の設定値。env から読み、起動時に検証する。
import { isAddress } from "viem";

export function henkakuTokenConfig() {
  const address = process.env.NEXT_PUBLIC_HENKAKU_TOKEN_ADDRESS;
  if (!address) throw new Error("NEXT_PUBLIC_HENKAKU_TOKEN_ADDRESS is required");
  if (!isAddress(address)) throw new Error(`invalid token address: ${address}`);
  return {
    address: address as `0x${string}`,
    symbol: process.env.NEXT_PUBLIC_HENKAKU_TOKEN_SYMBOL ?? "HENKAKU",
    decimals: Number(process.env.NEXT_PUBLIC_HENKAKU_TOKEN_DECIMALS ?? "18"),
    image: process.env.NEXT_PUBLIC_HENKAKU_TOKEN_LOGO_URL || undefined,
  };
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `mise exec -- npm test`
Expected: PASS

- [ ] **Step 5: `WalletSetup` コンポーネントを実装する**

wagmi v2 の `useSwitchChain` は対象チェーンが未登録なら内部で `wallet_addEthereumChain` にフォールバックする。拒否はすべて復帰可能エラーとして表示する。

`components/WalletSetup.tsx`:

```tsx
// ABOUTME: shiniri 相当のウォレットセットアップ: Polygon 切替 → HENKAKU トークン追加。
// ABOUTME: watchAsset の成否は表示の補助情報であり、完了条件にしない。
"use client";
import { useAccount, useSwitchChain, useWatchAsset } from "wagmi";
import { polygon } from "wagmi/chains";
import { henkakuTokenConfig } from "@/lib/henkakuToken";

export function WalletSetup() {
  const { chainId, isConnected } = useAccount();
  const { switchChain, error: switchError, isPending: switching } = useSwitchChain();
  const { watchAsset, data: watched, error: watchError, isPending: watching } = useWatchAsset();
  const token = henkakuTokenConfig();
  const onPolygon = chainId === polygon.id;

  if (!isConnected) return null;
  return (
    <ol>
      <li>
        {onPolygon ? (
          "Polygon に接続済み"
        ) : (
          <button disabled={switching} onClick={() => switchChain({ chainId: polygon.id })}>
            Polygon に切り替える
          </button>
        )}
        {switchError && <p role="alert">切り替えできませんでした。もう一度お試しください。</p>}
      </li>
      <li>
        <button
          disabled={!onPolygon || watching}
          onClick={() =>
            watchAsset({
              type: "ERC20",
              options: {
                address: token.address,
                symbol: token.symbol,
                decimals: token.decimals,
                image: token.image,
              },
            })
          }
        >
          HENKAKU トークンをウォレットに追加
        </button>
        {watched && <p>追加リクエストを送りました(表示されない場合も進行に影響はありません)</p>}
        {watchError && <p role="alert">追加できませんでした。スキップしても構いません。</p>}
      </li>
    </ol>
  );
}
```

`app/page.tsx` に `<WalletSetup />` を追加する。

- [ ] **Step 6: 手動検証(復帰パス含む)**

- Polygon 未選択の状態で「切り替える」→ MetaMask の切替ダイアログ → 承認で切替完了
- 切替ダイアログで「拒否」→ エラー表示 → 再試行で復帰
- MetaMask から Polygon ネットワークを削除した状態で「切り替える」→ `wallet_addEthereumChain` のダイアログが出て追加+切替できる
- 「トークンを追加」→ MetaMask に HENKAKU が表示される
- 追加ダイアログで「拒否」→ エラー表示のみで、他のステップは進行できる

- [ ] **Step 7: コミット**

```bash
git add -A
git commit -m "feat: Polygon switch and HENKAKU token watchAsset (shiniri equivalent)"
```

---

### Task 5: さくらの AI Engine スパイク

**Files:**
- Create: `scripts/sakura-ai-spike.ts`
- Create: `docs/decisions.md`(このタスクで新規作成、Task 6 でも追記)

**Interfaces:**
- Consumes: `.env.local` の `SAKURA_AI_API_KEY` / `SAKURA_AI_BASE_URL`(要取得: さくらのクラウドでキー発行。ここは人の作業)
- Produces: API 呼び出し可否・利用量取得可否の事実を `docs/decisions.md` に記録。フェーズ3計画の入力になる。

- [ ] **Step 1: 公式ドキュメントでエンドポイント仕様を確認する**

さくらの AI Engine のドキュメントで、(1) chat completions のエンドポイント URL と認証ヘッダ形式、(2) 利用量・残枠を取得する API の有無、(3) 無料枠/上限の単位(リクエスト数かトークン数か)を確認し、メモする。

- [ ] **Step 2: スパイクスクリプトを書く**

`scripts/sakura-ai-spike.ts`(実行: `mise exec -- npx tsx scripts/sakura-ai-spike.ts`。`tsx` は devDependency に追加):

```ts
// ABOUTME: さくらの AI Engine の疎通スパイク。chat 1 リクエストとレスポンスヘッダを観察する。
// ABOUTME: 本番コードではない。結果は docs/decisions.md に記録して捨てる。
const baseUrl = process.env.SAKURA_AI_BASE_URL;
const apiKey = process.env.SAKURA_AI_API_KEY;
if (!baseUrl || !apiKey) throw new Error("SAKURA_AI_BASE_URL / SAKURA_AI_API_KEY を .env.local に設定してください");

async function main() {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.SAKURA_AI_MODEL ?? "gpt-oss-120b",
      messages: [{ role: "user", content: "HENKAKU コミュニティについて一文で説明して" }],
      max_tokens: 100,
    }),
  });
  console.log("status:", res.status);
  // レート制限・利用量系ヘッダの有無を観察する(値はログに残しすぎない)
  for (const name of ["x-ratelimit-remaining", "x-ratelimit-limit", "retry-after"]) {
    console.log(name, ":", res.headers.get(name));
  }
  const body = await res.json();
  console.log("usage:", JSON.stringify(body.usage));
  console.log("content:", body.choices?.[0]?.message?.content);
}
main();
```

Step 1 で確認した実際のエンドポイント・モデル名に合わせて修正して実行する。

- [ ] **Step 3: 検証項目を実行して記録する**

確認すること:
- API キーで chat completions が成功するか(status 200、content が返る)
- レスポンスの `usage`(prompt/completion tokens)が取れるか
- 利用量・残枠を API またはコンソールで確認できるか
- 上限到達時の挙動(429 か、課金継続か)がドキュメント上どうなっているか

`docs/decisions.md` を作成して記録する:

```markdown
# 決定事項ログ

## 2026-XX-XX さくらの AI Engine スパイク結果

- 疎通: (成功/失敗と条件)
- 利用量の取得方法: (usage フィールド / ヘッダ / コンソールのどれで取れるか)
- 上限の単位と超過時挙動: (確認できた事実)
- フェーズ3への引き継ぎ: (未決定として残る点)
```

- [ ] **Step 4: コミット**

```bash
git add scripts/sakura-ai-spike.ts docs/decisions.md package.json package-lock.json
git commit -m "spike: sakura AI Engine connectivity and usage observation"
```

---

### Task 6: DB 候補比較と選定

**Files:**
- Modify: `docs/decisions.md`
- Create: `supabase/migrations/00000000000000_spike.sql`(Supabase 検証用。採用時はフェーズ1で正式 migration に置き換える)
- Create: `scripts/db-spike.ts`

**Interfaces:**
- Consumes: Task 5 で作った `docs/decisions.md`
- Produces: DB 選定の決定(第一候補: Supabase)。フェーズ1計画の Task 1(スキーマ)・Task 2(Repository)の前提。

- [ ] **Step 1: Supabase プロジェクトを作り、migration を1本流す**

```bash
mise exec -- npx supabase init
mise exec -- npx supabase start   # ローカル(Docker)で起動
```

`supabase/migrations/00000000000000_spike.sql`:

```sql
create table spike_members (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null unique,
  created_at timestamptz not null default now()
);
```

```bash
mise exec -- npx supabase db reset   # migration が適用されることを確認
```

- [ ] **Step 2: 接続・同時更新スパイクを実行する**

`scripts/db-spike.ts`(`@supabase/supabase-js` を devDependency に追加):

```ts
// ABOUTME: Supabase 接続と unique 制約の同時 insert 挙動を確認するスパイク。
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const address = "0x" + "11".repeat(20);
  // 同一アドレスを並行 insert → 片方が unique violation になることを確認
  const results = await Promise.allSettled([
    supabase.from("spike_members").insert({ wallet_address: address }),
    supabase.from("spike_members").insert({ wallet_address: address }),
  ]);
  for (const r of results) console.log(JSON.stringify(r).slice(0, 200));
  const { count } = await supabase.from("spike_members").select("*", { count: "exact", head: true });
  console.log("rows:", count); // 1 であること
}
main();
```

Run: `mise exec -- npx tsx scripts/db-spike.ts`
Expected: 片方は error(unique violation)、rows: 1

- [ ] **Step 3: 比較表を書いて選定する**

`docs/decisions.md` に追記。比較観点は開発計画どおり「接続 / migration / バックアップ・復旧 / 同時更新」:

```markdown
## 2026-XX-XX DB 選定

| 観点 | Supabase | Google Spreadsheet | VPS PostgreSQL |
|---|---|---|---|
| 接続 | (実測結果) | API 経由・遅延とクォータ | 要サーバー構築 |
| migration | CLI + SQL で管理可(実測) | 仕組みなし | 自前で管理 |
| バックアップ/復旧 | (プラン内容を確認して記載) | 版履歴のみ | 自前で構築 |
| 同時更新 | unique 制約で保護(実測) | 楽観的で競合しうる | 制約で保護 |

**決定**: (Supabase を採用 / しない場合はその理由)
**Spreadsheet の位置づけ**: 管理用ミラー・エクスポート先として可否を記載
**VPS**: 常時稼働要件が出た時点で再評価(開発計画どおり)
```

- [ ] **Step 4: コミット**

```bash
git add -A
git commit -m "spike: DB candidate comparison and selection"
```

---

### Task 7: 統合確認(フェーズ0完了条件)

**Files:**
- Modify: `docs/decisions.md`

**Interfaces:**
- Consumes: Task 1〜6 のすべて
- Produces: フェーズ0完了の判定。フェーズ1着手の前提。

- [ ] **Step 1: 通し確認**

`mise exec -- npm run dev` で1ページ上で以下が通ることを確認する:

1. ウォレット接続(Task 2)
2. SIWE サインイン → `/api/auth/me` 200(Task 3)
3. Polygon 切替 + トークン追加(Task 4)
4. `mise exec -- npm test` が全部 PASS

加えて Task 5(AI 疎通)・Task 6(DB 選定)の記録が `docs/decisions.md` にあること。

- [ ] **Step 2: 完了記録とフェーズ1への申し送りを書く**

`docs/decisions.md` に追記: フェーズ0完了日、プロトタイプから持ち越すもの(`lib/siwe.ts`・`lib/session.ts`・`lib/henkakuToken.ts` とそのテスト)、捨てるもの(スパイクスクリプト・spike migration)、フェーズ1計画の修正が必要な点(DB 選定が Supabase 以外になった場合など)。

- [ ] **Step 3: コミット**

```bash
git add docs/decisions.md
git commit -m "docs: phase 0 spike completion notes"
```
