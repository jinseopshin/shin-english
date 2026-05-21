// ══════════════════════════════════════════════════════════════════════════
//   🎨 pixabayImage.js — Pixabay API 이미지 로딩 헬퍼 (v3)
//
//   - 일러스트(image_type=illustration) 우선 검색
//   - 일러스트 없으면 vector 시도
//   - 둘 다 없으면 사진(photo) 폴백
//   - 모두 실패 시 null 반환 (호출 측에서 이모지 폴백)
//
//   환경변수: NEXT_PUBLIC_PIXABAY_API_KEY
//   - Vercel: Settings > Environment Variables 에 추가
//   - 로컬: .env.local 파일에 추가
//
//   무료 한도: 5,000 requests/hour
// ══════════════════════════════════════════════════════════════════════════

const PIXABAY_API = "https://pixabay.com/api/";
const CACHE_PREFIX = "pixabay_img_";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7일 캐싱

// ── 단어 → Pixabay 검색어 매핑 (그림 가능한 구체 명사만) ──
const SEARCH_OVERRIDES = {
  // 동물 - 귀여운 일러스트 잘 나오는 키워드
  bat:    "bat cute",
  rat:    "rat mouse cute",
  hen:    "hen chicken",
  fox:    "fox cartoon",
  pig:    "pig pink",
  cat:    "cat cute",
  dog:    "dog cute",
  goat:   "goat farm",
  duck:   "duck yellow",
  frog:   "frog green cute",
  bug:    "ladybug cute",
  // 사물 - 동음이의어 회피
  mat:    "yoga mat",
  bag:    "school bag",
  cap:    "baseball cap",
  fan:    "electric fan",
  can:    "soda can",
  pen:    "pen writing",
  net:    "fishing net",
  web:    "spider web cute",  // 거미 대신 거미줄 위주
  pot:    "cooking pot",
  log:    "wood log",
  mop:    "mop cleaning",
  bus:    "school bus yellow",
  cup:    "cup tea",
  nut:    "nut walnut",
  mug:    "mug coffee",
  rock:   "rock stone",
  drum:   "drum music",
  // 알파벳 대표 단어
  apple:  "apple red",
  ball:   "ball colorful",
  egg:    "egg",
  fish:   "fish cute",
  hat:    "hat",
  igloo:  "igloo snow",
  jam:    "jam jar",
  king:   "king crown",
  lion:   "lion cute",
  moon:   "moon stars",
  nose:   "nose face",
  octopus:"octopus cute",
  queen:  "queen crown",
  rabbit: "rabbit cute",
  sun:    "sun cute",
  tiger:  "tiger cute",
  umbrella:"umbrella colorful",
  violin: "violin music",
  watch:  "watch wrist",
  box:    "gift box",
  yellow: "yellow color",
  zebra:  "zebra cute",
  // CVC 추가
  kid:    "kid child happy",
  pin:    "pin push",
  fish:   "fish swimming",
  six:    "number six 6",
  lip:    "lips smile",
  milk:   "milk glass",
  // Magic E - 구체 명사
  cape:   "superhero cape",
  tape:   "tape roll",
  kite:   "kite flying colorful",
  pine:   "pine tree",
  tube:   "tube",
  // Blends - 구체 명사
  chair:  "chair",
  cheese: "cheese yellow",
  chicken:"chicken cute",
  child:  "happy child",
  chocolate:"chocolate bar",
  ship:   "ship boat",
  shoe:   "shoe pair",
  shark:  "shark cute",
  sheep:  "sheep cute",
  shell:  "seashell beach",
  thumb:  "thumb up",
  three:  "number three 3",
  blue:   "blue color",
  black:  "black color",
  block:  "toy blocks",
  blanket:"blanket cozy",
  star:   "yellow star",
  stone:  "stone pebble",
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

// ── Pixabay API 단일 호출 ──
async function searchPixabay(apiKey, searchTerm, imageType) {
  const params = new URLSearchParams({
    key: apiKey,
    q: searchTerm,
    image_type: imageType,    // "illustration" | "vector" | "photo"
    safesearch: "true",        // 안전 검색 필수 (어린이용)
    per_page: "3",
    orientation: "horizontal",
  });
  const url = `${PIXABAY_API}?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.hits || data.hits.length === 0) return null;
  // webformatURL: 적당한 크기 (640px 정도), previewURL: 작은 미리보기 (150px)
  return data.hits[0].webformatURL || data.hits[0].previewURL || null;
}

// ── 메인 함수: 단어로 이미지 URL 가져오기 ──
// 일러스트 우선 → 벡터 → 사진 순서로 폴백
export async function fetchWordImage(word) {
  if (!word) return null;
  const key = word.toLowerCase().trim();

  // 1) 캐시 체크
  const cached = getCachedImage(key);
  if (cached === "__MISS__") return null;
  if (cached) return cached;

  // 2) API 키 체크
  const apiKey = process.env.NEXT_PUBLIC_PIXABAY_API_KEY;
  if (!apiKey) {
    console.warn("[pixabayImage] NEXT_PUBLIC_PIXABAY_API_KEY 미설정");
    return null;
  }

  // 3) 검색어 결정
  const searchTerm = SEARCH_OVERRIDES[key] || key;

  // 4) 일러스트 → 벡터 → 사진 순으로 시도
  try {
    let imgUrl = await searchPixabay(apiKey, searchTerm, "illustration");
    if (!imgUrl) {
      imgUrl = await searchPixabay(apiKey, searchTerm, "vector");
    }
    if (!imgUrl) {
      imgUrl = await searchPixabay(apiKey, searchTerm, "photo");
    }
    if (!imgUrl) {
      setCachedMiss(key);
      return null;
    }
    setCachedImage(key, imgUrl);
    return imgUrl;
  } catch (err) {
    console.warn("[pixabayImage] fetch 실패:", err.message);
    setCachedMiss(key);
    return null;
  }
}

// ── 디버그용: 캐시 초기화 ──
export function clearImageCache() {
  if (typeof window === "undefined") return;
  try {
    const keys = Object.keys(window.sessionStorage);
    keys.forEach(k => {
      if (k.startsWith(CACHE_PREFIX) || k.startsWith("pexels_img_")) {
        window.sessionStorage.removeItem(k);
      }
    });
  } catch {}
}
