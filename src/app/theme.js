"use client";

// ══════════════════════════════════════════════════════════════════════════
//   🎨 THEME — 색상 / 그림자 / 공통 상수
// ══════════════════════════════════════════════════════════════════════════
export const T = {
  bg: "#f0f7ff",
  card: "#ffffff",
  border: "#dce8ff",
  accent: "#4f8ef7",
  accentDark: "#2563eb",
  accentLight: "#e8f0ff",
  green: "#22c55e",
  greenLight: "#dcfce7",
  red: "#ef4444",
  redLight: "#fee2e2",
  yellow: "#f59e0b",
  yellowLight: "#fef3c7",
  purple: "#a855f7",
  purpleLight: "#f3e8ff",
  pink: "#ec4899",
  pinkLight: "#fce7f3",
  orange: "#f97316",
  orangeLight: "#fff7ed",
  teal: "#14b8a6",
  tealLight: "#ccfbf1",
  text: "#1e293b",
  textMid: "#64748b",
  textDim: "#94a3b8",
  shadow: "0 4px 16px rgba(79,142,247,0.12)",
  shadowLg: "0 8px 32px rgba(79,142,247,0.18)",
};

export const GRADES = ["초등3","초등4","초등5","초등6","중1","중2","중3"];
export const TAGS = ["be동사","일반동사","조동사","시제","의문문","부정문","어휘","기타"];
export const MARKS = ["①","②","③","④","⑤"];
export const AVATARS = ["🦊","🐰","🐻","🦁","🐼","🐨","🦝","🐯","🐶","🐱","🐵","🦄"];

// ══════════════════════════════════════════════════════════════════════════
//   🔧 유틸 — UID 생성 / 배열 셔플
// ══════════════════════════════════════════════════════════════════════════
let _uid = Date.now();
export const uid = () => (++_uid).toString(36);
export const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// ══════════════════════════════════════════════════════════════════════════
//   🎵 음성 합성 (발음 기능)
// ══════════════════════════════════════════════════════════════════════════
export function speak(text) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 0.9;
    utter.pitch = 1.0;
    utter.volume = 1.0;
    window.speechSynthesis.speak(utter);
  } catch (e) {
    console.warn("Speech synthesis error:", e);
  }
}

// ══════════════════════════════════════════════════════════════════════════
//   🎨 UI 컴포넌트 — Btn / Tag / Card / Input
// ══════════════════════════════════════════════════════════════════════════
export function Btn({ children, onClick, v = "primary", size = "md", style = {}, disabled, type = "button" }) {
  const variants = {
    primary: { bg: T.accent, color: "white", hover: T.accentDark },
    secondary: { bg: T.accentLight, color: T.accent, hover: "#d7e5ff" },
    danger: { bg: T.red, color: "white", hover: "#dc2626" },
    success: { bg: T.green, color: "white", hover: "#16a34a" },
    ghost: { bg: "transparent", color: T.textMid, hover: T.bg },
  };
  const sizes = {
    sm: { padding: "6px 12px", fontSize: 12 },
    md: { padding: "9px 18px", fontSize: 13 },
    lg: { padding: "12px 22px", fontSize: 14 },
  };
  const vs = variants[v];
  const sz = sizes[size];
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      ...sz, background: disabled ? "#cbd5e1" : vs.bg, color: vs.color,
      border: "none", borderRadius: 10, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
      transition: "all 0.15s", boxShadow: v === "primary" || v === "danger" || v === "success" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
      ...style
    }}>{children}</button>
  );
}

export function Tag({ children, color = "blue" }) {
  const colors = {
    blue: { c: T.accent, b: T.accentLight },
    green: { c: T.green, b: T.greenLight },
    red: { c: T.red, b: T.redLight },
    yellow: { c: T.yellow, b: T.yellowLight },
    purple: { c: T.purple, b: T.purpleLight },
    pink: { c: T.pink, b: T.pinkLight },
    orange: { c: T.orange, b: T.orangeLight },
  };
  const cl = colors[color] || colors.blue;
  return <span style={{
    fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 7,
    color: cl.c, background: cl.b, letterSpacing: 0.3
  }}>{children}</span>;
}

export function Card({ children, style = {}, onClick }) {
  return <div onClick={onClick} style={{
    background: T.card, borderRadius: 16, padding: 16,
    boxShadow: T.shadow, border: `1px solid ${T.border}`,
    cursor: onClick ? "pointer" : "default",
    ...style
  }}>{children}</div>;
}

export function Input({ value, onChange, placeholder, type = "text", style = {} }) {
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{
    padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${T.border}`,
    fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box",
    transition: "border-color 0.15s",
    ...style
  }} onFocus={e => e.target.style.borderColor = T.accent}
     onBlur={e => e.target.style.borderColor = T.border} />;
}

// ══════════════════════════════════════════════════════════════════════════
//   💾 학생 기록 저장 헬퍼 (게임/과제 결과 저장 시 사용)
// ══════════════════════════════════════════════════════════════════════════
export function saveStudentRecord(setStudents, name, record) {
  setStudents(prev => {
    const cur = prev[name] || {
      name,
      joinDate: new Date().toISOString().slice(0, 10),
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
      grade: "초등5",
      points: 0,
      records: []
    };
    const updated = {
      ...cur,
      points: (cur.points || 0) + (record.points || 0),
      records: [
        ...(cur.records || []),
        { ...record, date: new Date().toISOString() }
      ].slice(-50) // 최근 50개만 유지
    };
    return { ...prev, [name]: updated };
  });
}
