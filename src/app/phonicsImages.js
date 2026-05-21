// ══════════════════════════════════════════════════════════════════════════
//   🖼️ phonicsImages.js — 단어 → Cloudinary URL 매핑 (수동 큐레이션)
//
//   이 파일은 phonics_image_curation.xlsx의 H열 데이터를 옮긴 결과입니다.
//   각 단어마다 검증된 Cloudinary 이미지 URL이 매핑되어 있어요.
//
//   추가/변경 방법:
//   1. Cloudinary에 새 이미지 업로드
//   2. URL 복사
//   3. 아래 객체에 단어: URL 추가
// ══════════════════════════════════════════════════════════════════════════

// ── Cloudinary base URL (사용자 ID 부분만 한 번 정의) ──
// 예: "https://res.cloudinary.com/dXXXXXXXX/image/upload/"
// 진섭님의 Cloudinary 계정 URL로 교체하세요
const CLOUDINARY_BASE = "https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/";

// ── 이미지 변환 옵션 (자동 최적화) ──
// f_auto: 브라우저에 맞춰 WebP/AVIF 자동 변환
// q_auto: 화질 자동 조정 (대역폭 절약)
// w_400,h_300,c_fill: 400x300 고정 크기로 자동 자르기
const TRANSFORM = "f_auto,q_auto,w_400,h_300,c_fill/";

// ── 단어 → Cloudinary public_id 매핑 ──
// 파일을 cat.jpg, dog.jpg 식으로 업로드했다면 그대로 단어명만 적으면 됨
// 다른 이름으로 업로드했다면 실제 public_id로 변경
const WORD_TO_PUBLIC_ID = {
  // ── Level 1: 알파벳 ──
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

  // ── Level 2: CVC ──
  bat:      "bat",
  rat:      "rat",
  mat:      "mat",
  bag:      "bag",
  map:      "map",
  cap:      "cap",
  fan:      "fan",
  can:      "can",
  bed:      "bed",
  hen:      "hen",
  pen:      "pen",
  ten:      "ten",
  red:      "red",
  leg:      "leg",
  net:      "net",
  web:      "web",
  six:      "six",
  lip:      "lip",
  kid:      "kid",
  pin:      "pin",
  milk:     "milk",
  fox:      "fox",
  pot:      "pot",
  log:      "log",
  mop:      "mop",
  rock:     "rock",
  frog:     "frog",
  bus:      "bus",
  cup:      "cup",
  duck:     "duck",
  nut:      "nut",
  bug:      "bug",
  drum:     "drum",
  mug:      "mug",

  // ── Level 3: Magic E ──
  cape:     "cape",
  tape:     "tape",
  kite:     "kite",
  pine:     "pine",
  ride:     "ride",
  tube:     "tube",

  // ── Level 4: Blends ──
  chair:    "chair",
  cheese:   "cheese",
  chicken:  "chicken",
  child:    "child",
  chocolate:"chocolate",
  ship:     "ship",
  shoe:     "shoe",
  shark:    "shark",
  sheep:    "sheep",
  shell:    "shell",
  thumb:    "thumb",
  three:    "three",
  blue:     "blue",
  black:    "black",
  block:    "block",
  blanket:  "blanket",
  star:     "star",
  stone:    "stone",
  stairs:   "stairs",
  fruit:    "fruit",
};

// ── 메인 함수: 단어로 이미지 URL 가져오기 ──
export function getCuratedImageUrl(word) {
  if (!word) return null;
  const key = word.toLowerCase().trim();
  const publicId = WORD_TO_PUBLIC_ID[key];
  if (!publicId) return null;
  // 이미지 확장자 .jpg 가정 (Cloudinary는 자동으로 처리)
  return `${CLOUDINARY_BASE}${TRANSFORM}${publicId}.jpg`;
}

// ── 단어가 큐레이션 되어 있는지 확인 ──
export function hasCuratedImage(word) {
  if (!word) return false;
  return WORD_TO_PUBLIC_ID[word.toLowerCase().trim()] !== undefined;
}
