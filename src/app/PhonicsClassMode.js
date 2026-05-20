"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { T, Btn, Card } from "./theme";
import {
  PHONICS_LEVELS, getPhonicsWords, getCustomSet
} from "./phonicsData";
import { playClick, isSoundEnabled } from "./soundEffects";

// ══════════════════════════════════════════════════════════════════════════
//   📖 PhonicsClassMode.js — 수업 모드
//   선생님과 학생이 같이 보면서 천천히 단어를 익히는 모드
//   - 큰 화면 카드형 표시
//   - 자동 발음 (선택 가능)
//   - 다시듣기 / 이전 / 다음
//   - 정답/오답 없음 (학습 중심)
// ══════════════════════════════════════════════════════════════════════════

// TTS 발음
function speakEN(text, rate = 0.85) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  if (!isSoundEnabled()) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = rate;
    utter.pitch = 1.0;
    window.speechSynthesis.speak(utter);
  } catch {}
}

// ══════════════════════════════════════════════════════════════════════════
//   메인 컴포넌트: 단어 카드 1개씩 큰 화면에 표시
//   props:
//   - words: [{ word, ko, emoji }] 배열
//   - title: 단어집 이름
//   - levelId: 단계 ID
//   - onExit: 종료 콜백
// ══════════════════════════════════════════════════════════════════════════
export function PhonicsClassMode({ words, title, levelId, onExit }) {
  const [idx, setIdx] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true); // 자동 발음 재생
  const [showKo, setShowKo] = useState(true); // 한글 뜻 표시
  const [showWord, setShowWord] = useState(true); // 영어 단어 표시

  const level = PHONICS_LEVELS.find(l => l.id === levelId);
  const current = words?.[idx];

  // 슬라이드 변경 시 자동 발음
  useEffect(() => {
    if (current && autoPlay) {
      const t = setTimeout(() => speakEN(current.word, 0.8), 400);
      return () => clearTimeout(t);
    }
  }, [idx, autoPlay]);

  const goNext = () => {
    if (idx < words.length - 1) {
      playClick();
      setIdx(i => i + 1);
    }
  };

  const goPrev = () => {
    if (idx > 0) {
      playClick();
      setIdx(i => i - 1);
    }
  };

  // 키보드 단축키 (왼쪽/오른쪽 화살표, 스페이스)
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === " ") {
        e.preventDefault();
        if (current) speakEN(current.word, 0.8);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [idx, current, words]);

  if (!words || words.length === 0) {
    return (
      <div style={{ padding: 30, textAlign: "center", maxWidth: 480, margin: "40px auto" }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>📭</div>
        <div style={{ fontSize: 14, color: T.text, marginBottom: 16 }}>학습할 단어가 없어요</div>
        <Btn v="primary" size="md" onClick={onExit}>← 뒤로</Btn>
      </div>
    );
  }

  if (!current) return null;

  const progress = ((idx + 1) / words.length) * 100;

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${level?.bg || "#f0f9ff"}, white)`,
      padding: 14,
    }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* 상단 컨트롤 */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
          padding: "10px 14px", background: T.card, borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
        }}>
          <button onClick={onExit} style={{
            background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10,
            padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", color: T.textMid
          }}>← 끝내기</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              📖 {title || "수업 모드"}
            </div>
            <div style={{ fontSize: 10, color: T.textMid }}>{idx + 1} / {words.length}</div>
          </div>

          {/* 설정 토글 */}
          <button onClick={() => { playClick(); setAutoPlay(a => !a); }} title="자동 발음"
            style={{
              background: autoPlay ? T.accent : T.bg,
              color: autoPlay ? "white" : T.textMid,
              border: `1px solid ${autoPlay ? T.accent : T.border}`,
              borderRadius: 8, padding: "6px 10px",
              fontSize: 11, fontWeight: 700, cursor: "pointer"
            }}>
            🔊 자동
          </button>
          <button onClick={() => { playClick(); setShowWord(s => !s); }} title="영어 표시"
            style={{
              background: showWord ? T.accent : T.bg,
              color: showWord ? "white" : T.textMid,
              border: `1px solid ${showWord ? T.accent : T.border}`,
              borderRadius: 8, padding: "6px 10px",
              fontSize: 11, fontWeight: 700, cursor: "pointer"
            }}>
            A
          </button>
          <button onClick={() => { playClick(); setShowKo(s => !s); }} title="한글 표시"
            style={{
              background: showKo ? T.accent : T.bg,
              color: showKo ? "white" : T.textMid,
              border: `1px solid ${showKo ? T.accent : T.border}`,
              borderRadius: 8, padding: "6px 10px",
              fontSize: 11, fontWeight: 700, cursor: "pointer"
            }}>
            가
          </button>
        </div>

        {/* 진행률 바 */}
        <div style={{
          height: 6, background: T.border, borderRadius: 3, overflow: "hidden",
          marginBottom: 24
        }}>
          <div style={{
            width: `${progress}%`, height: "100%",
            background: level?.color || T.accent,
            transition: "width 0.4s"
          }} />
        </div>

        {/* 메인 카드 */}
        <div onClick={() => speakEN(current.word, 0.8)}
          style={{
            background: T.card,
            borderRadius: 32,
            padding: "60px 30px",
            textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
            cursor: "pointer",
            minHeight: 480,
            display: "flex", flexDirection: "column", justifyContent: "center",
            border: `3px solid ${level?.color || T.accent}`,
            position: "relative",
            overflow: "hidden"
          }}>
          {/* 배경 데코 */}
          <div style={{
            position: "absolute", top: -40, right: -40,
            fontSize: 200, opacity: 0.05,
            transform: "rotate(15deg)", pointerEvents: "none"
          }}>{current.emoji || "📝"}</div>

          {/* 이모지 (가장 큼) */}
          <div style={{
            fontSize: 200, marginBottom: 20, lineHeight: 1,
            position: "relative", zIndex: 1
          }}>
            {current.emoji || "📝"}
          </div>

          {/* 영어 단어 */}
          {showWord && (
            <div style={{
              fontSize: 64, fontWeight: 900,
              color: level?.color || T.accent,
              marginBottom: 8, lineHeight: 1.2,
              position: "relative", zIndex: 1
            }}>
              {current.word}
            </div>
          )}

          {/* 한글 뜻 */}
          {showKo && current.ko && (
            <div style={{
              fontSize: 24, fontWeight: 700,
              color: T.textMid,
              position: "relative", zIndex: 1
            }}>
              {current.ko}
            </div>
          )}

          {/* 클릭 안내 */}
          <div style={{
            fontSize: 11, color: T.textDim, marginTop: 20,
            position: "relative", zIndex: 1
          }}>
            💡 카드를 클릭하면 발음을 들을 수 있어요
          </div>
        </div>

        {/* 하단 네비게이션 */}
        <div style={{
          display: "flex", gap: 10, marginTop: 20,
          alignItems: "center"
        }}>
          <button onClick={goPrev} disabled={idx === 0}
            style={{
              flex: 1, padding: "16px 0",
              background: idx === 0 ? T.border : T.card,
              color: idx === 0 ? T.textDim : T.text,
              border: `2px solid ${idx === 0 ? T.border : T.accent}`,
              borderRadius: 14,
              fontSize: 14, fontWeight: 800,
              cursor: idx === 0 ? "not-allowed" : "pointer",
              transition: "all 0.2s"
            }}>
            ← 이전
          </button>

          <button onClick={() => speakEN(current.word, 0.8)}
            style={{
              padding: "16px 20px",
              background: T.accent, color: "white",
              border: "none", borderRadius: 14,
              fontSize: 16, fontWeight: 800, cursor: "pointer"
            }}>
            🔊
          </button>

          {idx < words.length - 1 ? (
            <button onClick={goNext}
              style={{
                flex: 1, padding: "16px 0",
                background: level?.color || T.accent, color: "white",
                border: "none", borderRadius: 14,
                fontSize: 14, fontWeight: 800, cursor: "pointer"
              }}>
              다음 →
            </button>
          ) : (
            <button onClick={onExit}
              style={{
                flex: 1, padding: "16px 0",
                background: T.green, color: "white",
                border: "none", borderRadius: 14,
                fontSize: 14, fontWeight: 800, cursor: "pointer"
              }}>
              ✨ 끝내기
            </button>
          )}
        </div>

        {/* 키보드 안내 (데스크탑용) */}
        <div style={{
          marginTop: 16, fontSize: 10, color: T.textDim,
          textAlign: "center", lineHeight: 1.6
        }}>
          💻 키보드 단축키: <kbd style={{ padding: "2px 6px", background: T.bg, borderRadius: 4 }}>←</kbd> 이전
          {" · "}<kbd style={{ padding: "2px 6px", background: T.bg, borderRadius: 4 }}>→</kbd> 다음
          {" · "}<kbd style={{ padding: "2px 6px", background: T.bg, borderRadius: 4 }}>Space</kbd> 발음
        </div>
      </div>
    </div>
  );
}
