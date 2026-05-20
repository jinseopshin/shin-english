// ══════════════════════════════════════════════════════════════════════════
//   사운드 & 액션 효과 시스템
//   - 듀오링고 스타일 게임풍 효과음 (Web Audio API)
//   - 정답/오답/콤보/완료 사운드
//   - 화면 액션: 흔들기, 별 효과, 콤보 표시, 꽃가루
//   - 모든 게임에서 공통으로 사용
// ══════════════════════════════════════════════════════════════════════════

// 사운드 ON/OFF (학생별 설정, localStorage)
export function isSoundEnabled() {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem("angela_sound_enabled");
  return v === null ? true : v === "true";
}

export function setSoundEnabled(enabled) {
  if (typeof window === "undefined") return;
  localStorage.setItem("angela_sound_enabled", enabled ? "true" : "false");
}

// ── Web Audio API 컨텍스트 (전역 1개만 사용) ─────────────────────────────
let audioCtx = null;
function getAudioCtx() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn("AudioContext 생성 실패:", e);
      return null;
    }
  }
  // 모바일 브라우저는 사용자 인터랙션 후에만 재생 가능
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// ── 기본 톤 생성 헬퍼 ───────────────────────────────────────────────────
function playTone(freq, duration = 0.15, type = "sine", volume = 0.3, detune = 0) {
  if (!isSoundEnabled()) return;
  const ctx = getAudioCtx();
  if (!ctx) return;

  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
    if (detune) oscillator.detune.setValueAtTime(detune, ctx.currentTime);

    // ADSR 엔벨로프 — 더 풍부한 잔향
    const attackTime = 0.005;
    const releaseTime = duration * 0.7; // 70%는 잔향
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + attackTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.5, ctx.currentTime + attackTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn("playTone 실패:", e);
  }
}

// 화음 재생 (여러 주파수를 동시에)
function playChord(freqs, duration = 0.3, type = "sine", volume = 0.2) {
  if (!isSoundEnabled()) return;
  freqs.forEach(freq => playTone(freq, duration, type, volume, 0));
}

// 반짝이는 고음 효과 (정답 시 매력 포인트)
function playSparkle() {
  if (!isSoundEnabled()) return;
  [1568, 2093, 2637].forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.08, "sine", 0.12), i * 30);
  });
}

// ══════════════════════════════════════════════════════════════════════════
//   악기 헬퍼 (게임 사운드용)
// ══════════════════════════════════════════════════════════════════════════

// 🎮 8비트 칩튠 (마리오/포켓몬 스타일) - square wave + 짧은 어택
function playChiptune(freq, duration = 0.15, volume = 0.18) {
  if (!isSoundEnabled()) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    // 칩튠 특유의 톡 끊는 어택
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.003);
    gain.gain.setValueAtTime(volume, ctx.currentTime + duration * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
}

// 🔔 벨/실로폰 - 짧은 어택 + 긴 잔향 (젤다 비밀발견 스타일)
function playBell(freq, duration = 0.6, volume = 0.18) {
  if (!isSoundEnabled()) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    // 기본 톤 + 5도 위 화음 (벨 특유의 풍부함)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.type = "sine";
    osc2.type = "sine";
    osc1.frequency.setValueAtTime(freq, ctx.currentTime);
    osc2.frequency.setValueAtTime(freq * 2, ctx.currentTime); // 옥타브 위
    // 벨 특유의 즉각 어택 + 느린 감쇠
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + duration);
    osc2.stop(ctx.currentTime + duration);
  } catch (e) {}
}

// 🥁 드럼 킥 (저음 펑) - 빠른 주파수 하강 + 노이즈
function playKick(volume = 0.3) {
  if (!isSoundEnabled()) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    // 150Hz → 40Hz로 빠르게 하강 (킥드럼 특징)
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {}
}

// 🥁 스네어 (탁) - 노이즈 + 짧은 톤
function playSnare(volume = 0.15) {
  if (!isSoundEnabled()) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    // 노이즈 버퍼 만들기
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    noise.buffer = buffer;
    filter.type = "highpass";
    filter.frequency.setValueAtTime(1000, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + 0.1);
  } catch (e) {}
}

