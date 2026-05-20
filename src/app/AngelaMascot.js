"use client";
import { useState, useEffect, useRef } from "react";
import Lottie from "lottie-react";

// ══════════════════════════════════════════════════════════════════════════
//   🦊 Angela Mascot v2 — Lottie 애니메이션 기반
//   - 진짜 움직이는 동물 캐릭터로 격려
//   - 상황별로 다른 애니메이션 자동 선택
//   - public 폴더의 JSON 파일을 동적으로 로드
// ══════════════════════════════════════════════════════════════════════════

// Lottie JSON 캐싱 (한 번 로드되면 메모리에 저장)
const lottieCache = {};

async function loadLottie(path) {
  if (lottieCache[path]) return lottieCache[path];
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Lottie 로드 실패: ${path}`);
    const data = await res.json();
    lottieCache[path] = data;
    return data;
  } catch (e) {
    console.warn("Lottie 로드 에러:", e);
    return null;
  }
}

// 반응 → Lottie 파일 매핑
const REACTION_TO_LOTTIE = {
  // 정답/일상 격려
  correct: "/angela-happy.json",
  firstCorrect: "/angela-happy.json",
  start: "/angela-happy.json",
  recovery: "/angela-happy.json",
  // 오답 위로
  wrong: "/angela-sad.json",
  // 콤보 (3 이하)
  combo3: "/angela-celebrate.json",
  // 콤보 (5~7) - 더 화려한 축하
  combo5: "/angela-celebrate.json",
  combo7: "/angela-celebrate.json",
  // 콤보 (10+) - 트로피급
  combo10: "/angela-trophy.json",
  combo15: "/angela-trophy.json",
  // 게임 종료
  perfect: "/angela-trophy.json",
  great: "/angela-celebrate.json",
  good: "/angela-happy.json",
  encourage: "/angela-happy.json",
};

// 마스코트 메시지 라이브러리 (상황 → 메시지 배열)
export const ANGELA_REACTIONS = {
  start: [
    { msg: "Let's go!" }, { msg: "Ready!" }, { msg: "You got this!" },
  ],
  firstCorrect: [
    { msg: "Good start!" }, { msg: "Nice one!" }, { msg: "Great start!" },
  ],
  correct: [
    { msg: "Good!" }, { msg: "Nice!" }, { msg: "Excellent!" }, { msg: "Bullseye!" },
  ],
  wrong: [
    { msg: "Almost!" }, { msg: "Try again!" }, { msg: "Keep going!" }, { msg: "It's okay!" },
  ],
  recovery: [
    { msg: "Great recovery!" }, { msg: "You bounced back!" }, { msg: "Way to come back!" },
  ],
  combo3: [
    { msg: "On fire!" }, { msg: "Hot streak!" }, { msg: "Combo!" },
  ],
  combo5: [
    { msg: "Amazing!" }, { msg: "Awesome!" }, { msg: "You're flying!" },
  ],
  combo7: [
    { msg: "Incredible!" }, { msg: "Super star!" }, { msg: "Champion!" },
  ],
  combo10: [
    { msg: "Unstoppable!" }, { msg: "Diamond level!" }, { msg: "MEGA COMBO!" },
  ],
  combo15: [
    { msg: "LEGENDARY!" }, { msg: "MYTHIC!" }, { msg: "GODLIKE!" },
  ],
  perfect: [
    { msg: "Perfect score!" }, { msg: "100% AMAZING!" }, { msg: "You're a CHAMPION!" },
  ],
  great: [
    { msg: "Well done!" }, { msg: "Great job!" }, { msg: "Excellent work!" },
  ],
  good: [
    { msg: "Good effort!" }, { msg: "Keep practicing!" }, { msg: "Growing strong!" },
  ],
  encourage: [
    { msg: "Keep going!" }, { msg: "Don't give up!" }, { msg: "You'll get it!" },
  ],
};

function pickReaction(type) {
  const reactions = ANGELA_REACTIONS[type] || ANGELA_REACTIONS.correct;
  return reactions[Math.floor(Math.random() * reactions.length)];
}

// ══════════════════════════════════════════════════════════════════════════
//   AngelaMascot 컴포넌트
// ══════════════════════════════════════════════════════════════════════════
export function AngelaMascot({
  reaction = "correct",
  trigger = 0,
  position = "right",
  duration = 2000,
  size = "md",
}) {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(null);
  const [lottieData, setLottieData] = useState(null);
  const timeoutRef = useRef(null);
  const loadTokenRef = useRef(0);  // 로딩 토큰 (오래된 로딩 요청 무시용)

  useEffect(() => {
    if (trigger === 0) return;

    // 새 reaction이 오면 이전 데이터 즉시 클리어 (이전 애니메이션이 잔존하지 않도록)
    setLottieData(null);

    const r = pickReaction(reaction);
    setCurrent(r);
    setVisible(true);

    // 로딩 토큰 증가 — 이 useEffect 호출에 해당하는 고유 번호
    loadTokenRef.current += 1;
    const myToken = loadTokenRef.current;

    // Lottie 애니메이션 로드 (오래된 응답은 무시)
    const lottiePath = REACTION_TO_LOTTIE[reaction] || REACTION_TO_LOTTIE.correct;
    loadLottie(lottiePath).then(data => {
      // 내가 가장 최근 요청일 때만 데이터 설정
      if (data && loadTokenRef.current === myToken) {
        setLottieData(data);
      }
    });

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(false), duration);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [trigger, reaction, duration]);

  if (!current) return null;

  // 위치 스타일
  const positions = {
    right: { right: 16, bottom: 80, transform: visible ? "translateX(0) scale(1)" : "translateX(120%) scale(0.5)" },
    left: { left: 16, bottom: 80, transform: visible ? "translateX(0) scale(1)" : "translateX(-120%) scale(0.5)" },
    "top-center": { left: "50%", top: 80, transform: visible ? "translate(-50%, 0) scale(1)" : "translate(-50%, -120%) scale(0.5)" },
  };

  // 크기 (Lottie는 이모지보다 더 크게 표시)
  const sizes = {
    sm: { mascotSize: 64, msgSize: 11, padding: "6px 10px" },
    md: { mascotSize: 84, msgSize: 13, padding: "8px 14px" },
    lg: { mascotSize: 110, msgSize: 15, padding: "10px 18px" },
  };

  const sz = sizes[size] || sizes.md;
  const pos = positions[position] || positions.right;

  // 콤보 등급 색상
  const isHighCombo = reaction === "combo10" || reaction === "combo15" || reaction === "perfect";
  const isMedCombo = reaction === "combo5" || reaction === "combo7" || reaction === "great";
  const borderGradient = isHighCombo
    ? "linear-gradient(135deg, #fbbf24, #ef4444)"
    : isMedCombo
    ? "linear-gradient(135deg, #f59e0b, #ec4899)"
    : "linear-gradient(135deg, #4f8ef7, #a855f7)";

  return (
    <div style={{
      position: "fixed",
      ...pos,
      zIndex: 9990,
      pointerEvents: "none",
      transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s",
      opacity: visible ? 1 : 0,
      display: "flex",
      alignItems: "center",
      gap: 8,
    }}>
      {/* Lottie 캐릭터 */}
      <div style={{
        width: sz.mascotSize,
        height: sz.mascotSize,
        borderRadius: "50%",
        background: "white",
        padding: 4,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 4px 20px rgba(0,0,0,0.2), 0 0 0 3px transparent`,
        backgroundImage: `linear-gradient(white, white), ${borderGradient}`,
        backgroundOrigin: "border-box",
        backgroundClip: "padding-box, border-box",
        border: "3px solid transparent",
        animation: visible ? "angela-bounce 0.6s ease-out" : "none",
        overflow: "hidden",
      }}>
        {lottieData ? (
          <Lottie
            key={trigger}
            animationData={lottieData}
            loop={true}
            autoplay={true}
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          // 로딩 중 백업 이모지
          <div style={{ fontSize: sz.mascotSize * 0.5 }}>🦊</div>
        )}
      </div>

      {/* 말풍선 */}
      <div style={{
        background: "white",
        color: "#1e293b",
        padding: sz.padding,
        borderRadius: 14,
        fontSize: sz.msgSize,
        fontWeight: 800,
        boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        whiteSpace: "nowrap",
        position: "relative",
      }}>
        <div style={{
          position: "absolute",
          left: -6,
          top: "50%",
          transform: "translateY(-50%)",
          width: 0,
          height: 0,
          borderTop: "6px solid transparent",
          borderBottom: "6px solid transparent",
          borderRight: "8px solid white",
        }} />
        {current.msg}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//   useAngela 훅
