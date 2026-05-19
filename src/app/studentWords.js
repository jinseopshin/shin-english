"use client";
import { supabase, isSupabaseReady } from "./supabaseClient";

// ══════════════════════════════════════════════════════════════════════════
//   학생 단어 학습 이력 시스템 — v2 (안정성 강화)
//
//   v2 변경 사항:
//   - Race condition 제거: select + insert/update 분기 → upsert로 통합
//   - getStudentWordStats의 total을 "실제 학습한 단어"로 정확히 계산
//   - 미사용 함수 recordWordResult 삭제
//
//   Phase 1: 단어장 (즐겨찾기)
//   Phase 2: 망각 곡선 (자동 복습 일정)
//   Phase 3: 발음 점수
//
//   세 기능 모두 같은 student_words 테이블을 공유합니다.
//
//   ⚠️ upsert가 동작하려면 Supabase 테이블의 student_words에
//      (student_name, word_en) 조합에 unique constraint가 있어야 합니다.
//      이미 있다면 별도 작업 불필요.
// ══════════════════════════════════════════════════════════════════════════

const REVIEW_INTERVALS = [
  null,   // level 0: 신규
  1, 3, 7, 14, 30,  // level 1~5
];

function calcNextReviewDate(level) {
  const days = REVIEW_INTERVALS[level];
  if (!days) return null;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ──────────────────────────────────────────────────────────────────────────
//  단어 학습 기록 (게임에서 호출하는 핵심 함수) — v2 upsert 패턴
// ──────────────────────────────────────────────────────────────────────────
export async function recordWordEncounter(studentName, word, isCorrect) {
  if (!studentName || !word?.en) return;
  
  // 1) localStorage 폴백
  recordWordToLocalStorage(studentName, word, isCorrect);
  
  // 2) Supabase
  if (!isSupabaseReady()) return;
  
  try {
    // 기존 값 조회 (누적 계산용)
    const { data: existing } = await supabase
      .from("student_words")
      .select("*")
      .eq("student_name", studentName)
      .eq("word_en", word.en)
      .maybeSingle();
    
    const now = new Date().toISOString();
    
    const oldEncounter = existing?.encounter_count || 0;
    const oldCorrect = existing?.correct_count || 0;
    const oldWrong = existing?.wrong_count || 0;
    const oldLevel = existing?.review_level || 0;
    
    const newEncounter = oldEncounter + 1;
    const newCorrect = oldCorrect + (isCorrect ? 1 : 0);
    const newWrong = oldWrong + (isCorrect ? 0 : 1);
    
    let newLevel;
    if (existing) {
      newLevel = isCorrect
        ? Math.min(5, oldLevel + 1)
        : Math.max(1, Math.floor(oldLevel / 2));
    } else {
      newLevel = isCorrect ? 1 : 0;
    }
    
    // ✅ upsert — race condition 안전
    const payload = {
      student_name: studentName,
      word_en: word.en,
      word_ko: word.ko,
      encounter_count: newEncounter,
      correct_count: newCorrect,
      wrong_count: newWrong,
      review_level: newLevel,
      next_review_date: calcNextReviewDate(newLevel),
      last_studied_at: now,
      updated_at: now,
    };
    if (!existing) payload.first_seen_at = now;
    
    await supabase
      .from("student_words")
      .upsert(payload, { onConflict: "student_name,word_en" });
    
  } catch (e) {
    console.warn(`recordWordEncounter 실패 (${word.en}):`, e.message);
  }
}

function recordWordToLocalStorage(studentName, word, isCorrect) {
  if (typeof window === "undefined") return;
  try {
    const key = `angela_wrong_${studentName}`;
    const data = JSON.parse(window.localStorage.getItem(key) || "{}");
    data[word.en] = data[word.en] || { wrong: 0, correct: 0, ko: word.ko };
    if (isCorrect) data[word.en].correct++;
    else data[word.en].wrong++;
    data[word.en].ko = word.ko;
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

// ──────────────────────────────────────────────────────────────────────────
//  ⭐ 단어장 (즐겨찾기) — Phase 1, v2 upsert
// ──────────────────────────────────────────────────────────────────────────

export async function addToWordbook(studentName, word) {
  if (!studentName || !word?.en || !isSupabaseReady()) return false;
  
  try {
    // 기존 학습 데이터 보존을 위해 조회
    const { data: existing } = await supabase
      .from("student_words")
      .select("*")
      .eq("student_name", studentName)
      .eq("word_en", word.en)
      .maybeSingle();
    
    const now = new Date().toISOString();
    
    const payload = {
      student_name: studentName,
      word_en: word.en,
      word_ko: word.ko,
      is_favorite: true,
      favorited_at: now,
      updated_at: now,
    };
    
    if (existing) {
      // 기존 학습 데이터 모두 보존
      payload.encounter_count = existing.encounter_count || 0;
      payload.correct_count = existing.correct_count || 0;
      payload.wrong_count = existing.wrong_count || 0;
      payload.review_level = existing.review_level || 0;
      payload.next_review_date = existing.next_review_date;
      payload.last_studied_at = existing.last_studied_at;
      payload.first_seen_at = existing.first_seen_at;
      payload.pronunciation_avg = existing.pronunciation_avg;
      payload.pronunciation_count = existing.pronunciation_count;
    } else {
      payload.first_seen_at = now;
      payload.last_studied_at = now;
    }
    
    await supabase
      .from("student_words")
      .upsert(payload, { onConflict: "student_name,word_en" });
    return true;
  } catch (e) {
    console.warn(`addToWordbook 실패:`, e.message);
    return false;
  }
}

export async function removeFromWordbook(studentName, wordEn) {
  if (!isSupabaseReady()) return false;
  try {
    await supabase
      .from("student_words")
      .update({ is_favorite: false, updated_at: new Date().toISOString() })
      .eq("student_name", studentName)
      .eq("word_en", wordEn);
    return true;
  } catch (e) {
    console.warn(`removeFromWordbook 실패:`, e.message);
    return false;
  }
}

export async function getWordbook(studentName) {
  if (!isSupabaseReady() || !studentName) return [];
  try {
    const { data, error } = await supabase
      .from("student_words")
      .select("*")
      .eq("student_name", studentName)
      .eq("is_favorite", true)
      .order("favorited_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(row => ({
      en: row.word_en,
      ko: row.word_ko,
      encounters: row.encounter_count,
      correct: row.correct_count,
      wrong: row.wrong_count,
      favoritedAt: row.favorited_at,
      lastStudiedAt: row.last_studied_at,
      reviewLevel: row.review_level,
    }));
  } catch (e) {
    console.warn(`getWordbook 실패:`, e.message);
    return [];
  }
}

export async function isInWordbook(studentName, wordEn) {
  if (!isSupabaseReady() || !studentName || !wordEn) return false;
  try {
    const { data } = await supabase
      .from("student_words")
      .select("is_favorite")
      .eq("student_name", studentName)
      .eq("word_en", wordEn)
      .maybeSingle();
    return data?.is_favorite === true;
  } catch {
    return false;
  }
}

// ──────────────────────────────────────────────────────────────────────────
//  🔔 망각 곡선 — Phase 2
// ──────────────────────────────────────────────────────────────────────────

export async function getTodayReviewWords(studentName, limit = 20) {
  if (!isSupabaseReady() || !studentName) return [];
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("student_words")
      .select("*")
      .eq("student_name", studentName)
      .lte("next_review_date", today)
      .order("next_review_date", { ascending: true })
      .limit(limit);
    if (error) throw error;
    return (data || []).map(row => ({
      en: row.word_en,
      ko: row.word_ko,
      reviewLevel: row.review_level,
      nextReviewDate: row.next_review_date,
    }));
  } catch (e) {
    console.warn(`getTodayReviewWords 실패:`, e.message);
    return [];
  }
}

