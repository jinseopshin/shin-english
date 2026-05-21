// src/app/api/translate-sentence/route.js
// ══════════════════════════════════════════════════════════════════════════
//   Angela's English Academy — 한↔영 문장 번역 API
//   학생용 학습 문장에 적합한 번역 (자연스럽고 간결하게)
// ══════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "API 키가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const { text, direction } = body; // direction: "ko-to-en" | "en-to-ko"

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "번역할 문장을 입력해주세요." }, { status: 400 });
  }
  if (!["ko-to-en", "en-to-ko"].includes(direction)) {
    return NextResponse.json({ error: "번역 방향이 잘못되었습니다." }, { status: 400 });
  }

  const prompt = direction === "ko-to-en"
    ? `다음 한국어 문장을 자연스러운 영어 학습 문장으로 번역해주세요.

규칙:
- 한국 초중등 학생이 배우기 적절한 표현 사용
- 마침표(.), 물음표(?), 느낌표(!) 등 구두점 정확히 포함
- 단순하고 명확한 구조 (어순 학습용)
- 너무 어려운 단어/관용표현 피하기

한국어 문장: "${text.trim()}"

영어 번역 한 문장만 답해주세요 (다른 설명 없이):`
    : `다음 영어 문장을 자연스러운 한국어로 번역해주세요.

규칙:
- 초중등 학생이 이해할 수 있는 자연스러운 한국어
- 직역보다는 자연스러운 의역
- 마침표(.), 물음표(?), 느낌표(!) 등 적절히 사용
- 짧고 명확하게

영어 문장: "${text.trim()}"

한국어 번역 한 문장만 답해주세요 (다른 설명 없이):`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Anthropic API error:", res.status, errText);
      return NextResponse.json(
        { error: `AI API 오류 (${res.status})` },
        { status: 502 }
      );
    }

    const data = await res.json();
    let translation = (data.content?.[0]?.text || "").trim();

    // 따옴표 제거 (AI가 가끔 큰따옴표로 감싸서 응답)
    translation = translation.replace(/^["'](.*)["']$/, "$1").trim();

    if (!translation) {
      return NextResponse.json(
        { error: "번역 결과가 비어있습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ translation });

  } catch (networkErr) {
    console.error("Network error:", networkErr);
    return NextResponse.json(
      { error: "네트워크 오류. 다시 시도해주세요." },
      { status: 503 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "POST 요청만 지원합니다." }, { status: 405 });
}
