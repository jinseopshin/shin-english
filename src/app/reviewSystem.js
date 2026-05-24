// ══════════════════════════════════════════════════════════════════════════
//   🔁 reviewSystem.js — 간격 반복 복습 시스템 (글자/단어별)
//   - 기존 phonics_progress 저장소를 절대 건드리지 않음 (완전 분리)
//   - 별도 키: phonics_review_{학생이름}
//   - 모든 접근 try/catch 방어. 데이터 없거나 깨져도 안전한 기본값 반환.
//
//   간격 규칙 (Leitner 박스 단순화):
//     box 0 → 다음날(1일)  box 1 → 3일  box 2 → 7일  box 3 → 14일  box 4 → 30일
//     맞히면 box +1 (간격 늘림), 틀리면 box 0으로 리셋(다음날 다시)
// ══════════════════════════════════════════════════════════════════════════

const INTERVALS = [1, 3, 7, 14, 30]; // box별 다음 복습까지 일수
const MAX_BOX = INTERVALS.length - 1;

function keyFor(studentName) {
  return `phonics_review_${studentName}`;
}

// 안전하게 전체 복습 데이터 읽기 → { [item]: {box, last, due, right, wrong} }
function loadAll(studentName) {
  if (typeof window === "undefined" || !studentName) return {};
  try {
    const raw = window.localStorage.getItem(keyFor(studentName));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === "object") ? parsed : {};
  } catch {
    return {};
  }
}

function saveAll(studentName, data) {
  if (typeof window === "undefined" || !studentName) return;
  try {
    window.localStorage.setItem(keyFor(studentName), JSON.stringify(data));
  } catch {}
}

// 날짜 → YYYY-MM-DD (시간대 영향 줄이기 위해 로컬 기준 날짜만)
function dayString(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return dayString(new Date());
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// 오늘 + n일의 날짜 문자열
function addDays(n, from) {
  const base = from ? new Date(from) : new Date();
  if (isNaN(base.getTime())) return dayString(new Date());
  base.setDate(base.getDate() + n);
  return dayString(base);
}

// ── 기록 업데이트: 게임에서 한 항목(글자/단어)을 맞히거나 틀렸을 때 호출 ──
//   item: "a", "A", "cat" 등 식별 문자열
//   correct: true/false
export function recordReview(studentName, item, correct) {
  if (!studentName || !item) return;
  const all = loadAll(studentName);
  const prev = all[item] || { box: 0, right: 0, wrong: 0, last: null, due: null };
  let box = typeof prev.box === "number" ? prev.box : 0;

  if (correct) {
    box = Math.min(MAX_BOX, box + 1);
  } else {
    box = 0;
  }

  const today = dayString(new Date());
  all[item] = {
    box,
    right: (prev.right || 0) + (correct ? 1 : 0),
    wrong: (prev.wrong || 0) + (correct ? 0 : 1),
    last: today,
    due: addDays(INTERVALS[box]),
  };
  saveAll(studentName, all);
}

// ── 오늘 복습할 항목 목록 (due <= 오늘) ──
//   pool: 후보 항목 배열 (예: 52글자). 주면 그 안에서만 고름.
//   limit: 최대 개수
export function getDueItems(studentName, pool = null, limit = 10) {
  const all = loadAll(studentName);
  const today = dayString(new Date());
  const entries = Object.keys(all).filter(item => {
    if (pool && !pool.includes(item)) return false;
    const rec = all[item];
    if (!rec || !rec.due) return false;
    return rec.due <= today; // 복습일이 오늘이거나 지났으면
  });
  // box 낮은 것(=덜 익숙한 것) 먼저, 그다음 오래된 것 먼저
  entries.sort((a, b) => {
    const ra = all[a], rb = all[b];
    if ((ra.box || 0) !== (rb.box || 0)) return (ra.box || 0) - (rb.box || 0);
    return (ra.due || "").localeCompare(rb.due || "");
  });
  return entries.slice(0, limit);
}

// ── 아직 한 번도 안 배운 항목 (pool 중 기록 없는 것) ──
export function getNewItems(studentName, pool, limit = 10) {
  if (!Array.isArray(pool)) return [];
  const all = loadAll(studentName);
  const fresh = pool.filter(item => !all[item]);
  return fresh.slice(0, limit);
}

// ── 복습 통계 (대시보드/뱃지용) ──
export function getReviewStats(studentName, pool = null) {
  const all = loadAll(studentName);
  const today = dayString(new Date());
  let learned = 0, due = 0, mastered = 0;
  const keys = pool ? pool : Object.keys(all);
  keys.forEach(item => {
    const rec = all[item];
    if (!rec) return;
    learned++;
    if (rec.due && rec.due <= today) due++;
    if ((rec.box || 0) >= MAX_BOX) mastered++;
  });
  return { learned, due, mastered, total: pool ? pool.length : learned };
}

// ── 특정 항목의 현재 상태 (디버그/표시용) ──
export function getItemStatus(studentName, item) {
  const all = loadAll(studentName);
  return all[item] || null;
}

// 테스트/관리용: 전체 초기화
export function clearReview(studentName) {
  if (typeof window === "undefined" || !studentName) return;
  try { window.localStorage.removeItem(keyFor(studentName)); } catch {}
}

// 내부 함수도 테스트에서 쓸 수 있게 노출 (순수 함수)
export const _internal = { INTERVALS, MAX_BOX, dayString, addDays };
