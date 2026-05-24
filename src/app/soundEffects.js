// ══════════════════════════════════════════════════════════════════════════
//   🎮 사운드 & 액션 효과 시스템 (v2 - 실제 WAV 파일 기반)
//   - public/ 폴더의 WAV 파일을 재생
//   - 동시 재생 지원 (콤보 사운드 + 일반 정답 사운드 함께 가능)
//   - 액션 효과: 화면 흔들기, 별 폭발, 콤보 표시, 꽃가루
// ══════════════════════════════════════════════════════════════════════════

// ── 사운드 ON/OFF (학생별 설정) ──────────────────────────────────────────
export function isSoundEnabled() {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem("angela_sound_enabled");
  return v === null ? true : v === "true";
}

export function setSoundEnabled(enabled) {
  if (typeof window === "undefined") return;
  localStorage.setItem("angela_sound_enabled", enabled ? "true" : "false");
}

// ── 사운드 볼륨 (0.0 ~ 1.0) ─────────────────────────────────────────────
export function getVolume() {
  if (typeof window === "undefined") return 0.6;
  const v = localStorage.getItem("angela_sound_volume");
  return v === null ? 0.6 : parseFloat(v);
}

export function setVolume(vol) {
  if (typeof window === "undefined") return;
  localStorage.setItem("angela_sound_volume", String(Math.max(0, Math.min(1, vol))));
}

// ══════════════════════════════════════════════════════════════════════════
//   사운드 파일 캐싱 (Audio 객체 미리 로딩)
// ══════════════════════════════════════════════════════════════════════════
// ── 확장자 없는 기본 경로 (public/ 폴더 기준) ───────────────────────────
//   파일이 mp3든 wav든 ogg든, 같은 이름이면 알아서 재생됩니다.
//   예: public/correct.mp3 또는 public/correct.wav 둘 중 있는 걸 사용
const SOUND_BASE = {
  correct: "/correct",
  wrong: "/wrong",
  combo3: "/combo3",
  combo5: "/combo5",
  combo10: "/combo10",
  finishPerfect: "/finish-perfect",
  finishGood: "/finish-good",
  click: "/click",
};

// ── 브라우저가 재생 가능한 확장자를 선호 순서대로 시도 ──────────────────
//   mp3를 우선으로, 안 되면 wav, 그 다음 ogg.
//   (대부분의 브라우저는 셋 다 지원하므로 mp3가 먼저 잡힘)
const EXT_PREFERENCE = ["mp3", "wav", "ogg"];

// canPlayType으로 이 브라우저가 어떤 확장자를 지원하는지 한 번만 계산
let _supportedExts = null;
function getSupportedExts() {
  if (_supportedExts) return _supportedExts;
  if (typeof document === "undefined") return EXT_PREFERENCE;
  const probe = document.createElement("audio");
  const mime = { mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg" };
  _supportedExts = EXT_PREFERENCE.filter(ext => {
    try {
      const can = probe.canPlayType(mime[ext]);
      return can === "probably" || can === "maybe";
    } catch {
      return false;
    }
  });
  // 혹시 아무것도 못 잡으면 전체 순서로 폴백
  if (_supportedExts.length === 0) _supportedExts = EXT_PREFERENCE;
  return _supportedExts;
}

// 사운드 key별로 "실제 작동한 확장자"를 기억해 다음부터 바로 사용
const resolvedExt = {};

// 새 Audio 인스턴스 생성: 지원 확장자를 순서대로 후보로 설정
function createAudio(key) {
  const base = SOUND_BASE[key];
  const exts = getSupportedExts();
  // 이미 작동 확인된 확장자가 있으면 그걸 바로 사용
  const ext = resolvedExt[key] || exts[0];
  const audio = new Audio(`${base}.${ext}`);
  audio.preload = "auto";

  // 첫 확장자 로드 실패 시, 다음 후보 확장자로 자동 교체
  let tried = exts.indexOf(ext);
  audio.addEventListener("error", function onErr() {
    tried += 1;
    if (tried < exts.length) {
      const nextExt = exts[tried];
      resolvedExt[key] = nextExt;
      audio.src = `${base}.${nextExt}`;
      audio.load();
    } else {
      // 모든 후보 실패 — 조용히 포기 (소리만 안 날 뿐 앱은 정상)
      audio.removeEventListener("error", onErr);
    }
  });
  // 성공적으로 재생 가능해지면 그 확장자를 기억
  audio.addEventListener("canplaythrough", () => {
    const m = audio.src.match(/\.([a-z0-9]+)(\?.*)?$/i);
    if (m) resolvedExt[key] = m[1].toLowerCase();
  }, { once: true });

  return audio;
}

// 사운드별 Audio 풀 (동시 재생 위해 여러 인스턴스)
const audioPool = {};

function getAudioInstance(key) {
  if (typeof window === "undefined") return null;
  if (!audioPool[key]) audioPool[key] = [];

  // 풀에서 재생 끝난 인스턴스 찾기
  const available = audioPool[key].find(a => a.ended || a.paused);
  if (available) {
    available.currentTime = 0;
    return available;
  }

  // 풀이 비었거나 모두 재생 중이면 새로 생성 (최대 3개까지)
  if (audioPool[key].length < 3) {
    const audio = createAudio(key);
    audioPool[key].push(audio);
    return audio;
  }

  // 풀이 꽉 차면 첫 번째 인스턴스 재사용 (강제 처음부터)
  const first = audioPool[key][0];
  first.currentTime = 0;
  return first;
}

// ── 사운드 재생 헬퍼 ────────────────────────────────────────────────────
function play(soundKey, volumeMultiplier = 1.0) {
  if (!isSoundEnabled()) return;
  if (typeof window === "undefined") return;

  try {
    const audio = getAudioInstance(soundKey);
    if (!audio) return;
    audio.volume = Math.max(0, Math.min(1, getVolume() * volumeMultiplier));
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(err => {
        // 모바일 첫 클릭 전 자동재생 거부 등은 정상이라 무시
        if (err && err.name !== "NotAllowedError") {
          console.warn(`사운드 재생 실패 (${soundKey}):`, err);
        }
      });
    }
  } catch (e) {
    console.warn(`사운드 재생 에러 (${soundKey}):`, e);
  }
}

