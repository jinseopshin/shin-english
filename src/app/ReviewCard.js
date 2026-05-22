"use client";
import { useState, useEffect } from "react";
import { T } from "./theme";
import { getTodayReviewWords } from "./studentWords";

// ══════════════════════════════════════════════════════════════════════════
//   🔔 오늘의 복습 카드 v2.0 (망각 곡선)
//   - 공통 theme.js의 T 사용
//   - 로직 100% 유지
// ══════════════════════════════════════════════════════════════════════════

export function ReviewCard({ studentName, onStartReview }) {
  const [reviewWords, setReviewWords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const words = await getTodayReviewWords(studentName, 50);
      if (!cancelled) {
        setReviewWords(words);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [studentName]);

  if (loading || reviewWords.length === 0) return null;

  const today = new Date().toISOString().slice(0, 10);
  const overdue = reviewWords.filter(w => w.nextReviewDate && w.nextReviewDate < today).length;
  const dueToday = reviewWords.filter(w => w.nextReviewDate === today).length;

  const isUrgent = overdue >= 5;
  const gradient = isUrgent
    ? `linear-gradient(135deg, ${T.red} 0%, ${T.orange} 100%)`
    : `linear-gradient(135deg, ${T.orange} 0%, ${T.yellow} 100%)`;

  const levelCounts = [0, 0, 0, 0, 0, 0];
  reviewWords.forEach(w => {
    levelCounts[w.reviewLevel || 0]++;
  });

  return (
    <div onClick={() => onStartReview && onStartReview(reviewWords)} style={{
      background: gradient,
      borderRadius: T.radiusLg, padding: 18, marginBottom: 14,
      color: "white", cursor: "pointer", boxShadow: T.shadowLg,
      transition: "transform 0.15s",
    }}
    onMouseDown={e => e.currentTarget.style.transform = "scale(0.98)"}
    onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
    onTouchStart={e => e.currentTarget.style.transform = "scale(0.98)"}
    onTouchEnd={e => e.currentTarget.style.transform = "scale(1)"}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 34 }}>🔔</div>
          <div>
            <div style={{ fontSize: 11, opacity: 0.9, fontWeight: 700 }}>
              {isUrgent ? "💡 오늘 꼭 복습해요!" : "📚 오늘의 복습"}
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, marginTop: 2 }}>
              {reviewWords.length}<span style={{ fontSize: 14, opacity: 0.85, marginLeft: 4 }}>단어</span>
            </div>
          </div>
        </div>
        <div style={{
          background: "rgba(255,255,255,0.25)",
          borderRadius: T.radius, padding: "10px 16px",
          fontSize: 13, fontWeight: 900,
        }}>
          시작 →
        </div>
      </div>

      {/* 진행 상황 미리보기 */}
      <div style={{
        background: "rgba(255,255,255,0.2)",
        borderRadius: T.radiusSm, padding: "10px 14px",
        fontSize: 11, fontWeight: 700,
      }}>
        {overdue > 0 && <span>⏰ 밀린 복습 {overdue}개 · </span>}
        {dueToday > 0 && <span>📅 오늘 복습 {dueToday}개</span>}
        {levelCounts[5] > 0 && <span style={{ opacity: 0.85 }}> · 🏆 {levelCounts[5]}개 마스터 단어 점검</span>}
      </div>

      <div style={{ fontSize: 10, opacity: 0.85, marginTop: 10, lineHeight: 1.4 }}>
        💡 정답 맞히면 다음 복습이 더 멀리 잡혀요. 외울수록 간격이 길어져요!
      </div>
    </div>
  );
}