// ══════════════════════════════════════════════════════════════════════════
export function useAngela() {
  const [trigger, setTrigger] = useState(0);
  const [reaction, setReaction] = useState("correct");

  const show = (reactionType) => {
    setReaction(reactionType);
    setTrigger(Date.now());
  };

  return {
    show,
    trigger,
    reaction,
    AngelaComponent: (props) => (
      <AngelaMascot
        trigger={trigger}
        reaction={reaction}
        {...props}
      />
    ),
  };
}

// 콤보 횟수 → 적절한 reaction 자동 선택 헬퍼
export function getComboReaction(comboCount) {
  if (comboCount >= 15) return "combo15";
  if (comboCount >= 10) return "combo10";
  if (comboCount >= 7) return "combo7";
  if (comboCount >= 5) return "combo5";
  if (comboCount >= 3) return "combo3";
  return "correct";
}

// 점수 비율 → 게임 종료 reaction 자동 선택
export function getFinishReaction(score, total) {
  if (total === 0) return "good";
  const ratio = score / total;
  if (ratio === 1.0) return "perfect";
  if (ratio >= 0.8) return "great";
  if (ratio >= 0.5) return "good";
  return "encourage";
}

// ══════════════════════════════════════════════════════════════════════════
//   FullScreenConfetti — 화면 가득 꽃가루 (Lottie)
//   게임 종료 시 화면 전체에 표시
// ══════════════════════════════════════════════════════════════════════════
export function FullScreenConfetti({ trigger = 0, duration = 3000 }) {
  const [visible, setVisible] = useState(false);
  const [lottieData, setLottieData] = useState(null);

  useEffect(() => {
    if (trigger === 0) return;
    setVisible(true);
    loadLottie("/confetti.json").then(data => {
      if (data) setLottieData(data);
    });
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [trigger, duration]);

  if (!visible || !lottieData) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      pointerEvents: "none",
      zIndex: 9995,
    }}>
      <Lottie
        animationData={lottieData}
        loop={false}
        autoplay={true}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//   ComboFireEffect — 콤보 옆에 불꽃 효과 (Lottie)
//   콤보 카운터 옆에 작은 불꽃이 일렁임
// ══════════════════════════════════════════════════════════════════════════
export function ComboFireEffect({ active = false, size = 32 }) {
  const [lottieData, setLottieData] = useState(null);

  useEffect(() => {
    if (!active) return;
    loadLottie("/fire.json").then(data => {
      if (data) setLottieData(data);
    });
  }, [active]);

  if (!active || !lottieData) return null;

  return (
    <div style={{ width: size, height: size, display: "inline-block", verticalAlign: "middle" }}>
      <Lottie
        animationData={lottieData}
        loop={true}
        autoplay={true}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}