// ══════════════════════════════════════════════════════════════════════════
//   사운드 프리셋 (게임에서 호출)
// ══════════════════════════════════════════════════════════════════════════

export function playCorrect() { play("correct"); }
export function playWrong() { play("wrong", 0.9); }  // 오답은 살짝 작게
export function playClick() { play("click", 0.5); }  // 클릭은 작게
export function playStart() { play("click", 0.6); }

// 콤보 사운드 (단계별)
export function playCombo(count) {
  if (count >= 10) play("combo10");
  else if (count >= 5) play("combo5");
  else if (count >= 3) play("combo3");
}

// 게임 종료 (점수별 다른 사운드)
export function playFinish(score, total) {
  const ratio = total > 0 ? score / total : 0;
  if (ratio >= 0.8) {
    play("finishPerfect");
  } else if (ratio >= 0.5) {
    play("finishGood");
  } else {
    // 50% 미만은 격려 사운드 (combo3 톤이 부드러워서 재활용)
    play("combo3", 0.7);
  }
}

// ══════════════════════════════════════════════════════════════════════════
//   액션 효과 (CSS 애니메이션 + DOM)
// ══════════════════════════════════════════════════════════════════════════

// 🎬 화면 흔들기
export function shakeScreen(intensity = "soft") {
  if (typeof document === "undefined") return;
  const target = document.body;
  if (target.classList.contains("shake-active")) return;
  target.classList.add("shake-active", `shake-${intensity}`);
  setTimeout(() => {
    target.classList.remove("shake-active", `shake-${intensity}`);
  }, intensity === "hard" ? 500 : 300);
}

// 🌟 별 튀기기
export function burstStars(x = null, y = null) {
  if (typeof document === "undefined") return;
  const container = document.createElement("div");
  container.style.cssText = `
    position: fixed;
    left: ${x !== null ? x : window.innerWidth / 2}px;
    top: ${y !== null ? y : window.innerHeight / 2}px;
    pointer-events: none;
    z-index: 9999;
  `;
  document.body.appendChild(container);

  const stars = ["⭐", "✨", "🌟", "💫"];
  const count = 8;
  for (let i = 0; i < count; i++) {
    const star = document.createElement("div");
    star.textContent = stars[Math.floor(Math.random() * stars.length)];
    const angle = (Math.PI * 2 * i) / count;
    const distance = 80 + Math.random() * 60;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;
    star.style.cssText = `
      position: absolute;
      font-size: ${20 + Math.random() * 12}px;
      transition: all 0.7s cubic-bezier(0.2, 0.8, 0.3, 1);
      transform: translate(-50%, -50%);
      opacity: 1;
    `;
    container.appendChild(star);
    requestAnimationFrame(() => {
      star.style.transform = `translate(${tx - 50}%, ${ty - 50}%) rotate(${Math.random() * 360}deg) scale(0.3)`;
      star.style.opacity = "0";
    });
  }
  setTimeout(() => container.remove(), 800);
}

