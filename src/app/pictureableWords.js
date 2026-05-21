// ══════════════════════════════════════════════════════════════════════════
//   🖼️ pictureableWords.js — "그림 보고 첫글자" 게임용 단어 필터
//
//   5-7세 아이가 그림(실제 사진)으로 인식 가능한 구체적 명사만 통과시킴
//   추상 개념(big, hot, wet), 동사(run, sit, hit), 사이트워드(the, and) 등 제외
// ══════════════════════════════════════════════════════════════════════════

// ── 그림 게임에서 제외할 단어 (추상/동사/형용사/사이트워드) ──
const NON_PICTUREABLE = new Set([
  // CVC - 추상 개념/형용사/동사
  "big", "hot", "wet", "hit", "sit", "win", "run", "top",
  "bib", "dad",  // 너무 모호하거나 부적절한 사진 우려
  "ham",         // 단순 사진 모호
  // Magic E - 추상 개념/동사
  "made", "rate", "fade",
  "bit", "rid", "hid",
  "hope", "rode", "not", "note",
  "cute",
  "tap", "rat",   // Magic E 짧은 형태 중 short 단어
  "mad", "fad",
  "hop", "rod",
  "cut", "tub",
  // Blends - 추상 개념/동사
  "think", "thick", "thirty",
  "blood",       // 어린이에게 부적절
  "fry", "free", "friend",  // 동사/형용사/관계
  "stop", "story",
  // 사이트워드 전체 제외 (대부분 추상)
  "the", "and", "is", "you", "i", "to", "my", "we", "he", "she",
  "it", "go", "see", "like", "have", "do", "in", "on", "of", "are",
  "for", "with", "this", "that", "what", "be", "can", "all", "yes", "no",
]);

// ── 단어가 그림으로 표현 가능한지 확인 ──
export function isPictureable(word) {
  if (!word) return false;
  return !NON_PICTUREABLE.has(word.toLowerCase().trim());
}

// ── 단어 배열에서 그림 가능한 것만 필터링 ──
export function filterPictureableWords(words) {
  if (!Array.isArray(words)) return [];
  return words.filter(w => w && w.word && isPictureable(w.word));
}
