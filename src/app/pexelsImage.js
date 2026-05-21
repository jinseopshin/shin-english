// ══════════════════════════════════════════════════════════════════════════
//   🖼️ pexelsImage.js — Pexels API 이미지 로딩 헬퍼 (v2)
//
//   - 단어를 검색해 어린이 친화적 이미지 1장 반환
//   - sessionStorage 캐싱으로 같은 단어 재호출 방지
//   - 실패 시 null 반환 (호출 측에서 이모지 폴백)
//
//   v2 변경: 추상 단어 매핑 제거 (이제 그림 게임에서 추상 단어 자체를 제외)
//   환경변수: NEXT_PUBLIC_PEXELS_API_KEY
// ══════════════════════════════════════════════════════════════════════════

const PEXELS_API = "https://api.pexels.com/v1/search";
const CACHE_PREFIX = "pexels_img_";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7일 캐싱

// ── 단어 → Pexels 검색어 매핑 (그림 가능한 구체 명사만) ──
const SEARCH_OVERRIDES = {
  // 동물 - 명확한 키워드로
  bat:    "fruit bat animal",
  rat:    "rat rodent cute",
  hen:    "hen chicken farm",
  fox:    "fox animal",
  pig:    "pig farm pink",
  cat:    "cute cat kitten",
  dog:    "cute dog puppy",
  goat:   "goat farm",
  duck:   "duck pond",
  frog:   "green frog",
  bug:    "ladybug insect",
  // 사물 - 동음이의어 회피
  mat:    "yoga mat",
  bag:    "school backpack",
  cap:    "baseball cap",
  fan:    "electric fan",
  can:    "soda can drink",
  pen:    "writing pen",
  net:    "fishing net",
  web:    "spider web silk",
  pot:    "cooking pot",
  log:    "wood log forest",
  mop:    "cleaning mop",
  bus:    "yellow school bus",
  cup:    "tea cup",
  nut:    "walnut peanut",
  mug:    "coffee mug",
  rock:   "rock stone gray",
  drum:   "drum musical instrument",
  // 알파벳 대표 단어
  apple:  "red apple fruit",
  ball:   "colorful ball",
  egg:    "white egg",
  fish:   "fish swimming",
  hat:    "wool hat",
  igloo:  "igloo snow house",
  jam:    "strawberry jam jar",
  king:   "king crown",
  lion:   "lion animal",
  moon:   "moon night",
  nose:   "human nose face",
  octopus:"octopus sea",
  queen:  "queen crown",
  rabbit: "rabbit bunny",
  sun:    "sun bright sky",
  tiger:  "tiger animal",
  umbrella:"colorful umbrella",
  violin: "violin instrument",
  watch:  "wrist watch",
  box:    "cardboard box",
  yellow: "yellow color paint",
  zebra:  "zebra animal",
  // CVC 추가
  kid:    "happy child kid",
  pin:    "push pin",
  // Magic E - 구체 명사만
  cape:   "superhero cape",
  tape:   "tape roll",
  kite:   "flying kite",
  pine:   "pine tree",
  tube:   "rubber tube",
  // Blends - 구체 명사만
  chair:  "chair furniture",
  cheese: "cheese yellow",
  chicken:"chicken bird",
  child:  "happy child",
  chocolate:"chocolate bar",
  ship:   "big ship sea",
  shoe:   "shoe pair",
  shark:  "shark ocean",
  sheep:  "sheep farm",
  shell:  "sea shell",
  thumb:  "thumb up hand",
  three:  "number three",
  blue:   "blue color sky",
  black:  "black color",
  block:  "toy blocks",
  blanket:"blanket cozy",
  star:   "yellow star",
  stone:  "stone rock",
  stairs: "stairs steps",
  fruit:  "fresh fruit",
};

function getCachedImage(word) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CACHE_PREFIX + word);
    if (!raw) return null;
    const { url, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) {
      window.sessionStorage.removeItem(CACHE_PREFIX + word);
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

function setCachedImage(word, url) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      CACHE_PREFIX + word,
      JSON.stringify({ url, ts: Date.now() })
    );
  } catch {}
}

function setCachedMiss(word) {
  setCachedImage(word, "__MISS__");
}

// ── 메인 함수: 단어로 이미지 URL 가져오기 ──
export async function fetchWordImage(word) {
  if (!word) return null;
  const key = word.toLowerCase().trim();

  const cached = getCachedImage(key);
  if (cached === "__MISS__") return null;
  if (cached) return cached;

  const apiKey = process.env.NEXT_PUBLIC_PEXELS_API_KEY;
  if (!apiKey) {
    console.warn("[pexelsImage] NEXT_PUBLIC_PEXELS_API_KEY 미설정");
    return null;
  }

  const searchTerm = SEARCH_OVERRIDES[key] || key;

  try {
    const url = `${PEXELS_API}?query=${encodeURIComponent(searchTerm)}&per_page=3&orientation=square`;
    const res = await fetch(url, {
      headers: { Authorization: apiKey }
    });
    if (!res.ok) {
      console.warn("[pexelsImage] API 오류:", res.status);
      setCachedMiss(key);
      return null;
    }
    const data = await res.json();
    const photo = data.photos?.[0];
    if (!photo) {
      setCachedMiss(key);
      return null;
    }
    const imgUrl = photo.src.medium || photo.src.small || photo.src.original;
    setCachedImage(key, imgUrl);
    return imgUrl;
  } catch (err) {
    console.warn("[pexelsImage] fetch 실패:", err.message);
    setCachedMiss(key);
    return null;
  }
}

export function clearImageCache() {
  if (typeof window === "undefined") return;
  try {
    const keys = Object.keys(window.sessionStorage);
    keys.forEach(k => {
      if (k.startsWith(CACHE_PREFIX)) {
        window.sessionStorage.removeItem(k);
      }
    });
  } catch {}
}