// 🔥 콤보 표시 (단계별 화려함)
export function showCombo(count) {
  if (typeof document === "undefined") return;
  if (count < 3) return;

  let emoji, color, gradient, label, fontSize;
  if (count >= 15) {
    emoji = "👑✨";
    color = "#fbbf24";
    gradient = "linear-gradient(135deg, #fbbf24, #ef4444, #ec4899, #a855f7)";
    label = "LEGENDARY!";
    fontSize = 72;
  } else if (count >= 10) {
    emoji = "🔥🔥🔥";
    color = "#ef4444";
    gradient = "linear-gradient(135deg, #ef4444, #f97316)";
    label = `${count} COMBO!`;
    fontSize = 64;
  } else if (count >= 7) {
    emoji = "🔥🔥";
    color = "#f97316";
    gradient = "linear-gradient(135deg, #f97316, #f59e0b)";
    label = `${count} COMBO!`;
    fontSize = 58;
  } else if (count >= 5) {
    emoji = "🔥🔥";
    color = "#f59e0b";
    gradient = "linear-gradient(135deg, #f59e0b, #fbbf24)";
    label = `${count} COMBO!`;
    fontSize = 52;
  } else {
    emoji = "🔥";
    color = "#22c55e";
    gradient = "linear-gradient(135deg, #22c55e, #84cc16)";
    label = `${count} COMBO!`;
    fontSize = 46;
  }

  const banner = document.createElement("div");
  banner.className = "combo-banner-active";
  banner.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0) rotate(-10deg);
    font-size: ${fontSize}px;
    font-weight: 900;
    background: ${gradient};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 0 4px 24px rgba(0,0,0,0.3), 0 0 30px ${color}66;
    pointer-events: none;
    z-index: 9998;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    white-space: nowrap;
    text-align: center;
    line-height: 1.1;
    filter: drop-shadow(0 0 20px ${color}88);
  `;
  banner.innerHTML = `${emoji}<br/><span style="font-size: ${fontSize * 0.7}px;">${label}</span>`;
  document.body.appendChild(banner);

  if (count >= 5) {
    const rays = document.createElement("div");
    rays.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 300px;
      height: 300px;
      pointer-events: none;
      z-index: 9997;
      background: radial-gradient(circle, ${color}33 0%, transparent 70%);
      animation: combo-pulse 0.8s ease-out;
    `;
    document.body.appendChild(rays);
    setTimeout(() => rays.remove(), 800);
  }

  if (count >= 15) {
    const rainbow = document.createElement("div");
    rainbow.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9996;
      background: linear-gradient(45deg,
        rgba(239,68,68,0.15),
        rgba(245,158,11,0.15),
        rgba(34,197,94,0.15),
        rgba(79,142,247,0.15),
        rgba(168,85,247,0.15));
      opacity: 0;
      transition: opacity 0.3s;
    `;
    document.body.appendChild(rainbow);
    requestAnimationFrame(() => rainbow.style.opacity = "1");
    setTimeout(() => { rainbow.style.opacity = "0"; }, 600);
    setTimeout(() => rainbow.remove(), 900);
  }

  requestAnimationFrame(() => {
    banner.style.transform = "translate(-50%, -50%) scale(1) rotate(0deg)";
  });

  setTimeout(() => {
    banner.style.transform = "translate(-50%, -120%) scale(0.7) rotate(5deg)";
    banner.style.opacity = "0";
    setTimeout(() => banner.remove(), 400);
  }, count >= 10 ? 1200 : 900);

  if (count >= 7) {
    setTimeout(() => burstStars(window.innerWidth * 0.2, window.innerHeight * 0.5), 200);
    setTimeout(() => burstStars(window.innerWidth * 0.8, window.innerHeight * 0.5), 200);
  }
}

// 🎊 꽃가루 효과
export function triggerConfetti() {
  if (typeof document === "undefined") return;

  const colors = ["#ef4444", "#f59e0b", "#22c55e", "#4f8ef7", "#a855f7", "#ec4899"];
  const container = document.createElement("div");
  container.style.cssText = `
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 9999;
    overflow: hidden;
  `;
  document.body.appendChild(container);

  for (let i = 0; i < 80; i++) {  // 60 → 80 (더 풍부하게)
    const confetti = document.createElement("div");
    const size = 8 + Math.random() * 10;
    confetti.style.cssText = `
      position: absolute;
      left: ${Math.random() * 100}%;
      top: -20px;
      width: ${size}px;
      height: ${size}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      border-radius: ${Math.random() < 0.5 ? "50%" : "2px"};
      opacity: ${0.7 + Math.random() * 0.3};
      transform: rotate(${Math.random() * 360}deg);
      transition: top 3s linear, transform 3s linear, opacity 3s ease-out;
    `;
    container.appendChild(confetti);
    requestAnimationFrame(() => {
      confetti.style.top = `${100 + Math.random() * 20}%`;
      confetti.style.transform = `rotate(${720 + Math.random() * 360}deg) translateX(${(Math.random() - 0.5) * 200}px)`;
      confetti.style.opacity = "0";
    });
  }
  setTimeout(() => container.remove(), 3300);
}

// 📳 진동 (모바일)
export function vibrate(pattern = 50) {
  if (typeof navigator === "undefined") return;
  if (navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch {}
  }
}

// ══════════════════════════════════════════════════════════════════════════
//   통합 헬퍼 (게임에서 한 줄 호출)
// ══════════════════════════════════════════════════════════════════════════

export function onCorrect(combo = 0) {
  playCorrect();
  burstStars();
  vibrate(50);
}

export function onWrong() {
  playWrong();
  shakeScreen("soft");
  vibrate([80, 50, 80]);
}

export function onFinish(score, total) {
  playFinish(score, total);
  if (total > 0 && score / total >= 0.8) {
    triggerConfetti();
  }
}