// 🎸 신디 베이스 (RPG 클리어 느낌) - sawtooth + 로우패스 필터
function playSynthBass(freq, duration = 0.4, volume = 0.2) {
  if (!isSoundEnabled()) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.Q.setValueAtTime(5, ctx.currentTime); // 살짝 강조
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
    gain.gain.linearRampToValueAtTime(volume * 0.6, ctx.currentTime + duration * 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
}

// 🪙 코인 사운드 (마리오 코인 스타일) - 빠른 2음 칩튠
function playCoin() {
  if (!isSoundEnabled()) return;
  playChiptune(987.77, 0.06, 0.15); // B5
  setTimeout(() => playChiptune(1318.5, 0.18, 0.2), 60); // E6 길게
}

// 여러 톤을 시간차로 재생 (멜로디)
function playMelody(notes) {
  if (!isSoundEnabled()) return;
  notes.forEach((note, i) => {
    setTimeout(() => {
      playTone(note.freq, note.dur || 0.15, note.type || "sine", note.vol || 0.3);
    }, (note.delay || i * 80));
  });
}

// ══════════════════════════════════════════════════════════════════════════
//   사운드 프리셋 — 듀오링고 스타일
// ══════════════════════════════════════════════════════════════════════════

// 🎵 정답 — 마리오 코인 + 벨 + 반짝 (게임 클리어 느낌)
export function playCorrect() {
  // 1. 코인 사운드 (즉각적인 보상감)
  playCoin();
  // 2. 80ms 후: 벨 화음 (풍부함)
  setTimeout(() => {
    playBell(523.25, 0.5, 0.15); // C5
    playBell(659.25, 0.5, 0.12); // E5
  }, 80);
  // 3. 200ms 후: 반짝
  setTimeout(() => playSparkle(), 200);
}

// 🎵 오답 — 마리오 점프 실패 스타일 (가볍게, 좌절감 없이)
export function playWrong() {
  // 1. 칩튠 하강 음: 오답인 듯 가볍게
  playChiptune(440, 0.1, 0.15); // A4
  setTimeout(() => playChiptune(370, 0.1, 0.15), 100); // F#4
  setTimeout(() => playChiptune(330, 0.18, 0.15), 200); // E4
  // 2. 부드러운 베이스로 마무리 (위로감)
  setTimeout(() => {
    playSynthBass(165, 0.4, 0.12); // E3
  }, 300);
}

// 🎵 콤보 사운드 — 단계별로 화려해짐 (3/5/7/10/15)
export function playCombo(count) {
  if (count >= 15) {
    // 👑 15콤보: 전설급 (LEGENDARY) - 모든 악기 총동원
    // 드럼 트리플킥 + 스네어
    playKick(0.35);
    setTimeout(() => playKick(0.35), 80);
    setTimeout(() => playKick(0.35), 160);
    setTimeout(() => playSnare(0.25), 200);
    // 칩튠 6음 상승 (옥타브 두 개)
    [392, 523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
      setTimeout(() => playChiptune(freq, 0.1, 0.22), 250 + i * 50);
    });
    // 벨 화음 5개 (대박)
    setTimeout(() => {
      playBell(523.25, 1.2, 0.2);
      playBell(659.25, 1.2, 0.18);
      playBell(783.99, 1.2, 0.16);
      playBell(1046.5, 1.2, 0.18);
      playBell(1318.5, 1.2, 0.16);
    }, 600);
    // 신디 베이스 2개 (두께)
    setTimeout(() => {
      playSynthBass(98, 1.0, 0.2);    // G2 (저음)
      playSynthBass(196, 1.0, 0.16);  // G3
    }, 620);
    // 반짝 폭발 ×5
    [650, 800, 950, 1100, 1250].forEach(t => setTimeout(() => playSparkle(), t));
  } else if (count >= 10) {
    // 🔥🔥🔥 10콤보: 보스 클리어급
    playKick(0.3);
    setTimeout(() => playKick(0.3), 80);
    setTimeout(() => playSnare(0.2), 160);
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
      setTimeout(() => playChiptune(freq, 0.1, 0.2), 200 + i * 60);
    });
    setTimeout(() => {
      playBell(523.25, 0.8, 0.18);
      playBell(659.25, 0.8, 0.15);
      playBell(783.99, 0.8, 0.13);
      playBell(1046.5, 0.8, 0.15);
    }, 550);
    setTimeout(() => playSynthBass(130.81, 0.7, 0.18), 580);
    setTimeout(() => playSparkle(), 600);
    setTimeout(() => playSparkle(), 800);
    setTimeout(() => playSparkle(), 1000);
  } else if (count >= 7) {
    // 🔥🔥 7콤보: 강화된 콤보 (10콤보 직전)
    playKick(0.28);
    setTimeout(() => playSnare(0.18), 100);
    [523.25, 659.25, 783.99, 880, 1046.5].forEach((freq, i) => {
      setTimeout(() => playChiptune(freq, 0.09, 0.19), 150 + i * 60);
    });
    setTimeout(() => {
      playBell(659.25, 0.7, 0.16);
      playBell(987.77, 0.7, 0.14);
      playBell(1318.5, 0.7, 0.12);
    }, 450);
    setTimeout(() => playSynthBass(165, 0.5, 0.15), 470);
    setTimeout(() => playSparkle(), 500);
    setTimeout(() => playSparkle(), 700);
  } else if (count >= 5) {
    // 🔥🔥 5콤보: 레벨업 느낌
    playKick(0.25);
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      setTimeout(() => playChiptune(freq, 0.09, 0.18), 80 + i * 70);
    });
    setTimeout(() => {
      playBell(783.99, 0.6, 0.15);
      playBell(987.77, 0.6, 0.13);
    }, 380);
    setTimeout(() => playSparkle(), 450);
  } else if (count >= 3) {
    // 🔥 3콤보: 가벼운 콤보
    playKick(0.2);
    [587.33, 698.46, 880].forEach((freq, i) => {
      setTimeout(() => playChiptune(freq, 0.08, 0.16), 60 + i * 55);
    });
    setTimeout(() => playBell(880, 0.4, 0.13), 250);
  }
}

