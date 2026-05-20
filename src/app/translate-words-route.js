// app/api/translate-words/route.js
// 영어 단어 목록을 받아 한글 뜻을 한꺼번에 번역

import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req) {
  try {
    const { words } = await req.json();

    if (!Array.isArray(words) || words.length === 0) {
      return Response.json({ error: "번역할 단어가 없습니다." }, { status: 400 });
    }

    if (words.length > 100) {
      return Response.json({ error: "한 번에 최대 100개까지 번역 가능합니다." }, { status: 400 });
    }

    const wordList = words.map(w => String(w).trim()).filter(Boolean).slice(0, 100);

    const prompt = `다음 영어 단어들의 한글 뜻을 알려주세요.
각 단어의 가장 핵심적인 뜻 한 가지만 작성해주세요. 여러 뜻이 중요하면 콤마로 구분(예: "사과, 사과하다").
중·고등학생이 학습하는 교과서 수준의 뜻을 우선해주세요.

단어 목록:
${wordList.map((w, i) => `${i+1}. ${w}`).join("\n")}

응답은 반드시 다음 JSON 형식으로만 응답하세요. 다른 설명 없이 JSON만:
{
  "translations": [
    {"en": "apple", "ko": "사과"},
    {"en": "banana", "ko": "바나나"}
  ]
}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      messages: [
        { role: "user", content: prompt },
      ],
    });

    const text = response.content
      .filter(c => c.type === "text")
      .map(c => c.text)
      .join("");

    const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("AI 응답을 파싱할 수 없습니다");
      }
    }

    const translations = (parsed.translations || []).map(t => ({
      en: String(t.en || "").trim().toLowerCase(),
      ko: String(t.ko || "").trim(),
    })).filter(t => t.en && t.ko);

    return Response.json({ translations });
  } catch (err) {
    console.error("translate-words 에러:", err);
    const msg = err?.message || "번역 실패";
    return Response.json({ error: msg }, { status: 500 });
  }
}
