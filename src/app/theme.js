"use client";

// ══════════════════════════════════════════════════════════════════════════
//   🎨 THEME v2.0 — Angela's English Academy
//   "정돈된 귀여움" - 파스텔 컬러 시스템, 둥근 모서리, 부드러운 그림자
// ══════════════════════════════════════════════════════════════════════════

export const T = {
  // ──────────────────────────────────────────────────────────────
  //   🎨 카테고리별 컬러 시스템 (메인 + 연한 배경)
  // ──────────────────────────────────────────────────────────────
  
  // Primary - 부드러운 인디고 (메인 액센트)
  accent: "#6366F1",         // 인디고 500
  accentDark: "#4F46E5",     // 인디고 600
  accentLight: "#EEF2FF",    // 인디고 50 - 배경용
  accentSoft: "#C7D2FE",     // 인디고 200 - 중간 톤
  
  // 노란색 - 파닉스 / 학습 시작
  yellow: "#F59E0B",         // amber 500
  yellowLight: "#FEF3C7",    // amber 100
  yellowSoft: "#FDE68A",     // amber 200
  
  // 주황색 - 문장 만들기 / 복습
  orange: "#F97316",         // orange 500
  orangeLight: "#FFEDD5",    // orange 100
  orangeSoft: "#FED7AA",     // orange 200
  
  // 빨강 - 알림 / 긴급
  red: "#EF4444",            // red 500
  redLight: "#FEE2E2",       // red 100
  redSoft: "#FECACA",        // red 200
  
  // 보라 - 단어장 / 컬렉션
  purple: "#A855F7",         // purple 500
  purpleLight: "#F3E8FF",    // purple 100
  purpleSoft: "#E9D5FF",     // purple 200
  
  // 파랑 - 숙제 / 과제
  blue: "#3B82F6",           // blue 500
  blueLight: "#DBEAFE",      // blue 100
  blueSoft: "#BFDBFE",       // blue 200
  
  // 초록 - 시험 / 성공
  green: "#10B981",          // emerald 500
  greenLight: "#D1FAE5",     // emerald 100
  greenSoft: "#A7F3D0",      // emerald 200
  
  // 핑크 - 포인트 / 보상
  pink: "#EC4899",           // pink 500
  pinkLight: "#FCE7F3",      // pink 100
  pinkSoft: "#FBCFE8",       // pink 200
  
  // 청록 - 보조 액센트
  teal: "#14B8A6",           // teal 500
  tealLight: "#CCFBF1",      // teal 100
  tealSoft: "#99F6E4",       // teal 200
  
  // ──────────────────────────────────────────────────────────────
  //   🖼️ 배경 & 텍스트 (전체적으로 차분하게)
  // ──────────────────────────────────────────────────────────────
  
  bg: "#FAFAF9",             // stone 50 - 메인 배경 (따뜻한 흰색)
  bgSoft: "#F5F5F4",         // stone 100 - 서브 배경
  card: "#FFFFFF",           // 카드 배경
  border: "#F3F4F6",         // gray 100 - 부드러운 테두리
  borderMid: "#E5E7EB",      // gray 200 - 또렷한 테두리
  
  text: "#1F2937",           // gray 800 - 메인 텍스트
  textMid: "#6B7280",        // gray 500 - 중간 톤
  textDim: "#9CA3AF",        // gray 400 - 흐린 텍스트
  
  // ──────────────────────────────────────────────────────────────
  //   📐 모양 - 둥근 모서리 (전체적으로 더 둥글게!)
  // ──────────────────────────────────────────────────────────────
  
  radiusSm: 12,              // 작은 요소 (버튼, 태그)
  radius: 16,                // 기본 (인풋, 작은 카드)
  radiusLg: 20,              // 큰 카드 (메인 메뉴)
  radiusXl: 24,              // 헤더, 특별 카드
  radiusFull: 9999,          // 완전 둥근 (배지, 원형 버튼)
  
  // ──────────────────────────────────────────────────────────────
  //   🌫️ 그림자 - 부드럽고 따뜻하게
  // ──────────────────────────────────────────────────────────────
  
  shadow: "0 2px 8px rgba(0,0,0,0.04)",
  shadowMd: "0 4px 12px rgba(0,0,0,0.06)",
  shadowLg: "0 8px 24px rgba(0,0,0,0.08)",
  shadowXl: "0 12px 32px rgba(0,0,0,0.10)",
  shadowColor: "0 4px 12px rgba(99,102,241,0.15)", // 컬러 액센트 그림자
};

// ══════════════════════════════════════════════════════════════════════════
//   📚 상수 (기존 유지)
// ══════════════════════════════════════════════════════════════════════════
export const GRADES = ["초등3","초등4","초등5","초등6","중1","중2","중3"];
export const TAGS = ["be동사","일반동사","조동사","시제","의문문","부정문","어휘","기타"];
export const MARKS = ["①","②","③","④","⑤"];
export const AVATARS = ["🦊","🐰","🐻","🦁","🐼","🐨","🦝","🐯","🐶","🐱","🐵","🦄"];

