"use client";
import { useState, useEffect } from "react";
import { getStudentWordStats, getPronunciationStats } from "./studentWords";
import { supabase, isSupabaseReady } from "./supabaseClient";

// ══════════════════════════════════════════════════════════════════════════
//   📚 학생 단어 학습 통계 (선생님용)
//
//   학생 상세 화면에 표시되는 카드.
//   망각 곡선 기반 학습 진도, 마스터/학습중/어려워하는 단어, 단어장 정보를 보여줌.
// ══════════════════════════════════════════════════════════════════════════

const T = {
  bg: "#f0f7ff", card: "#ffffff", border: "#dce8ff",
  accent: "#4f8ef7", accentLight: "#e8f0ff",
  green: "#22c55e", greenLight: "#dcfce7",
  red: "#ef4444", redLight: "#fee2e2",
  yellow: "#f59e0b", yellowLight: "#fef3c7",
  orange: "#f97316", orangeLight: "#fff7ed",
  purple: "#a855f7", purpleLight: "#f3e8ff",
  pink: "#ec4899", pinkLight: "#fce7f3",
  text: "#1e293b", textMid: "#64748b", textDim: "#94a3b8",
  shadow: "0 4px 16px rgba(79,142,247,0.12)",
};

export function StudentWordStatsCard({ studentName }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pronunStats, setPronunStats] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [detailWords, setDetailWords] = useState({ mastered: [], struggling: [], favorites: [] });
  const [detailLoading, setDetailLoading] = useState(false);

