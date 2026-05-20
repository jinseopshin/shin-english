// ══════════════════════════════════════════════════════════════════════════
//   🔤 phonicsData.js — 파닉스 학습 데이터
//   유치부(5-7세) 대상 · Phonics Kids / Smart Phonics 커리큘럼 기반
//
//   각 단어에는 영어, 한글 뜻, 이모지(그림), 첫글자가 포함됨
//   이모지는 TTS와 함께 시각적 단서 제공
// ══════════════════════════════════════════════════════════════════════════

// ── Level 1: 알파벳 26개 (대표 단어 + 이모지) ──
export const ALPHABET_DATA = [
  { letter: "A", sound: "/æ/", word: "apple",     ko: "사과",     emoji: "🍎" },
  { letter: "B", sound: "/b/", word: "ball",      ko: "공",       emoji: "⚽" },
  { letter: "C", sound: "/k/", word: "cat",       ko: "고양이",   emoji: "🐱" },
  { letter: "D", sound: "/d/", word: "dog",       ko: "개",       emoji: "🐶" },
  { letter: "E", sound: "/e/", word: "egg",       ko: "달걀",     emoji: "🥚" },
  { letter: "F", sound: "/f/", word: "fish",      ko: "물고기",   emoji: "🐟" },
  { letter: "G", sound: "/g/", word: "goat",      ko: "염소",     emoji: "🐐" },
  { letter: "H", sound: "/h/", word: "hat",       ko: "모자",     emoji: "🎩" },
  { letter: "I", sound: "/ɪ/", word: "igloo",     ko: "이글루",   emoji: "🏔️" },
  { letter: "J", sound: "/ʤ/", word: "jam",       ko: "잼",       emoji: "🍯" },
  { letter: "K", sound: "/k/", word: "king",      ko: "왕",       emoji: "👑" },
  { letter: "L", sound: "/l/", word: "lion",      ko: "사자",     emoji: "🦁" },
  { letter: "M", sound: "/m/", word: "moon",      ko: "달",       emoji: "🌙" },
  { letter: "N", sound: "/n/", word: "nose",      ko: "코",       emoji: "👃" },
  { letter: "O", sound: "/ɒ/", word: "octopus",   ko: "문어",     emoji: "🐙" },
  { letter: "P", sound: "/p/", word: "pig",       ko: "돼지",     emoji: "🐷" },
  { letter: "Q", sound: "/kw/", word: "queen",    ko: "여왕",     emoji: "👸" },
  { letter: "R", sound: "/r/", word: "rabbit",    ko: "토끼",     emoji: "🐰" },
  { letter: "S", sound: "/s/", word: "sun",       ko: "태양",     emoji: "☀️" },
  { letter: "T", sound: "/t/", word: "tiger",     ko: "호랑이",   emoji: "🐯" },
  { letter: "U", sound: "/ʌ/", word: "umbrella",  ko: "우산",     emoji: "☂️" },
  { letter: "V", sound: "/v/", word: "violin",    ko: "바이올린", emoji: "🎻" },
  { letter: "W", sound: "/w/", word: "watch",     ko: "시계",     emoji: "⌚" },
  { letter: "X", sound: "/ks/", word: "box",      ko: "상자",     emoji: "📦" },
  { letter: "Y", sound: "/j/", word: "yellow",    ko: "노란색",   emoji: "💛" },
  { letter: "Z", sound: "/z/", word: "zebra",     ko: "얼룩말",   emoji: "🦓" },
];