// ══════════════════════════════════════════════════════════════════════════
//   🔧 유틸 (기존 유지)
// ══════════════════════════════════════════════════════════════════════════
let _uid = Date.now();
export const uid = () => (++_uid).toString(36);
export const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// ══════════════════════════════════════════════════════════════════════════
//   🎵 음성 합성 (기존 유지)
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
//   🎨 UI 컴포넌트 v2.0 - 더 둥글고, 더 부드럽게
// ══════════════════════════════════════════════════════════════════════════

// ── Button: 둥글고 부드러운 버튼 ────────────────────────────────────
export function Btn({ children, onClick, v = "primary", size = "md", style = {}, disabled, type = "button" }) {
  const variants = {
    primary:   { bg: T.accent,     color: "white",   hover: T.accentDark, shadow: T.shadowColor },
    secondary: { bg: T.accentLight, color: T.accent, hover: T.accentSoft, shadow: "none" },
    danger:    { bg: T.red,        color: "white",   hover: "#DC2626",    shadow: "0 4px 12px rgba(239,68,68,0.20)" },
    success:   { bg: T.green,      color: "white",   hover: "#059669",    shadow: "0 4px 12px rgba(16,185,129,0.20)" },
    warning:   { bg: T.orange,     color: "white",   hover: "#EA580C",    shadow: "0 4px 12px rgba(249,115,22,0.20)" },
    ghost:     { bg: "transparent", color: T.textMid, hover: T.bgSoft,    shadow: "none" },
    soft:      { bg: T.bgSoft,     color: T.text,    hover: T.border,     shadow: "none" },
  };
  const sizes = {
    sm: { padding: "7px 14px",  fontSize: 12, radius: 12 },
    md: { padding: "10px 20px", fontSize: 13, radius: 14 },
    lg: { padding: "13px 24px", fontSize: 14, radius: 16 },
  };
  const vs = variants[v] || variants.primary;
  const sz = sizes[size] || sizes.md;
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      padding: sz.padding,
      fontSize: sz.fontSize,
      background: disabled ? "#E5E7EB" : vs.bg,
      color: disabled ? "#9CA3AF" : vs.color,
      border: "none",
      borderRadius: sz.radius,
      fontWeight: 800,
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "all 0.15s ease",
      boxShadow: disabled ? "none" : vs.shadow,
      ...style
    }}>{children}</button>
  );
}

// ── Tag: 작은 컬러 배지 ─────────────────────────────────────────────
export function Tag({ children, color = "blue" }) {
  const colors = {
    blue:   { c: T.accent, b: T.accentLight },
    green:  { c: "#047857", b: T.greenLight },
    red:    { c: "#B91C1C", b: T.redLight },
    yellow: { c: "#B45309", b: T.yellowLight },
    purple: { c: "#7E22CE", b: T.purpleLight },
    pink:   { c: "#BE185D", b: T.pinkLight },
    orange: { c: "#C2410C", b: T.orangeLight },
    teal:   { c: "#0F766E", b: T.tealLight },
  };
  const cl = colors[color] || colors.blue;
  return <span style={{
    fontSize: 11,
    fontWeight: 800,
    padding: "3px 10px",
    borderRadius: T.radiusFull,
    color: cl.c,
    background: cl.b,
    letterSpacing: 0.2,
    display: "inline-block",
    whiteSpace: "nowrap",
  }}>{children}</span>;
}

// ── Card: 더 둥글고 부드러운 카드 ────────────────────────────────────
export function Card({ children, style = {}, onClick, color = null, hover = true }) {
  // color prop: 카드 좌측 강조선 색상 (옵션)
  // 사용 예: <Card color="yellow">파닉스 카드</Card>
  const colorMap = {
    yellow: T.yellow,
    orange: T.orange,
    red:    T.red,
    purple: T.purple,
    blue:   T.blue,
    green:  T.green,
    pink:   T.pink,
    teal:   T.teal,
    accent: T.accent,
  };
  const accentColor = colorMap[color];
  
  return <div 
    onClick={onClick}
    onMouseEnter={hover && onClick ? (e) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = T.shadowLg;
    } : undefined}
    onMouseLeave={hover && onClick ? (e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = T.shadow;
    } : undefined}
    style={{
      background: T.card,
      borderRadius: T.radiusLg,
      padding: 18,
      boxShadow: T.shadow,
      border: `1.5px solid ${T.border}`,
      borderLeft: accentColor ? `4px solid ${accentColor}` : `1.5px solid ${T.border}`,
      cursor: onClick ? "pointer" : "default",
      transition: "all 0.2s ease",
      ...style
    }}>{children}</div>;
}

// ── Input: 둥글고 친근한 입력 필드 ──────────────────────────────────
export function Input({ value, onChange, placeholder, type = "text", style = {}, ...rest }) {
  return <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    style={{
      padding: "12px 16px",
      borderRadius: T.radius,
      border: `2px solid ${T.border}`,
      fontSize: 14,
      outline: "none",
      width: "100%",
      boxSizing: "border-box",
      transition: "all 0.15s ease",
      background: T.card,
      color: T.text,
      ...style
    }}
    onFocus={e => {
      e.target.style.borderColor = T.accent;
      e.target.style.background = T.accentLight;
    }}
    onBlur={e => {
      e.target.style.borderColor = T.border;
      e.target.style.background = T.card;
    }}
    {...rest}
  />;
}