// 🎵 게임 시작 — 짧은 알림음
export function playStart() {
  playMelody([
    { freq: 440, dur: 0.08, type: "sine", vol: 0.2 },
    { freq: 659.25, dur: 0.12, type: "sine", vol: 0.22, delay: 70 },
  ]);
}

// 🎵 게임 종료 — RPG 보스 클리어 / 미션 클리어 / 위로 (점수별)
export function playFinish(score, total) {
  const ratio = total > 0 ? score / total : 0;

  if (ratio >= 0.8) {
    // 🏆 우수 (80% 이상): RPG 보스 클리어급 팡파레
    // Part 1: 드럼 인트로 (긴장감)
    playKick(0.3);
    setTimeout(() => playSnare(0.2), 150);
    setTimeout(() => playKick(0.3), 300);
    // Part 2: 칩튠 팡파레 멜로디 (마리오 클리어 풍)
    setTimeout(() => {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        setTimeout(() => playChiptune(freq, 0.12, 0.2), i * 100);
      });
    }, 400);
    // Part 3: 벨 화음 폭발 (영광)
    setTimeout(() => {
      playBell(523.25, 1.2, 0.18);
      playBell(659.25, 1.2, 0.15);
      playBell(783.99, 1.2, 0.13);
      playBell(1046.5, 1.2, 0.16);
    }, 850);
    // Part 4: 신디 베이스 (두께)
    setTimeout(() => {
      playSynthBass(130.81, 1.0, 0.2);  // C3
      playSynthBass(196, 1.0, 0.15);    // G3
    }, 880);
    // Part 5: 반짝 폭발 ×4
    setTimeout(() => playSparkle(), 900);
    setTimeout(() => playSparkle(), 1100);
    setTimeout(() => playSparkle(), 1300);
    setTimeout(() => playSparkle(), 1500);
    // Part 6: 최종 종소리 (영광의 마무리)
    setTimeout(() => {
      playBell(1318.5, 1.5, 0.2);  // E6
      playBell(1568, 1.5, 0.18);   // G6
    }, 1700);
  } else if (ratio >= 0.5) {
    // ⭐ 보통 (50~80%): 미션 클리어 사운드
    playKick(0.25);
    // 칩튠 짧은 팡파레
    setTimeout(() => {
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        setTimeout(() => playChiptune(freq, 0.1, 0.18), i * 90);
      });
    }, 100);
    // 벨 화음
    setTimeout(() => {
      playBell(659.25, 0.8, 0.15);
      playBell(783.99, 0.8, 0.13);
    }, 480);
    setTimeout(() => playSparkle(), 550);
  } else {
    // 💪 아쉬움 (50% 미만): 따뜻한 격려 (다시 도전!)
    // 부드러운 베이스 + 칩튠 상승 (희망적)
    playSynthBass(196, 0.5, 0.15); // G3
    setTimeout(() => playChiptune(392, 0.12, 0.18), 100); // G4
    setTimeout(() => playChiptune(523.25, 0.12, 0.18), 250); // C5
    setTimeout(() => playChiptune(659.25, 0.2, 0.2), 400); // E5
    // 따뜻한 벨 마무리
    setTimeout(() => {
      playBell(523.25, 0.7, 0.15);
      playBell(659.25, 0.7, 0.12);
    }, 600);
  }
}