// ──────────────────────────────────────────────────────────────────────────
//  🎤 발음 점수 (Phase 3) — v2 upsert
// ──────────────────────────────────────────────────────────────────────────

export async function recordPronunciation(studentName, word, score) {
  if (!studentName || !word?.en || !isSupabaseReady()) return false;
  
  try {
    const { data: existing } = await supabase
      .from("student_words")
      .select("*")
      .eq("student_name", studentName)
      .eq("word_en", word.en)
      .maybeSingle();
    
    const now = new Date().toISOString();
    
    const oldAvg = existing?.pronunciation_avg || 0;
    const oldCount = existing?.pronunciation_count || 0;
    const newCount = oldCount + 1;
    const newAvg = newCount > 0
      ? Math.round((oldAvg * oldCount + score) / newCount)
      : score;
    
    const payload = {
      student_name: studentName,
      word_en: word.en,
      word_ko: word.ko,
      pronunciation_avg: newAvg,
      pronunciation_count: newCount,
      last_studied_at: now,
      updated_at: now,
    };
    
    if (existing) {
      payload.encounter_count = existing.encounter_count || 0;
      payload.correct_count = existing.correct_count || 0;
      payload.wrong_count = existing.wrong_count || 0;
      payload.review_level = existing.review_level || 0;
      payload.next_review_date = existing.next_review_date;
      payload.first_seen_at = existing.first_seen_at;
      payload.is_favorite = existing.is_favorite;
      payload.favorited_at = existing.favorited_at;
    } else {
      payload.first_seen_at = now;
    }
    
    await supabase
      .from("student_words")
      .upsert(payload, { onConflict: "student_name,word_en" });
    return true;
  } catch (e) {
    console.warn(`recordPronunciation 실패:`, e.message);
    return false;
  }
}