// ── Level 2: 단모음 CVC 단어 (Short Vowels) ──
export const CVC_DATA = {
  a: [ // Short A — /æ/
    { word: "cat",  ko: "고양이",   emoji: "🐱" },
    { word: "bat",  ko: "박쥐/방망이", emoji: "🦇" },
    { word: "hat",  ko: "모자",     emoji: "🎩" },
    { word: "rat",  ko: "쥐",       emoji: "🐀" },
    { word: "mat",  ko: "매트",     emoji: "🟫" },
    { word: "bag",  ko: "가방",     emoji: "👜" },
    { word: "map",  ko: "지도",     emoji: "🗺️" },
    { word: "cap",  ko: "모자",     emoji: "🧢" },
    { word: "fan",  ko: "선풍기",   emoji: "🌀" },
    { word: "can",  ko: "캔",       emoji: "🥫" },
    { word: "dad",  ko: "아빠",     emoji: "👨" },
    { word: "ham",  ko: "햄",       emoji: "🍖" },
  ],
  e: [ // Short E — /e/
    { word: "bed",  ko: "침대",     emoji: "🛏️" },
    { word: "egg",  ko: "달걀",     emoji: "🥚" },
    { word: "hen",  ko: "암탉",     emoji: "🐔" },
    { word: "pen",  ko: "펜",       emoji: "🖊️" },
    { word: "ten",  ko: "10",       emoji: "🔟" },
    { word: "red",  ko: "빨강",     emoji: "🟥" },
    { word: "leg",  ko: "다리",     emoji: "🦵" },
    { word: "net",  ko: "그물",     emoji: "🕸️" },
    { word: "web",  ko: "거미줄",   emoji: "🕷️" },
    { word: "wet",  ko: "젖은",     emoji: "💦" },
  ],
  i: [ // Short I — /ɪ/
    { word: "pig",  ko: "돼지",     emoji: "🐷" },
    { word: "big",  ko: "큰",       emoji: "📏" },
    { word: "fish", ko: "물고기",   emoji: "🐟" },
    { word: "six",  ko: "6",        emoji: "6️⃣" },
    { word: "lip",  ko: "입술",     emoji: "👄" },
    { word: "hit",  ko: "치다",     emoji: "👊" },
    { word: "sit",  ko: "앉다",     emoji: "🪑" },
    { word: "kid",  ko: "아이",     emoji: "🧒" },
    { word: "win",  ko: "이기다",   emoji: "🏆" },
    { word: "pin",  ko: "핀",       emoji: "📍" },
    { word: "bib",  ko: "턱받이",   emoji: "🍼" },
    { word: "milk", ko: "우유",     emoji: "🥛" },
  ],
  o: [ // Short O — /ɒ/
    { word: "dog",  ko: "개",       emoji: "🐶" },
    { word: "box",  ko: "상자",     emoji: "📦" },
    { word: "fox",  ko: "여우",     emoji: "🦊" },
    { word: "hot",  ko: "뜨거운",   emoji: "🔥" },
    { word: "pot",  ko: "냄비",     emoji: "🍲" },
    { word: "top",  ko: "꼭대기",   emoji: "🔝" },
    { word: "log",  ko: "통나무",   emoji: "🪵" },
    { word: "mop",  ko: "걸레",     emoji: "🧹" },
    { word: "rock", ko: "바위",     emoji: "🪨" },
    { word: "frog", ko: "개구리",   emoji: "🐸" },
  ],
  u: [ // Short U — /ʌ/
    { word: "bus",  ko: "버스",     emoji: "🚌" },
    { word: "cup",  ko: "컵",       emoji: "☕" },
    { word: "sun",  ko: "태양",     emoji: "☀️" },
    { word: "duck", ko: "오리",     emoji: "🦆" },
    { word: "run",  ko: "달리다",   emoji: "🏃" },
    { word: "gun",  ko: "총",       emoji: "🔫" },
    { word: "nut",  ko: "견과류",   emoji: "🥜" },
    { word: "bug",  ko: "벌레",     emoji: "🐛" },
    { word: "drum", ko: "북",       emoji: "🥁" },
    { word: "mug",  ko: "머그컵",   emoji: "🍺" },
  ],
};

// ── Level 3: 장모음 Magic E (Silent E) ──
export const MAGIC_E_DATA = [
  // a_e (long A)
  { short: "cap",  long: "cape",  shortKo: "모자",   longKo: "망토",   emoji: "🦸" },
  { short: "mad",  long: "made",  shortKo: "화난",   longKo: "만들었다", emoji: "🛠️" },
  { short: "tap",  long: "tape",  shortKo: "두드리다", longKo: "테이프", emoji: "📼" },
  { short: "rat",  long: "rate",  shortKo: "쥐",     longKo: "비율",   emoji: "📊" },
  { short: "fad",  long: "fade",  shortKo: "유행",   longKo: "사라지다", emoji: "🌫️" },
  // i_e (long I)
  { short: "bit",  long: "bite",  shortKo: "조금",   longKo: "물다",   emoji: "🦷" },
  { short: "kit",  long: "kite",  shortKo: "도구",   longKo: "연",     emoji: "🪁" },
  { short: "rid",  long: "ride",  shortKo: "제거하다", longKo: "타다",   emoji: "🚲" },
  { short: "pin",  long: "pine",  shortKo: "핀",     longKo: "소나무", emoji: "🌲" },
  { short: "hid",  long: "hide",  shortKo: "숨겼다", longKo: "숨다",   emoji: "🙈" },
  // o_e (long O)
  { short: "hop",  long: "hope",  shortKo: "뛰다",   longKo: "희망",   emoji: "🌈" },
  { short: "rod",  long: "rode",  shortKo: "막대",   longKo: "탔다",   emoji: "🐴" },
  { short: "not",  long: "note",  shortKo: "아니다", longKo: "메모",   emoji: "📝" },
  // u_e (long U)
  { short: "cut",  long: "cute",  shortKo: "자르다", longKo: "귀여운", emoji: "🥰" },
  { short: "tub",  long: "tube",  shortKo: "욕조",   longKo: "튜브",   emoji: "🛁" },
];

