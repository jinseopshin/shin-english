// ══════════════════════════════════════════════════════════════════════════
//   🖼️ phonicsImages.js — 단어 → Cloudinary URL 매핑
//   v4.5 — Public ID에서 폴더 접두사 제거 (Cloudinary 실제 ID에 맞춤)
// ══════════════════════════════════════════════════════════════════════════

const CLOUDINARY_BASE = "https://res.cloudinary.com/dfgyp3ovs/image/upload/";

// 이미지 변환 옵션 (자동 최적화)
const TRANSFORM = "f_auto,q_auto,w_400,h_300,c_fill/";

// ── 단어 → Cloudinary public_id 매핑 ──
// 진섭님 Cloudinary는 폴더에 있어도 Public ID에 폴더명 없이 단어만 사용
const WORD_TO_PUBLIC_ID = {
  // ═══ Level 1: 알파벳 26개 ═══
  apple:    "apple",
  ball:     "ball",
  cat:      "cat",
  dog:      "dog",
  egg:      "egg",
  fish:     "fish",
  goat:     "goat",
  hat:      "hat",
  igloo:    "igloo",
  jam:      "jam",
  king:     "king",
  lion:     "lion",
  moon:     "moon",
  nose:     "nose",
  octopus:  "octopus",
  pig:      "pig",
  queen:    "queen",
  rabbit:   "rabbit",
  sun:      "sun",
  tiger:    "tiger",
  umbrella: "umbrella",
  violin:   "violin",
  watch:    "watch",
  box:      "box",
  yellow:   "yellow",
  zebra:    "zebra",

  // ═══ Level 2: CVC 전체 ═══
  // Short A
  bat:      "bat",
  rat:      "rat",
  mat:      "mat",
  bag:      "bag",
  map:      "map",
  cap:      "cap",
  fan:      "fan",
  can:      "can",
  // Short E
  bed:      "bed",
  hen:      "hen",
  pen:      "pen",
  ten:      "ten",
  red:      "red",
  leg:      "leg",
  net:      "net",
  web:      "web",
  // Short I
  six:      "six",
  lip:      "lip",
  kid:      "kid",
  pin:      "pin",
  milk:     "milk",
  // Short O
  fox:      "fox",
  pot:      "pot",
  log:      "log",
  mop:      "mop",
  rock:     "rock",
  frog:     "frog",
  // Short U
  bus:      "bus",
  cup:      "cup",
  duck:     "duck",
  nut:      "nut",
  bug:      "bug",
  drum:     "drum",
  mug:      "mug",

  // ═══ Level 3: Magic E 6개 ═══
  cape:     "cape",
  tape:     "tape",
  kite:     "kite",
  pine:     "pine",
  ride:     "ride",
  tube:     "tube",

  // ═══ Level 4: Blends (대기 중) ═══
  // 완료한 단어만 주석 해제하세요
  // chair:    "chair",
  // cheese:   "cheese",
  // chicken:  "chicken",
  // child:    "child",
  // chocolate:"chocolate",
  // ship:     "ship",
  // shoe:     "shoe",
  // shark:    "shark",
  // sheep:    "sheep",
  // shell:    "shell",
  // thumb:    "thumb",
  // three:    "three",
  // blue:     "blue",
  // black:    "black",
  // block:    "block",
  // blanket:  "blanket",
  // star:     "star",
  // stone:    "stone",
  // stairs:   "stairs",
  // fruit:    "fruit",
};

// ── 메인 함수: 단어로 이미지 URL 가져오기 ──
export function getCuratedImageUrl(word) {
  if (!word) return null;
  const key = word.toLowerCase().trim();
  const publicId = WORD_TO_PUBLIC_ID[key];
  if (!publicId) return null;
  return `${CLOUDINARY_BASE}${TRANSFORM}${publicId}`;
}

// ── 단어가 큐레이션 되어 있는지 확인 ──
export function hasCuratedImage(word) {
  if (!word) return false;
  return WORD_TO_PUBLIC_ID[word.toLowerCase().trim()] !== undefined;
}
