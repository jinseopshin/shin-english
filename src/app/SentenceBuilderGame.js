"use client";
import { useState, useEffect, useMemo } from "react";
import { T, Btn, Card } from "./theme";
import { onCorrect, onWrong, onFinish, playClick, isSoundEnabled } from "./soundEffects";
import { useAngela, getComboReaction, getFinishReaction, FullScreenConfetti } from "./AngelaMascot";
import { getAvailableSentencesForStudent, DIFFICULTY_LABELS } from "./sentenceBuilderData";

// ══════════════════════════════════════════════════════════════════════════
//   📝 SentenceBuilderGame.js v2.0 — 문장 만들기 게임 (학생용)
//   게임 로직 100% 유지, 디자인만 새 시스템 적용
// ══════════════════════════════════════════════════════════════════════════

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

function shuffle(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function saveProgress(studentName, score, total) {
  if (typeof window === "undefined" || !studentName) return;
  try {
    const key = `phonics_progress_${studentName}`;
    const stored = JSON.parse(window.localStorage.getItem(key) || "{}");
    const recordKey = "sentence-builder_play";
    const prev = stored[recordKey] || { plays: 0 };
    const stars = total > 0 ? (score / total >= 0.9 ? 3 : score / total >= 0.7 ? 2 : score / total >= 0.5 ? 1 : 0) : 0;
    stored[recordKey] = {
      bestStars: Math.max(prev.bestStars || 0, stars),
      lastScore: score,
      lastTotal: total,
      plays: prev.plays + 1,
      lastPlayed: new Date().toISOString(),
    };
    window.localStorage.setItem(key, JSON.stringify(stored));
  } catch {}
}

// ── 공통: 둥근 뒤로가기 버튼 ──
function BackBtn({ onClick, label = "← 뒤로" }) {
  return (
    <button onClick={onClick} style={{
      background: T.bgSoft, border: "none", borderRadius: T.radiusSm,
      padding: "9px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", color: T.textMid,
      transition: "all 0.15s"
    }}>{label}</button>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//   메인 메뉴
// ══════════════════════════════════════════════════════════════════════════
export function SentenceBuilderMenu({ studentName, onExit }) {
  const [started, setStarted] = useState(false);
  const sentences = useMemo(() => getAvailableSentencesForStudent(studentName), [studentName]);

  if (sentences.length === 0) {
    return (
      <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <BackBtn onClick={onExit} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: T.text }}>📝 문장 만들기</div>
            <div style={{ fontSize: 11, color: T.textMid, marginTop: 2 }}>섞인 단어로 문장을 완성해요</div>
          </div>
        </div>

        <div style={{
          padding: 40, textAlign: "center", marginTop: 40,
          background: T.card, borderRadius: T.radiusXl, border: `2px solid ${T.border}`
        }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>📭</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 8 }}>
            아직 풀 문장이 없어요
          </div>
          <div style={{ fontSize: 12, color: T.textMid }}>
            선생님이 문제를 출제하면 여기에 나타나요
          </div>
        </div>
      </div>
    );
  }

  if (started) {
    return (
      <SentenceBuilderPlay
        studentName={studentName}
        sentences={sentences}
        onExit={() => setStarted(false)}
        onFinalExit={onExit}
      />
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <BackBtn onClick={onExit} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: T.text }}>📝 문장 만들기</div>
          <div style={{ fontSize: 11, color: T.textMid, marginTop: 2 }}>섞인 단어로 문장을 완성해요</div>
        </div>
      </div>

      <div style={{
        padding: 22, marginBottom: 16, borderRadius: T.radiusLg,
        background: `linear-gradient(135deg, ${T.orange}, ${T.pink})`,
        color: "white", boxShadow: T.shadowLg,
        position: "relative", overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", right: -10, top: -10,
          fontSize: 90, opacity: 0.15, transform: "rotate(15deg)"
        }}>📝</div>
        <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 6, position: "relative" }}>
          🎯 {sentences.length}개 문장 준비됨
        </div>
        <div style={{ fontSize: 12, opacity: 0.95, position: "relative", lineHeight: 1.5 }}>
          섞여있는 단어를 올바른 순서로 클릭해서 문장을 완성하세요!
        </div>
      </div>

      <button onClick={() => { playClick(); setStarted(true); }}
        style={{
          width: "100%", padding: 20, background: T.green,
          color: "white", border: "none", borderRadius: T.radiusLg,
          fontSize: 18, fontWeight: 900, cursor: "pointer",
          boxShadow: "0 4px 14px rgba(16,185,129,0.3)"
        }}>
        🚀 시작하기
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//   게임 실행 컴포넌트
// ══════════════════════════════════════════════════════════════════════════
function SentenceBuilderPlay({ studentName, sentences, onExit, onFinalExit }) {
  const [rounds] = useState(() => shuffle(sentences).slice(0, Math.min(10, sentences.length)));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [built, setBuilt] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [done, setDone] = useState(false);
  const angela = useAngela();
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  const current = rounds[idx];

  const wordCards = useMemo(() => {
    if (!current?.words) return [];
    const cards = current.words.map((word, i) => ({
      id: `w${i}`,
      word,
      originalIdx: i,
    }));
    return shuffle(cards);
  }, [current]);

  useEffect(() => {
    setBuilt([]);
    setFeedback(null);
  }, [idx]);

  const handleWordClick = (card) => {
    if (feedback) return;
    if (built.some(b => b.id === card.id)) return;
    playClick();
    const next = [...built, card];
    setBuilt(next);

    if (next.length === current.words.length) {
      const userOrder = next.map(c => c.word).join(" ");
      const correctOrder = current.words.join(" ");
      const isCorrect = userOrder === correctOrder;

      setFeedback(isCorrect ? "correct" : "wrong");

      if (isCorrect) {
        onCorrect();
        const newCombo = combo + 1;
        setCombo(newCombo);
        setScore(s => s + 1);
        setTimeout(() => speakEN(current.english, 0.85), 300);
        if (newCombo >= 3) {
          setTimeout(() => angela.show(getComboReaction(newCombo)), 500);
        } else {
          setTimeout(() => angela.show("correct"), 500);
        }
      } else {
        onWrong();
        setCombo(0);
        setTimeout(() => angela.show("wrong"), 200);
      }

      setTimeout(() => {
        if (idx < rounds.length - 1) {
          setIdx(i => i + 1);
        } else {
          const final = score + (isCorrect ? 1 : 0);
          setDone(true);
          saveProgress(studentName, final, rounds.length);
          onFinish(final, rounds.length);
          setTimeout(() => angela.show(getFinishReaction(final, rounds.length)), 500);
          if (final / rounds.length >= 0.8) setConfettiTrigger(t => t + 1);
        }
      }, 2200);
    }
  };

  const undo = () => {
    if (feedback) return;
    playClick();
    setBuilt(prev => prev.slice(0, -1));
  };

  const reset = () => {
    if (feedback) return;
    playClick();
    setBuilt([]);
  };

  if (done) {
    const stars = score / rounds.length >= 0.9 ? 3 : score / rounds.length >= 0.7 ? 2 : score / rounds.length >= 0.5 ? 1 : 0;
    const ratio = rounds.length > 0 ? score / rounds.length : 0;
    let message, mainEmoji;
    if (ratio === 1.0) { message = "완벽해요! 정말 잘했어요!"; mainEmoji = "🏆"; }
    else if (ratio >= 0.8) { message = "아주 잘했어요!"; mainEmoji = "🌟"; }
    else if (ratio >= 0.5) { message = "잘했어요! 더 연습해봐요"; mainEmoji = "😊"; }
    else { message = "괜찮아요, 다시 도전해봐요!"; mainEmoji = "💪"; }

    return (
      <div style={{ padding: 16, maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
        <FullScreenConfetti trigger={confettiTrigger} />
        <div style={{
          background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`,
          color: "white", borderRadius: T.radiusXl, padding: "40px 24px", marginTop: 40,
          boxShadow: T.shadowLg
        }}>
          <div style={{ fontSize: 96, marginBottom: 12 }}>{mainEmoji}</div>
          <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>{message}</div>
          <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 20 }}>
            {score} / {rounds.length} 맞췄어요
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 24 }}>
            {[1, 2, 3].map(i => (
              <span key={i} style={{
                fontSize: 60,
                opacity: stars >= i ? 1 : 0.3,
                filter: stars >= i ? "drop-shadow(0 0 12px rgba(255,255,255,0.8))" : "none",
              }}>⭐</span>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={onExit} style={{
            flex: 1, padding: 14, background: T.card,
            color: T.text, border: `2px solid ${T.border}`, borderRadius: T.radius,
            fontSize: 13, fontWeight: 800, cursor: "pointer"
          }}>
            다시 도전
          </button>
          <button onClick={onFinalExit} style={{
            flex: 1, padding: 14, background: T.accent,
            color: "white", border: "none", borderRadius: T.radius,
            fontSize: 13, fontWeight: 800, cursor: "pointer",
            boxShadow: T.shadowColor
          }}>
            홈으로
          </button>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <div style={{ marginBottom: 12 }}>문장이 없어요</div>
        <BackBtn onClick={onExit} />
      </div>
    );
  }

  const difficulty = DIFFICULTY_LABELS[current.difficulty] || DIFFICULTY_LABELS.medium;
  const isAnswered = feedback !== null;

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <FullScreenConfetti trigger={confettiTrigger} />
      <angela.AngelaComponent />

      {/* 헤더 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <button onClick={onExit} style={{
            background: T.bgSoft, border: "none", borderRadius: T.radiusSm,
            padding: "7px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", color: T.textMid
          }}>← 그만</button>
          <div style={{ flex: 1, fontSize: 15, fontWeight: 900, color: T.text }}>
            📝 문장 만들기
          </div>
          {combo > 0 && (
            <div style={{
              background: combo >= 3 ? T.orange : T.accent, color: "white",
              padding: "3px 12px", borderRadius: T.radiusFull, fontSize: 12, fontWeight: 900
            }}>
              🔥 {combo}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ flex: 1, height: 8, background: T.border, borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              width: `${((idx + 1) / rounds.length) * 100}%`, height: "100%",
              background: T.accent, transition: "width 0.3s", borderRadius: 4
            }} />
          </div>
          <div style={{ fontSize: 11, color: T.textMid, fontWeight: 700 }}>
            {idx + 1}/{rounds.length}
            <span style={{ marginLeft: 6, color: T.green }}>· ⭐ {score}</span>
          </div>
        </div>
      </div>

      {/* 문제 카드 */}
      <div style={{
        background: T.card, borderRadius: T.radiusXl, padding: "24px 20px",
        marginBottom: 16, border: `2px solid ${T.border}`,
        textAlign: "center"
      }}>
        <div style={{
          display: "inline-block", marginBottom: 12,
          padding: "4px 14px", borderRadius: T.radiusFull,
          background: difficulty.bg, color: difficulty.color,
          fontSize: 11, fontWeight: 800
        }}>
          {difficulty.label}
        </div>

        {current.imageUrl && (
          <div style={{
            width: "100%", maxWidth: 320, height: 180,
            margin: "0 auto 14px",
            borderRadius: T.radius, overflow: "hidden",
            background: T.bgSoft
          }}>
            <img
              src={current.imageUrl}
              alt="문장 그림"
              loading="lazy"
              style={{
                width: "100%", height: "100%", objectFit: "contain"
              }}
            />
          </div>
        )}

        <div style={{
          fontSize: 18, fontWeight: 800, color: T.text,
          marginBottom: 8
        }}>
          {current.korean}
        </div>
        <div style={{ fontSize: 11, color: T.textMid }}>
          위 뜻에 맞게 영어 단어를 순서대로 클릭하세요
        </div>
      </div>

      {/* 만들고 있는 문장 (정답 칸) */}
      <div style={{
        background: feedback === "correct" ? T.greenLight : feedback === "wrong" ? T.redLight : T.bgSoft,
        borderRadius: T.radius, padding: 16,
        marginBottom: 14,
        minHeight: 70,
        display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", justifyContent: "center",
        border: `2px dashed ${feedback === "correct" ? T.green : feedback === "wrong" ? T.red : T.borderMid}`,
        transition: "all 0.3s"
      }}>
        {built.length === 0 ? (
          <div style={{ fontSize: 12, color: T.textDim, fontStyle: "italic" }}>
            아래 단어를 클릭하세요 ↓
          </div>
        ) : (
          built.map((card, i) => (
            <div key={i} style={{
              padding: "8px 14px",
              background: feedback === "correct" ? T.green : feedback === "wrong" ? T.red : T.accent,
              color: "white",
              borderRadius: T.radiusSm, fontSize: 16, fontWeight: 700,
            }}>
              {card.word}
            </div>
          ))
        )}
      </div>

      {/* 정답/오답 메시지 */}
      {feedback === "correct" && (
        <div style={{
          background: T.greenLight, color: "#047857",
          padding: "12px 16px", borderRadius: T.radius,
          marginBottom: 14, textAlign: "center",
          fontSize: 14, fontWeight: 800
        }}>
          ✅ 정답! 🔊 {current.english}
        </div>
      )}
      {feedback === "wrong" && (
        <div style={{
          background: T.redLight, color: "#B91C1C",
          padding: "12px 16px", borderRadius: T.radius,
          marginBottom: 14, textAlign: "center",
          fontSize: 13, fontWeight: 800
        }}>
          정답: <strong style={{ fontSize: 15 }}>{current.english}</strong>
        </div>
      )}

      {/* 단어 카드 */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center"
      }}>
        {wordCards.map(card => {
          const used = built.some(b => b.id === card.id);
          return (
            <button key={card.id} onClick={() => handleWordClick(card)}
              disabled={used || isAnswered}
              style={{
                padding: "12px 18px",
                background: used ? T.border : T.card,
                color: used ? T.textDim : T.text,
                border: `2px solid ${used ? T.border : T.accent}`,
                borderRadius: T.radius,
                fontSize: 18, fontWeight: 700,
                cursor: used || isAnswered ? "default" : "pointer",
                opacity: used ? 0.4 : 1,
                transition: "all 0.2s"
              }}>
              {card.word}
            </button>
          );
        })}
      </div>

      {/* 컨트롤 버튼 */}
      {built.length > 0 && !isAnswered && (
        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "center" }}>
          <button onClick={undo} style={{
            background: "transparent", color: T.textMid,
            border: `1px solid ${T.borderMid}`, borderRadius: T.radiusSm,
            padding: "8px 16px", fontSize: 12, fontWeight: 700,
            cursor: "pointer"
          }}>
            ← 되돌리기
          </button>
          <button onClick={reset} style={{
            background: "transparent", color: T.red,
            border: `1px solid ${T.red}`, borderRadius: T.radiusSm,
            padding: "8px 16px", fontSize: 12, fontWeight: 700,
            cursor: "pointer"
          }}>
            🔄 처음부터
          </button>
        </div>
      )}
    </div>
  );
}