// ── Level 4: 자음 콤보 (Blends & Digraphs) ──
export const BLENDS_DATA = {
  ch: [ // /tʃ/
    { word: "chair",  ko: "의자",       emoji: "🪑" },
    { word: "cheese", ko: "치즈",       emoji: "🧀" },
    { word: "chicken",ko: "닭",         emoji: "🐔" },
    { word: "child",  ko: "아이",       emoji: "🧒" },
    { word: "chocolate", ko: "초콜릿",  emoji: "🍫" },
  ],
  sh: [ // /ʃ/
    { word: "ship",   ko: "배",         emoji: "🚢" },
    { word: "shoe",   ko: "신발",       emoji: "👟" },
    { word: "shark",  ko: "상어",       emoji: "🦈" },
    { word: "sheep",  ko: "양",         emoji: "🐑" },
    { word: "shell",  ko: "조개",       emoji: "🐚" },
  ],
  th: [ // /θ/, /ð/
    { word: "thumb",  ko: "엄지손가락", emoji: "👍" },
    { word: "three",  ko: "3",          emoji: "3️⃣" },
    { word: "think",  ko: "생각하다",   emoji: "🤔" },
    { word: "thirty", ko: "30",         emoji: "🔢" },
    { word: "thick",  ko: "두꺼운",     emoji: "📚" },
  ],
  bl: [ // /bl/
    { word: "blue",   ko: "파랑",       emoji: "🔵" },
    { word: "black",  ko: "검정",       emoji: "⚫" },
    { word: "block",  ko: "블록",       emoji: "🧱" },
    { word: "blood",  ko: "피",         emoji: "🩸" },
    { word: "blanket",ko: "담요",       emoji: "🛏️" },
  ],
  st: [ // /st/
    { word: "star",   ko: "별",         emoji: "⭐" },
    { word: "stop",   ko: "멈춤",       emoji: "🛑" },
    { word: "stone",  ko: "돌",         emoji: "🪨" },
    { word: "stairs", ko: "계단",       emoji: "🪜" },
    { word: "story",  ko: "이야기",     emoji: "📖" },
  ],
  fr: [ // /fr/
    { word: "frog",   ko: "개구리",     emoji: "🐸" },
    { word: "fruit",  ko: "과일",       emoji: "🍓" },
    { word: "friend", ko: "친구",       emoji: "👫" },
    { word: "fry",    ko: "튀기다",     emoji: "🍟" },
    { word: "free",   ko: "자유로운",   emoji: "🕊️" },
  ],
};

// ── Level 5: 사이트 워드 (Sight Words — Top 30) ──
// 파닉스 규칙을 안 따르는 자주 쓰이는 단어들
export const SIGHT_WORDS = [
  { word: "the",  ko: "그",         emoji: "👉" },
  { word: "and",  ko: "그리고",     emoji: "➕" },
  { word: "is",   ko: "~이다",      emoji: "✅" },
  { word: "you",  ko: "너",         emoji: "👤" },
  { word: "I",    ko: "나",         emoji: "🙋" },
  { word: "to",   ko: "~에게",      emoji: "➡️" },
  { word: "my",   ko: "나의",       emoji: "✋" },
  { word: "we",   ko: "우리",       emoji: "👥" },
  { word: "he",   ko: "그",         emoji: "👨" },
  { word: "she",  ko: "그녀",       emoji: "👩" },
  { word: "it",   ko: "그것",       emoji: "📦" },
  { word: "go",   ko: "가다",       emoji: "🏃" },
  { word: "see",  ko: "보다",       emoji: "👀" },
  { word: "like", ko: "좋아하다",   emoji: "❤️" },
  { word: "have", ko: "가지다",     emoji: "🤲" },
  { word: "do",   ko: "하다",       emoji: "💪" },
  { word: "in",   ko: "~안에",      emoji: "📥" },
  { word: "on",   ko: "~위에",      emoji: "⬆️" },
  { word: "of",   ko: "~의",        emoji: "🔗" },
  { word: "are",  ko: "~이다",      emoji: "✅" },
  { word: "for",  ko: "~위해",      emoji: "🎁" },
  { word: "with", ko: "~와 함께",   emoji: "🤝" },
  { word: "this", ko: "이것",       emoji: "👇" },
  { word: "that", ko: "저것",       emoji: "👉" },
  { word: "what", ko: "무엇",       emoji: "❓" },
  { word: "be",   ko: "~이다",      emoji: "🌟" },
  { word: "can",  ko: "할 수 있다", emoji: "💪" },
  { word: "all",  ko: "모두",       emoji: "👨‍👩‍👧‍👦" },
  { word: "yes",  ko: "네",         emoji: "✔️" },
  { word: "no",   ko: "아니오",     emoji: "❌" },
];

