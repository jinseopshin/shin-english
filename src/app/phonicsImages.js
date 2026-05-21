// ══════════════════════════════════════════════════════════════════════════
//   🖼️ phonicsImages.js — 단어 → Cloudinary URL 매핑
//   v4.8 — f_auto 제거 (포맷 자동 감지 오류 회피)
// ══════════════════════════════════════════════════════════════════════════

const CLOUDINARY_BASE = "https://res.cloudinary.com/dfgyp3ovs/image/upload/";

// ⚠️ v4.8 변경: f_auto, q_auto 제거
// 일부 PNG 파일을 gif로 잘못 감지하는 버그 회피
// 크기 조정만 유지
const TRANSFORM = "w_400,h_300,c_fill/";

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
  bat: "bat", rat: "rat", mat: "mat", bag: "bag", map: "map", cap: "cap", fan: "fan", can: "can",
  bed: "bed", hen: "hen", pen: "pen", ten: "ten", red: "red", leg: "leg", net: "net", web: "web",
  six: "six", lip: "lip", kid: "kid", pin: "pin", milk: "milk",
  fox: "fox", pot: "pot", log: "log", mop: "mop", rock: "rock", frog: "frog",
  bus: "bus", cup: "cup", duck: "duck", nut: "nut", bug: "bug", drum: "drum", mug: "mug",

  // ═══ Level 3: Magic E 30개 전체 ═══
  cape: "cape", tape: "tape", kite: "kite", pine: "pine", ride: "ride", tube: "tube",
  mad: "mad", made: "made", tap: "tap", rate: "rate", fad: "fad", fade: "fade",
  bit: "bit", bite: "bite", kit: "kit", rid: "rid", hid: "hid", hide: "hide",
  hop: "hop", hope: "hope", rod: "rod", rode: "rode", not: "not", note: "note",
  cut: "cut", cute: "cute", tub: "tub",

  // ═══ Level 4: Blends (대기 중) ═══
  // chair: "chair", cheese: "cheese", chicken: "chicken", child: "child", chocolate: "chocolate",
  // ship: "ship", shoe: "shoe", shark: "shark", sheep: "sheep", shell: "shell",
  // thumb: "thumb", three: "three", blue: "blue", black: "black", block: "block", blanket: "blanket",
  // star: "star", stone: "stone", stairs: "stairs", fruit: "fruit",
};

export function getCuratedImageUrl(word) {
  if (!word) return null;
  const key = word.toLowerCase().trim();
  const publicId = WORD_TO_PUBLIC_ID[key];
  if (!publicId) return null;
  return `${CLOUDINARY_BASE}${TRANSFORM}${publicId}`;
}

export function hasCuratedImage(word) {
  if (!word) return false;
  return WORD_TO_PUBLIC_ID[word.toLowerCase().trim()] !== undefined;
}