// 🎵 버튼 클릭 (가벼운 톡 사운드)
export function playClick() {
  playTone(800, 0.05, "sine", 0.15);
}

// ══════════════════════════════════════════════════════════════════════════
//   액션 효과 (CSS 애니메이션 트리거)
// ══════════════════════════════════════════════════════════════════════════

// 🎬 화면 흔들기 (정답/오답 강조)
export function shakeScreen(intensity = "soft") {
  if (typeof document === "undefined") return;
  const target = document.body;
  if (target.classList.contains("shake-active")) return; // 중복 방지

  target.classList.add("shake-active", `shake-${intensity}`);
  setTimeout(() => {
    target.classList.remove("shake-active", `shake-${intensity}`);
  }, intensity === "hard" ? 500 : 300);
}

// 🌟 별 튀기기 (정답 시 화면에 별이 튐)
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

// 🔥 콤보 표시 (화면 중앙 큰 텍스트) — 단계별 차등 화려함
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

  // 메인 콤보 텍스트
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

  // 배경 광선 효과 (5콤보 이상)
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

  // 무지개 효과 (15콤보)
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

  // 메인 텍스트 애니메이션
  requestAnimationFrame(() => {
    banner.style.transform = "translate(-50%, -50%) scale(1) rotate(0deg)";
  });

  setTimeout(() => {
    banner.style.transform = "translate(-50%, -120%) scale(0.7) rotate(5deg)";
    banner.style.opacity = "0";
    setTimeout(() => banner.remove(), 400);
  }, count >= 10 ? 1200 : 900);

  // 사이드 별 폭발 (7콤보 이상)
  if (count >= 7) {
    setTimeout(() => burstStars(window.innerWidth * 0.2, window.innerHeight * 0.5), 200);
    setTimeout(() => burstStars(window.innerWidth * 0.8, window.innerHeight * 0.5), 200);
  }
}

// 🎊 꽃가루 효과 (게임 종료 시 우수 점수)
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

  for (let i = 0; i < 60; i++) {
    const confetti = document.createElement("div");
    const size = 8 + Math.random() * 8;
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
      transition: top 2.5s linear, transform 2.5s linear, opacity 2.5s ease-out;
    `;
    container.appendChild(confetti);
    requestAnimationFrame(() => {
      confetti.style.top = `${100 + Math.random() * 20}%`;
      confetti.style.transform = `rotate(${720 + Math.random() * 360}deg) translateX(${(Math.random() - 0.5) * 200}px)`;
      confetti.style.opacity = "0";
    });
  }
  setTimeout(() => container.remove(), 2800);
}

// 📳 진동 (모바일만)
export function vibrate(pattern = 50) {
  if (typeof navigator === "undefined") return;
  if (navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch {}
  }
}

// ══════════════════════════════════════════════════════════════════════════
//   통합 헬퍼 — 게임에서 한 줄로 호출
// ══════════════════════════════════════════════════════════════════════════

// 정답 처리 (사운드 + 액션 + 진동 한 번에)
export function onCorrect(combo = 0) {
  playCorrect();
  burstStars();
  vibrate(50);
  if (combo >= 3) {
    setTimeout(() => {
      playCombo(combo);
      showCombo(combo);
    }, 200);
  }
}

// 오답 처리
export function onWrong() {
  playWrong();
  shakeScreen("soft");
  vibrate([80, 50, 80]);
}

// 게임 종료
export function onFinish(score, total) {
  playFinish(score, total);
  if (total > 0 && score / total >= 0.8) {
    triggerConfetti();
  }
}