// 기본 통계 + 발음 통계 로드
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [wordStats, pronStats] = await Promise.all([
        getStudentWordStats(studentName),
        getPronunciationStats(studentName),
      ]);
      if (!cancelled) {
        setStats(wordStats);
        setPronunStats(pronStats);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [studentName]);

  // 상세 보기 토글 시 단어 목록 로드
  const handleToggleDetails = async () => {
    if (showDetails) {
      setShowDetails(false);
      return;
    }
    setShowDetails(true);
    if (detailWords.mastered.length > 0) return; // 이미 로드됨

    if (!isSupabaseReady()) return;
    setDetailLoading(true);
    try {
      const { data } = await supabase
        .from("student_words")
        .select("*")
        .eq("student_name", studentName);

      const all = data || [];
      const mastered = all
        .filter(w => (w.review_level || 0) >= 5)
        .sort((a, b) => new Date(b.last_studied_at) - new Date(a.last_studied_at))
        .slice(0, 10);
      const struggling = all
        .filter(w => w.wrong_count > w.correct_count && w.encounter_count >= 2)
        .sort((a, b) => (b.wrong_count - b.correct_count) - (a.wrong_count - a.correct_count))
        .slice(0, 10);
      const favorites = all
        .filter(w => w.is_favorite)
        .sort((a, b) => new Date(b.favorited_at) - new Date(a.favorited_at))
        .slice(0, 10);

      setDetailWords({ mastered, struggling, favorites });
    } catch (e) {
      console.warn("단어 상세 로드 실패:", e.message);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        background: T.card, borderRadius: 16, padding: 14, marginBottom: 14,
        boxShadow: T.shadow, border: `1px solid ${T.border}`,
        textAlign: "center", color: T.textDim, fontSize: 12,
      }}>
        단어 학습 통계 불러오는 중...
      </div>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <div style={{
        background: T.card, borderRadius: 16, padding: 16, marginBottom: 14,
        boxShadow: T.shadow, border: `1px solid ${T.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ fontSize: 22 }}>📚</div>
          <div style={{ fontSize: 14, fontWeight: 900, color: T.text }}>단어 학습 통계</div>
        </div>
        <div style={{ fontSize: 11, color: T.textMid, lineHeight: 1.5, padding: "6px 0" }}>
          아직 학습한 단어가 없어요. 학생이 단어 게임을 시작하면 통계가 쌓입니다.
        </div>
      </div>
    );
  }

  const progressPct = stats.total > 0 ? Math.round(stats.mastered / stats.total * 100) : 0;
  const inProgress = stats.total - stats.mastered - stats.struggling;

  return (
    <div style={{
      background: T.card, borderRadius: 16, padding: 16, marginBottom: 14,
      boxShadow: T.shadow, border: `1px solid ${T.border}`,
    }}>
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 22 }}>📚</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: T.text }}>단어 학습 통계</div>
            <div style={{ fontSize: 10, color: T.textMid }}>총 {stats.total}개 단어 학습 중</div>
          </div>
        </div>
        <button onClick={handleToggleDetails} style={{
          background: T.accentLight, color: T.accent,
          border: "none", borderRadius: 8, padding: "5px 10px",
          fontSize: 11, fontWeight: 700, cursor: "pointer",
        }}>
          {showDetails ? "접기 ▲" : "자세히 ▼"}
        </button>
      </div>

      {/* 마스터 진행도 막대 */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ fontSize: 11, color: T.textMid, fontWeight: 700 }}>🏆 마스터 진행도</div>
          <div style={{ fontSize: 11, fontWeight: 900, color: T.green }}>{progressPct}%</div>
        </div>
        <div style={{ height: 8, background: T.border, borderRadius: 4, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${progressPct}%`,
            background: `linear-gradient(90deg, ${T.green}, ${T.accent})`,
            borderRadius: 4, transition: "width 0.5s",
          }} />
        </div>
        <div style={{ fontSize: 10, color: T.textDim, marginTop: 3 }}>
          {stats.mastered}개 마스터 / 전체 {stats.total}개
        </div>
      </div>

      {/* 4개 카테고리 통계 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
        <div style={{ background: T.greenLight, borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ fontSize: 16 }}>🏆</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: T.green }}>{stats.mastered}</div>
              <div style={{ fontSize: 10, color: T.textMid, fontWeight: 700 }}>마스터한 단어</div>
            </div>
          </div>
        </div>

        <div style={{ background: T.accentLight, borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ fontSize: 16 }}>📈</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: T.accent }}>{inProgress}</div>
              <div style={{ fontSize: 10, color: T.textMid, fontWeight: 700 }}>학습 중인 단어</div>
            </div>
          </div>
        </div>

        <div style={{ background: T.redLight, borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ fontSize: 16 }}>💪</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: T.red }}>{stats.struggling}</div>
              <div style={{ fontSize: 10, color: T.textMid, fontWeight: 700 }}>어려워하는 단어</div>
            </div>
          </div>
        </div>

        <div style={{ background: T.yellowLight, borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ fontSize: 16 }}>⭐</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: T.yellow }}>{stats.favorited}</div>
              <div style={{ fontSize: 10, color: T.textMid, fontWeight: 700 }}>즐겨찾기 단어</div>
            </div>
          </div>
        </div>
      </div>

{/* 🎤 발음 학습 통계 (Phase 3) */}
      {pronunStats && pronunStats.count > 0 && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ fontSize: 18 }}>🎤</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: T.text }}>발음 학습 통계</div>
          </div>
          
          <div style={{
            background: pronunStats.avg >= 80 ? T.greenLight : pronunStats.avg >= 60 ? T.accentLight : T.yellowLight,
            borderRadius: 12, padding: 12, marginBottom: 10,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ fontSize: 11, color: T.textMid, fontWeight: 700 }}>평균 발음 점수</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: pronunStats.avg >= 80 ? T.green : pronunStats.avg >= 60 ? T.accent : T.yellow }}>
                {pronunStats.avg}<span style={{ fontSize: 14, opacity: 0.7 }}>점</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: T.textMid, fontWeight: 700 }}>도전한 단어</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: T.text }}>{pronunStats.count}개</div>
            </div>
          </div>

          {pronunStats.weakWords && pronunStats.weakWords.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: T.red, marginBottom: 6 }}>
                💪 발음 약점 단어 TOP {pronunStats.weakWords.length}
              </div>
              <div style={{ background: T.redLight, borderRadius: 10, padding: "8px 10px" }}>
                {pronunStats.weakWords.map((w, i) => (
                  <div key={w.word_en} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "4px 0",
                    borderBottom: i < pronunStats.weakWords.length - 1 ? `1px solid ${T.redLight}` : "none",
                  }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 800, color: T.text }}>{w.word_en}</span>
                      <span style={{ fontSize: 11, color: T.textMid, marginLeft: 6 }}>{w.word_ko}</span>
                    </div>
                    <div style={{ fontSize: 11, color: T.red, fontWeight: 700 }}>
                      {w.pronunciation_avg}점 · {w.pronunciation_count}회 시도
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 10, color: T.textDim, marginTop: 4 }}>
                💡 이 단어들을 따로 발음 연습시켜보세요
              </div>
            </div>
          )}
        </div>
      )}

      {/* 상세 단어 목록 (펼치기) */}
      {showDetails && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
          {detailLoading ? (
            <div style={{ textAlign: "center", padding: 16, color: T.textDim, fontSize: 12 }}>
              단어 목록 불러오는 중...
            </div>
          ) : (
            <>
              {/* 어려워하는 단어 (선생님이 가장 궁금해할 정보!) */}
              {detailWords.struggling.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: T.red, marginBottom: 6 }}>
                    💪 어려워하는 단어 TOP {detailWords.struggling.length}
                  </div>
                  <div style={{ background: T.redLight, borderRadius: 10, padding: "8px 10px" }}>
                    {detailWords.struggling.map((w, i) => (
                      <div key={w.word_en} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "4px 0",
                        borderBottom: i < detailWords.struggling.length - 1 ? `1px solid ${T.redLight}` : "none",
                      }}>
                        <div>
                          <span style={{ fontSize: 12, fontWeight: 800, color: T.text }}>{w.word_en}</span>
                          <span style={{ fontSize: 11, color: T.textMid, marginLeft: 8 }}>{w.word_ko}</span>
                        </div>
                        <div style={{ fontSize: 10, color: T.red, fontWeight: 700 }}>
                          {w.wrong_count}회 오답 / {w.correct_count}회 정답
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: T.textDim, marginTop: 4 }}>
                    💡 이 단어들을 따로 단어 숙제로 배정해보세요
                  </div>
                </div>
              )}

              {/* 마스터한 단어 */}
              {detailWords.mastered.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: T.green, marginBottom: 6 }}>
                    🏆 최근 마스터한 단어 TOP {detailWords.mastered.length}
                  </div>
                  <div style={{ background: T.greenLight, borderRadius: 10, padding: "8px 10px" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {detailWords.mastered.map(w => (
                        <span key={w.word_en} style={{
                          background: "white", padding: "3px 8px", borderRadius: 6,
                          fontSize: 11, fontWeight: 700, color: T.green,
                        }}>
                          {w.word_en}
                          <span style={{ color: T.textMid, fontWeight: 500, marginLeft: 4 }}>({w.word_ko})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 즐겨찾기 단어 */}
              {detailWords.favorites.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: T.yellow, marginBottom: 6 }}>
                    ⭐ 학생이 즐겨찾기한 단어 TOP {detailWords.favorites.length}
                  </div>
                  <div style={{ background: T.yellowLight, borderRadius: 10, padding: "8px 10px" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {detailWords.favorites.map(w => (
                        <span key={w.word_en} style={{
                          background: "white", padding: "3px 8px", borderRadius: 6,
                          fontSize: 11, fontWeight: 700, color: T.text,
                        }}>
                          {w.word_en}
                          <span style={{ color: T.textMid, fontWeight: 500, marginLeft: 4 }}>({w.word_ko})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: T.textDim, marginTop: 4 }}>
                    💡 학생이 직접 관심을 보인 단어들이에요
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