// ── 단계 메타 정보 ──
export const PHONICS_LEVELS = [
  {
    id: "alphabet",
    label: "알파벳 소리",
    icon: "🔤",
    desc: "A부터 Z까지 26개 글자 소리",
    color: "#4f8ef7",
    bg: "#e8f0ff",
    count: ALPHABET_DATA.length,
  },
  {
    id: "cvc",
    label: "단모음 CVC",
    icon: "🐱",
    desc: "cat, dog, sit 같은 3글자 단어",
    color: "#22c55e",
    bg: "#dcfce7",
    count: Object.values(CVC_DATA).flat().length,
  },
  {
    id: "magic-e",
    label: "Magic E",
    icon: "✨",
    desc: "cap → cape처럼 e가 붙어 소리가 바뀌어요",
    color: "#a855f7",
    bg: "#f3e8ff",
    count: MAGIC_E_DATA.length,
  },
  {
    id: "blends",
    label: "자음 콤보",
    icon: "🔗",
    desc: "ch, sh, th, bl 같은 두 글자 소리",
    color: "#f97316",
    bg: "#fff7ed",
    count: Object.values(BLENDS_DATA).flat().length,
  },
  {
    id: "sight",
    label: "사이트 워드",
    icon: "👀",
    desc: "the, and, is 같은 자주 나오는 단어",
    color: "#ec4899",
    bg: "#fce7f3",
    count: SIGHT_WORDS.length,
  },
];

// ── 헬퍼: 단계별 단어 풀 가져오기 ──
export function getPhonicsWords(levelId) {
  switch (levelId) {
    case "alphabet":
      return ALPHABET_DATA.map(a => ({
        word: a.word, ko: a.ko, emoji: a.emoji, letter: a.letter, sound: a.sound
      }));
    case "cvc":
      return Object.entries(CVC_DATA).flatMap(([vowel, words]) =>
        words.map(w => ({ ...w, vowel }))
      );
    case "magic-e":
      // Magic E는 short/long 쌍이지만, 게임에서는 일반 단어 형식으로 풀어서 반환
      return MAGIC_E_DATA.flatMap(m => [
        { word: m.short, ko: m.shortKo, emoji: m.emoji, pair: m.long, pairKo: m.longKo, type: "short" },
        { word: m.long,  ko: m.longKo,  emoji: m.emoji, pair: m.short, pairKo: m.shortKo, type: "long" },
      ]);
    case "blends":
      return Object.entries(BLENDS_DATA).flatMap(([blend, words]) =>
        words.map(w => ({ ...w, blend }))
      );
    case "sight":
      return SIGHT_WORDS;
    default:
      return [];
  }
}

// ── 헬퍼: 단어의 첫 글자 추출 ──
export function getFirstLetter(word) {
  if (!word) return "";
  return word.charAt(0).toUpperCase();
}

// ── 헬퍼: CVC 빈칸 만들기 (가운데 모음 빼기) ──
export function makeCVCBlank(word) {
  if (!word || word.length !== 3) return { prefix: "", missing: "", suffix: "" };
  return {
    prefix: word.charAt(0),
    missing: word.charAt(1),
    suffix: word.charAt(2),
  };
}

// ── 헬퍼: 알파벳 4지선다 (정답 + 오답 3개) ──
export function makeAlphabetChoices(correctLetter) {
  const all = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const others = all.filter(l => l !== correctLetter.toUpperCase());
  const wrongs = [];
  while (wrongs.length < 3 && others.length > 0) {
    const idx = Math.floor(Math.random() * others.length);
    wrongs.push(others.splice(idx, 1)[0]);
  }
  const choices = [...wrongs, correctLetter.toUpperCase()];
  // 셔플
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices;
}