export async function getPronunciationStats(studentName) {
  if (!isSupabaseReady() || !studentName) return null;
  try {
    const { data, error } = await supabase
      .from("student_words")
      .select("pronunciation_avg, pronunciation_count, word_en, word_ko")
      .eq("student_name", studentName)
      .not("pronunciation_avg", "is", null);
    if (error) throw error;
    
    if (!data || data.length === 0) return { avg: 0, count: 0, words: [], weakWords: [] };
    
    const totalCount = data.reduce((sum, w) => sum + w.pronunciation_count, 0);
    const weightedSum = data.reduce((sum, w) => sum + w.pronunciation_avg * w.pronunciation_count, 0);
    const avg = totalCount > 0 ? Math.round(weightedSum / totalCount) : 0;
    
    const weakWords = data
      .filter(w => w.pronunciation_avg < 60)
      .sort((a, b) => a.pronunciation_avg - b.pronunciation_avg)
      .slice(0, 5);
    
    return { avg, count: data.length, weakWords };
  } catch (e) {
    console.warn(`getPronunciationStats 실패:`, e.message);
    return null;
  }
}

// ──────────────────────────────────────────────────────────────────────────
//  📊 학생 학습 통계 (선생님 대시보드용) — v2 정확한 total 계산
// ──────────────────────────────────────────────────────────────────────────

