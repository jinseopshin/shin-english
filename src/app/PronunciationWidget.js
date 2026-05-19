"use client";
import { useState, useEffect } from "react";
import { getPronunciationStats } from "./studentWords";

// ══════════════════════════════════════════════════════════════════════════
//   🎤 이번 주 발음 위젯 (학생 홈용)
//
//   학생 홈에 작은 카드로 표시.
//   평균 발음 점수와 "발음 챌린지 시작" 버튼 제공.
//   발음 기록이 없으면 숨김.
// ══════════════════════════════════════════════════════════════════════════

const T = {
  card: "#ffffff", border: "#dce8ff",
  accent: "#4f8ef7", accentLight: "#e8f0ff",
  green: "#22c55e", greenLight: "#dcfce7",
  yellow: "#f59e0b", yellowLight: "#fef3c7",
  red: "#ef4444", redLight: "#fee2e2",
  purple: "#a855f7",
  text: "#1e293b", textMid: "#64748b", textDim: "#94a3b8",
  shadow: "0 4px 16px rgba(79,142,247,0.12)",
};

export function PronunciationWidget({ studentName, onStart }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await getPronunciationStats(studentName);
      if (!cancelled) {
        setStats(data);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [studentName]);

  // 로딩 중이거나 기록이 없으면 숨김
  if (loading || !stats || stats.count === 0) return null;

  const scoreColor = stats.avg >= 80 ? T.green : stats.avg >= 60 ? T.accent : T.yellow;
  const emoji = stats.avg >= 80 ? "🏆" : stats.avg >= 60 ? "🎯" : "💪";
  const message = stats.avg >= 80 ? "발음 마스터!" : stats.avg >= 60 ? "잘하고 있어요" : "더 연습해봐요";

  return (
    <div onClick={onStart} style={{
      background: `linear-gradient(135deg, ${T.purple} 0%, ${T.accent} 100%)`,
      borderRadius: 16, padding: "14px 16px", marginBottom: 14,
      color: "white", cursor: "pointer", boxShadow: T.shadow,
      transition: "transform 0.15s",
    }}
    onMouseDown={e => e.currentTarget.style.transform = "scale(0.98)"}
    onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 28 }}>🎤</div>
          <div>
            <div style={{ fontSize: 11, opacity: 0.9, fontWeight: 700 }}>내 발음 점수</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <div style={{ fontSize: 22, fontWeight: 900 }}>{stats.avg}<span style={{ fontSize: 12, opacity: 0.85 }}>점</span></div>
              <div style={{ fontSize: 18 }}>{emoji}</div>
            </div>
          </div>
        </div>
        <div style={{
          background: "rgba(255,255,255,0.25)",
          borderRadius: 10, padding: "6px 12px",
          fontSize: 12, fontWeight: 900,
        }}>
          도전 →
        </div>
      </div>
      <div style={{
        marginTop: 8, fontSize: 11, opacity: 0.9, lineHeight: 1.5,
      }}>
        {message} · {stats.count}개 단어 도전 중
        {stats.weakWords && stats.weakWords.length > 0 && (
          <span> · 약한 단어 {stats.weakWords.length}개 보강 필요!</span>
        )}
      </div>
    </div>
  );
}
