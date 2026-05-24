// ══════════════════════════════════════════════════════════════════════════
//   👄 soundHints.js — 알파벳 26개 발음(소리) 힌트
//   입모양·동작 중심 (한글 음가에 기대지 않음 — 발음 간섭 방지)
//   각 항목:
//     sound : 음가 표기 (게임의 current.sound 와 별개로 참고용)
//     mouth : 입/혀/이 움직임을 아이 눈높이로 설명
//     tip   : (선택) 한 단어로 핵심 동작
// ══════════════════════════════════════════════════════════════════════════

export const SOUND_HINTS = {
  // 모음 ── 입을 벌리는 정도로 설명
  a: { sound: "/æ/", mouth: "입을 크게 벌리고 '애~' 하듯 소리 내요", tip: "입 크게" },
  e: { sound: "/e/", mouth: "입을 옆으로 살짝 벌려요", tip: "옆으로" },
  i: { sound: "/ɪ/", mouth: "입을 조금만 벌리고 짧게 소리 내요", tip: "조금만" },
  o: { sound: "/ɒ/", mouth: "입을 동그랗게 벌려요", tip: "동그랗게" },
  u: { sound: "/ʌ/", mouth: "입에 힘을 빼고 짧게 소리 내요", tip: "힘 빼고" },

  // 자음 ── 혀·입술·이 위치로 설명
  b: { sound: "/b/", mouth: "두 입술을 붙였다가 톡! 터뜨려요", tip: "입술 톡" },
  c: { sound: "/k/", mouth: "혀 뒤쪽을 입천장에 댔다 떼며 '크'", tip: "목 안쪽" },
  d: { sound: "/d/", mouth: "혀끝을 윗니 뒤에 댔다가 떼요", tip: "혀끝" },
  f: { sound: "/f/", mouth: "윗니를 아랫입술에 살짝 대고 바람을 후~", tip: "이+입술" },
  g: { sound: "/g/", mouth: "혀 뒤쪽을 입천장에 댔다 떼며 '그'", tip: "목 안쪽" },
  h: { sound: "/h/", mouth: "입을 열고 따뜻한 바람을 하~ 불어요", tip: "하~ 바람" },
  j: { sound: "/dʒ/", mouth: "혀를 입천장에 붙였다 떼며 '쥬' 느낌", tip: "혀 붙여" },
  k: { sound: "/k/", mouth: "혀 뒤쪽을 입천장에 댔다 떼며 '크'", tip: "목 안쪽" },
  l: { sound: "/l/", mouth: "혀끝을 윗니 뒤에 콕 붙이고 소리 내요", tip: "혀끝 콕" },
  m: { sound: "/m/", mouth: "입을 다물고 코로 음~ 소리 내요", tip: "입 다물고" },
  n: { sound: "/n/", mouth: "혀끝을 윗니 뒤에 대고 코로 응~", tip: "혀끝+코" },
  p: { sound: "/p/", mouth: "두 입술을 붙였다가 바람과 함께 파!", tip: "입술 파!" },
  q: { sound: "/kw/", mouth: "'크'를 내고 입술을 동그랗게 모아 '우'", tip: "크+우" },
  r: { sound: "/r/", mouth: "혀를 입 안에서 뒤로 말아 올려요", tip: "혀 말아" },
  s: { sound: "/s/", mouth: "이를 모으고 뱀처럼 스~ 바람 소리", tip: "스~ 뱀" },
  t: { sound: "/t/", mouth: "혀끝을 윗니 뒤에 댔다 톡 떼요", tip: "혀끝 톡" },
  v: { sound: "/v/", mouth: "윗니를 아랫입술에 대고 떨며 브~", tip: "이+떨림" },
  w: { sound: "/w/", mouth: "입술을 동그랗게 모아 '우'에서 시작해요", tip: "입술 동그랗게" },
  x: { sound: "/ks/", mouth: "'크'와 '스'를 빠르게 이어 소리 내요", tip: "크+스" },
  y: { sound: "/j/", mouth: "혀를 입천장 가까이 올리고 '이'에서 시작", tip: "이에서" },
  z: { sound: "/z/", mouth: "이를 모으고 벌처럼 즈~ 떨며 소리", tip: "즈~ 벌" },
};

export function getSoundHint(letter) {
  if (!letter) return null;
  return SOUND_HINTS[letter.toLowerCase()] || null;
}
