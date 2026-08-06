// ABOUTME: さくらの AI Engine の疎通スパイク。chat 1 リクエストとレスポンス情報を観察する。
// ABOUTME: 本番コードではなく、API キーや応答本文を永続化しない使い捨てスクリプト。
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const configuredBaseUrl = process.env.SAKURA_AI_BASE_URL?.replace(/\/+$/, "");
const apiKey = process.env.SAKURA_AI_API_KEY;

if (!configuredBaseUrl || !apiKey) {
  throw new Error("SAKURA_AI_BASE_URL / SAKURA_AI_API_KEY を .env.local に設定してください");
}

let endpoint: string;
try {
  const baseUrl = new URL(configuredBaseUrl);
  if (baseUrl.protocol !== "http:" && baseUrl.protocol !== "https:") {
    throw new Error("unsupported protocol");
  }
  const normalizedBaseUrl = baseUrl.href.replace(/\/+$/, "");
  endpoint = normalizedBaseUrl.endsWith("/v1")
    ? `${normalizedBaseUrl}/chat/completions`
    : `${normalizedBaseUrl}/v1/chat/completions`;
} catch {
  throw new Error(
    "SAKURA_AI_BASE_URL は https://api.ai.sakura.ad.jp のような http(s) URL に設定してください",
  );
}

type ChatResponse = {
  usage?: unknown;
  choices?: Array<{
    finish_reason?: unknown;
    message?: { content?: unknown; reasoning_content?: unknown };
  }>;
};

async function main() {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.SAKURA_AI_MODEL ?? "gpt-oss-120b",
      messages: [{ role: "user", content: "HENKAKU コミュニティについて一文で説明して" }],
      max_tokens: 400,
      stream: false,
    }),
  });

  const rawBody = await response.text();
  let body: ChatResponse | null = null;
  try {
    body = JSON.parse(rawBody) as ChatResponse;
  } catch {
    // エラー本文が JSON でない場合もステータスは記録する。
  }

  const firstChoice = body?.choices?.[0];
  const message = firstChoice?.message;
  console.log("endpoint:", endpoint);
  console.log("status:", response.status);
  for (const name of ["x-ratelimit-remaining", "x-ratelimit-limit", "retry-after"]) {
    console.log(name, ":", response.headers.get(name));
  }
  console.log("usage:", JSON.stringify(body?.usage ?? null));
  console.log("finish_reason:", firstChoice?.finish_reason ?? null);
  console.log("message_keys:", Object.keys(message ?? {}).join(","));
  console.log("content:", message?.content ?? null);

  if (!response.ok && rawBody) {
    console.error("error_body:", rawBody.slice(0, 500));
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