// ══════════════════════════════════════════════════════════════════════════
//   🎁 새 헬퍼 컴포넌트 (v2.0 추가)
// ══════════════════════════════════════════════════════════════════════════

// ── MenuCard: 메인 메뉴 카드 (큰 아이콘 + 텍스트) ─────────────────────
// 사용 예시:
//   <MenuCard icon="🔤" title="파닉스 학습" desc="알파벳부터 차근차근" 
//             color="yellow" onClick={...} />
export function MenuCard({ icon, title, desc, color = "yellow", badge, onClick, style = {} }) {
  const colorMap = {
    yellow: { main: T.yellow, light: T.yellowLight, soft: T.yellowSoft },
    orange: { main: T.orange, light: T.orangeLight, soft: T.orangeSoft },
    red:    { main: T.red,    light: T.redLight,    soft: T.redSoft },
    purple: { main: T.purple, light: T.purpleLight, soft: T.purpleSoft },
    blue:   { main: T.blue,   light: T.blueLight,   soft: T.blueSoft },
    green:  { main: T.green,  light: T.greenLight,  soft: T.greenSoft },
    pink:   { main: T.pink,   light: T.pinkLight,   soft: T.pinkSoft },
    teal:   { main: T.teal,   light: T.tealLight,   soft: T.tealSoft },
    accent: { main: T.accent, light: T.accentLight, soft: T.accentSoft },
  };
  const c = colorMap[color] || colorMap.yellow;
  
  return (
    <div onClick={onClick} 
      onMouseEnter={(e) => {
        if (!onClick) return;
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = T.shadowLg;
        e.currentTarget.style.borderColor = c.soft;
      }}
      onMouseLeave={(e) => {
        if (!onClick) return;
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = T.shadow;
        e.currentTarget.style.borderColor = T.border;
      }}
      style={{
        background: T.card,
        borderRadius: T.radiusLg,
        padding: 16,
        boxShadow: T.shadow,
        border: `2px solid ${T.border}`,
        cursor: onClick ? "pointer" : "default",
        display: "flex",
        alignItems: "center",
        gap: 14,
        transition: "all 0.2s ease",
        position: "relative",
        ...style
      }}>
      {/* 컬러 아이콘 박스 */}
      <div style={{
        width: 56, 
        height: 56, 
        background: c.light,
        borderRadius: T.radius,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 30,
        flexShrink: 0,
      }}>{icon}</div>
      
      {/* 텍스트 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ 
          fontSize: 15, 
          fontWeight: 800, 
          color: T.text, 
          marginBottom: 2,
        }}>{title}</div>
        {desc && <div style={{ 
          fontSize: 11, 
          color: T.textMid,
          lineHeight: 1.4,
        }}>{desc}</div>}
      </div>
      
      {/* 알림 배지 */}
      {badge && (
        <div style={{
          background: c.main,
          color: "white",
          fontSize: 11,
          fontWeight: 900,
          padding: "4px 10px",
          borderRadius: T.radiusFull,
          minWidth: 24,
          textAlign: "center",
        }}>{badge}</div>
      )}
      
      {/* 화살표 */}
      {onClick && (
        <div style={{ 
          fontSize: 24, 
          color: c.main, 
          fontWeight: 900,
        }}>›</div>
      )}
    </div>
  );
}

// ── StatBox: 작은 통계 박스 (숫자 + 라벨) ────────────────────────────
// 사용 예시: <StatBox value="18,242" label="포인트" icon="⭐" color="pink" />
export function StatBox({ value, label, icon, color = "accent", style = {} }) {
  const colorMap = {
    yellow: { main: T.yellow, light: T.yellowLight },
    orange: { main: T.orange, light: T.orangeLight },
    red:    { main: T.red,    light: T.redLight },
    purple: { main: T.purple, light: T.purpleLight },
    blue:   { main: T.blue,   light: T.blueLight },
    green:  { main: T.green,  light: T.greenLight },
    pink:   { main: T.pink,   light: T.pinkLight },
    teal:   { main: T.teal,   light: T.tealLight },
    accent: { main: T.accent, light: T.accentLight },
  };
  const c = colorMap[color] || colorMap.accent;
  
  return (
    <div style={{
      background: c.light,
      borderRadius: T.radius,
      padding: "12px 16px",
      textAlign: "center",
      ...style
    }}>
      {icon && <div style={{ fontSize: 20, marginBottom: 2 }}>{icon}</div>}
      <div style={{ 
        fontSize: 18, 
        fontWeight: 900, 
        color: c.main,
        lineHeight: 1,
      }}>{value}</div>
      <div style={{ 
        fontSize: 10, 
        color: T.textMid,
        fontWeight: 700,
        marginTop: 4,
      }}>{label}</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//   💾 학생 기록 저장 헬퍼 (기존 유지)
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
      ].slice(-50)
    };
    return { ...prev, [name]: updated };
  });
}