export async function getStudentWordStats(studentName) {
  if (!isSupabaseReady() || !studentName) return null;
  try {
    const { data, error } = await supabase
      .from("student_words")
      .select("*")
      .eq("student_name", studentName);
    if (error) throw error;
    
    const all = data || [];
    
    // ✅ v2: 실제 학습한 단어만 total로 카운트
    const studied = all.filter(w => (w.encounter_count || 0) > 0);
    const total = studied.length;
    
    const mastered = studied.filter(w => (w.review_level || 0) >= 5).length;
    const favorited = all.filter(w => w.is_favorite).length;
    const struggling = studied.filter(
      w => (w.wrong_count || 0) > (w.correct_count || 0) && (w.encounter_count || 0) >= 2
    ).length;
    
    return { total, mastered, favorited, struggling };
  } catch (e) {
    console.warn(`getStudentWordStats 실패:`, e.message);
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════════════
//   v2: recordWordResult 함수 제거됨 (어디서도 사용되지 않음)
// ══════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════
//   📖 단어 학습 현황 대시보드 (선생님용) — v1
// ══════════════════════════════════════════════════════════════════════════

// ──────────────────────────────────────────────────────────────────────────
//  1. 전체 학생의 단어 통계 합계
// ──────────────────────────────────────────────────────────────────────────
export async function getAllStudentsStats(studentNames) {
  if (!isSupabaseReady() || !studentNames || studentNames.length === 0) {
    return { totalStudied: 0, totalMastered: 0, totalLearning: 0, totalStruggling: 0, totalFavorited: 0 };
  }
  try {
    const { data, error } = await supabase
      .from("student_words")
      .select("encounter_count, correct_count, wrong_count, review_level, is_favorite, student_name")
      .in("student_name", studentNames);
    if (error) throw error;
    
    const studied = (data || []).filter(w => (w.encounter_count || 0) > 0);
    
    const totalStudied = studied.length;
    const totalMastered = studied.filter(w => (w.review_level || 0) >= 5).length;
    const totalLearning = studied.filter(w => (w.review_level || 0) >= 1 && (w.review_level || 0) < 5).length;
    const totalStruggling = studied.filter(
      w => (w.wrong_count || 0) > (w.correct_count || 0) && (w.encounter_count || 0) >= 2
    ).length;
    const totalFavorited = (data || []).filter(w => w.is_favorite).length;
    
    return { totalStudied, totalMastered, totalLearning, totalStruggling, totalFavorited };
  } catch (e) {
    console.warn(`getAllStudentsStats 실패:`, e.message);
    return { totalStudied: 0, totalMastered: 0, totalLearning: 0, totalStruggling: 0, totalFavorited: 0 };
  }
}

// ──────────────────────────────────────────────────────────────────────────
//  2. 학생별 진도 랭킹
// ──────────────────────────────────────────────────────────────────────────
export async function getStudentRanking(studentNames) {
  if (!isSupabaseReady() || !studentNames || studentNames.length === 0) return [];
  try {
    const { data, error } = await supabase
      .from("student_words")
      .select("student_name, encounter_count, correct_count, wrong_count, review_level")
      .in("student_name", studentNames);
    if (error) throw error;
    
    // 학생별 집계
    const map = {};
    (data || []).forEach(w => {
      const n = w.student_name;
      if (!map[n]) map[n] = { name: n, studied: 0, mastered: 0, correct: 0, total: 0 };
      if ((w.encounter_count || 0) > 0) {
        map[n].studied++;
        if ((w.review_level || 0) >= 5) map[n].mastered++;
        map[n].correct += (w.correct_count || 0);
        map[n].total += (w.correct_count || 0) + (w.wrong_count || 0);
      }
    });
    
    // 정확도 계산 + 정렬
    const ranking = Object.values(map).map(s => ({
      ...s,
      accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
    }));
    
    // 마스터 단어 많은 순, 같으면 정확도 높은 순
    ranking.sort((a, b) => {
      if (b.mastered !== a.mastered) return b.mastered - a.mastered;
      return b.accuracy - a.accuracy;
    });
    
    return ranking;
  } catch (e) {
    console.warn(`getStudentRanking 실패:`, e.message);
    return [];
  }
}

// ──────────────────────────────────────────────────────────────────────────
//  3. 오늘 복습 대기 중인 학생 목록
// ──────────────────────────────────────────────────────────────────────────
export async function getStudentsWithPendingReview(studentNames) {
  if (!isSupabaseReady() || !studentNames || studentNames.length === 0) return [];
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("student_words")
      .select("student_name, word_en")
      .in("student_name", studentNames)
      .lte("next_review_date", today)
      .not("next_review_date", "is", null);
    if (error) throw error;
    
    // 학생별 개수 집계
    const map = {};
    (data || []).forEach(w => {
      const n = w.student_name;
      if (!map[n]) map[n] = 0;
      map[n]++;
    });
    
    // 복습 개수 많은 순
    const list = Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    
    return list;
  } catch (e) {
    console.warn(`getStudentsWithPendingReview 실패:`, e.message);
    return [];
  }
}

// ──────────────────────────────────────────────────────────────────────────
//  4. 최근 7일간 학습량 추이 (전체 학생)
// ──────────────────────────────────────────────────────────────────────────
export async function getLearningTrend7Days(studentNames) {
  if (!isSupabaseReady() || !studentNames || studentNames.length === 0) {
    return [];
  }
  try {
    // 7일 전 날짜 계산
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // 오늘 포함 7일
    const fromDate = sevenDaysAgo.toISOString().slice(0, 10);
    
    const { data, error } = await supabase
      .from("student_words")
      .select("last_studied_at, encounter_count")
      .in("student_name", studentNames)
      .gte("last_studied_at", fromDate + "T00:00:00")
      .not("last_studied_at", "is", null);
    if (error) throw error;
    
    // 날짜별 집계 (학습한 단어 수)
    const map = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map[key] = 0;
    }
    
    (data || []).forEach(w => {
      const date = w.last_studied_at?.slice(0, 10);
      if (date && map[date] !== undefined) {
        map[date]++;
      }
    });
    
    // 차트용 배열 변환 (날짜 짧게)
    return Object.entries(map).map(([date, count]) => {
      const d = new Date(date);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      return { date: label, fullDate: date, count };
    });
  } catch (e) {
    console.warn(`getLearningTrend7Days 실패:`, e.message);
    return [];
  }
}
