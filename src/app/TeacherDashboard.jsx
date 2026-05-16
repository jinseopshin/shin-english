"use client";
import { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from "recharts";

// ── THEME (Angela Academy 톤 유지) ─────────────────────────────────────
const T = {
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
  text: "#1e293b",
  textMid: "#64748b",
  textDim: "#94a3b8",
  shadow: "0 4px 16px rgba(79,142,247,0.12)",
  shadowLg: "0 8px 32px rgba(79,142,247,0.18)",
};

// ── 샘플 데이터 (실제로는 localStorage/DB에서) ──────────────────────────
const SAMPLE_STUDENTS = [
  { id: 1, name: "김민준", grade: "초등5", level: "B", points: 1240, lastActive: "오늘",
    assignDone: 8, assignTotal: 10, gameScore: 85, accuracy: 87, streak: 12, avatar: "🦊" },
  { id: 2, name: "이서연", grade: "초등5", level: "A", points: 1890, lastActive: "오늘",
    assignDone: 10, assignTotal: 10, gameScore: 95, accuracy: 94, streak: 23, avatar: "🐰" },
  { id: 3, name: "박지호", grade: "초등6", level: "B", points: 980, lastActive: "어제",
    assignDone: 6, assignTotal: 10, gameScore: 72, accuracy: 75, streak: 5, avatar: "🐻" },
  { id: 4, name: "최유나", grade: "중1", level: "A", points: 2150, lastActive: "오늘",
    assignDone: 9, assignTotal: 10, gameScore: 92, accuracy: 91, streak: 18, avatar: "🦁" },
  { id: 5, name: "정도윤", grade: "초등4", level: "C", points: 540, lastActive: "3일 전",
    assignDone: 3, assignTotal: 10, gameScore: 58, accuracy: 62, streak: 0, avatar: "🐼" },
  { id: 6, name: "강하은", grade: "초등6", level: "B", points: 1320, lastActive: "오늘",
    assignDone: 7, assignTotal: 10, gameScore: 80, accuracy: 83, streak: 9, avatar: "🐨" },
  { id: 7, name: "윤서준", grade: "중1", level: "A", points: 1980, lastActive: "오늘",
    assignDone: 10, assignTotal: 10, gameScore: 89, accuracy: 88, streak: 15, avatar: "🦝" },
  { id: 8, name: "임채원", grade: "초등5", level: "C", points: 680, lastActive: "2일 전",
    assignDone: 4, assignTotal: 10, gameScore: 64, accuracy: 68, streak: 2, avatar: "🐯" },
];

// 주간 활동 추이
const WEEKLY_ACTIVITY = [
  { day: "월", 과제: 18, 게임: 32 },
  { day: "화", 과제: 22, 게임: 38 },
  { day: "수", 과제: 25, 게임: 45 },
  { day: "목", 과제: 20, 게임: 41 },
  { day: "금", 과제: 28, 게임: 52 },
  { day: "토", 과제: 15, 게임: 48 },
  { day: "일", 과제: 12, 게임: 35 },
];

// 단어 카테고리별 정답률
const CATEGORY_STATS = [
  { category: "동물", 정답률: 88 },
  { category: "음식", 정답률: 92 },
  { category: "학교", 정답률: 78 },
  { category: "가족", 정답률: 85 },
  { category: "감정", 정답률: 72 },
  { category: "자연", 정답률: 80 },
];

// 게임별 인기도
const GAME_POPULARITY = [
  { name: "단어 맞추기", value: 145, color: "#4f8ef7" },
  { name: "스펠링", value: 98, color: "#22c55e" },
  { name: "스피드 퀴즈", value: 132, color: "#f59e0b" },
  { name: "플래시카드", value: 76, color: "#ec4899" },
];

// ── UI 컴포넌트 ────────────────────────────────────────────────────────
const Card = ({ children, style = {}, ...props }) => (
  <div style={{
    background: T.card, borderRadius: 18, padding: 18,
    boxShadow: T.shadow, border: `1px solid ${T.border}`,
    ...style
  }} {...props}>{children}</div>
);

const StatCard = ({ icon, label, value, sub, color = T.accent, bgColor = T.accentLight }) => (
  <Card style={{ padding: 16 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14, background: bgColor,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: T.textMid, fontWeight: 600, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: T.text, lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color, fontWeight: 700, marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  </Card>
);

const Tag = ({ children, color = T.accent, bg = T.accentLight }) => (
  <span style={{
    fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 8,
    color, background: bg, letterSpacing: 0.3
  }}>{children}</span>
);

const LEVEL_COLORS = {
  A: { color: T.green, bg: T.greenLight, label: "상위" },
  B: { color: T.accent, bg: T.accentLight, label: "중위" },
  C: { color: T.orange, bg: T.orangeLight, label: "기초" },
};

// ── 학생 상세 모달 ─────────────────────────────────────────────────────
function StudentDetailModal({ student, onClose }) {
  if (!student) return null;
  const lvl = LEVEL_COLORS[student.level];

  // 학생별 영역 점수 (레이더 차트용)
  const skillData = [
    { skill: "어휘력", score: student.accuracy },
    { skill: "스펠링", score: Math.max(40, student.gameScore - 5) },
    { skill: "속도", score: Math.min(100, student.gameScore + 3) },
    { skill: "이해도", score: student.accuracy - 3 },
    { skill: "꾸준함", score: Math.min(100, student.streak * 4) },
  ];

  // 최근 7일 점수 추이
  const trendData = Array.from({ length: 7 }, (_, i) => ({
    day: `${i + 1}일`,
    점수: Math.max(40, Math.min(100, student.gameScore + (Math.sin(i * 1.2 + student.id) * 12)))
  }));

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 200
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: T.card, borderRadius: 22, maxWidth: 600, width: "100%",
        maxHeight: "90vh", overflowY: "auto", boxShadow: T.shadowLg
      }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${T.accent} 0%, ${T.purple} 100%)`,
          padding: "24px 24px 28px", color: "white", borderRadius: "22px 22px 0 0", position: "relative"
        }}>
          <button onClick={onClose} style={{
            position: "absolute", top: 14, right: 14, width: 32, height: 32, borderRadius: 10,
            background: "rgba(255,255,255,0.25)", color: "white", border: "none", fontSize: 18,
            cursor: "pointer", fontWeight: 700
          }}>✕</button>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 18, background: "rgba(255,255,255,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36
            }}>{student.avatar}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>{student.name}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 8, background: "rgba(255,255,255,0.25)" }}>{student.grade}</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 8, background: "rgba(255,255,255,0.25)" }}>레벨 {student.level} · {lvl.label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 8, background: "rgba(255,255,255,0.25)" }}>⭐ {student.points}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: 20 }}>
          {/* 핵심 지표 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20 }}>
            <div style={{ background: T.greenLight, borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: T.green }}>{Math.round(student.assignDone / student.assignTotal * 100)}%</div>
              <div style={{ fontSize: 10, color: T.textMid, fontWeight: 600 }}>과제 완료율</div>
            </div>
            <div style={{ background: T.accentLight, borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: T.accent }}>{student.accuracy}%</div>
              <div style={{ fontSize: 10, color: T.textMid, fontWeight: 600 }}>정답률</div>
            </div>
            <div style={{ background: T.yellowLight, borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: T.yellow }}>{student.gameScore}</div>
              <div style={{ fontSize: 10, color: T.textMid, fontWeight: 600 }}>게임 평균</div>
            </div>
            <div style={{ background: T.pinkLight, borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: T.pink }}>🔥 {student.streak}</div>
              <div style={{ fontSize: 10, color: T.textMid, fontWeight: 600 }}>연속 학습일</div>
            </div>
          </div>

          {/* 영역별 능력 (레이더 차트) */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 8 }}>📊 영역별 능력</div>
            <div style={{ background: T.bg, borderRadius: 14, padding: "12px 8px", height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={skillData}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: T.textMid, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: T.textDim }} />
                  <Radar name={student.name} dataKey="score" stroke={T.accent} fill={T.accent} fillOpacity={0.4} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 최근 점수 추이 */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 8 }}>📈 최근 7일 점수 추이</div>
            <div style={{ background: T.bg, borderRadius: 14, padding: "12px 8px", height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.accent} stopOpacity={0.5} />
                      <stop offset="100%" stopColor={T.accent} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: T.textMid }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: T.textMid }} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 12 }} />
                  <Area type="monotone" dataKey="점수" stroke={T.accent} strokeWidth={2.5} fill="url(#g1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 메인 대시보드 ──────────────────────────────────────────────────────
export default function TeacherDashboard() {
  const [filter, setFilter] = useState("all"); // all | A | B | C
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("points"); // points | accuracy | streak
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    let list = SAMPLE_STUDENTS;
    if (filter !== "all") list = list.filter(s => s.level === filter);
    if (search) list = list.filter(s => s.name.includes(search));
    return [...list].sort((a, b) => b[sortBy] - a[sortBy]);
  }, [filter, search, sortBy]);

  // 전체 통계
  const stats = useMemo(() => {
    const total = SAMPLE_STUDENTS.length;
    const activeToday = SAMPLE_STUDENTS.filter(s => s.lastActive === "오늘").length;
    const avgAccuracy = Math.round(SAMPLE_STUDENTS.reduce((s, x) => s + x.accuracy, 0) / total);
    const totalPoints = SAMPLE_STUDENTS.reduce((s, x) => s + x.points, 0);
    const assignmentRate = Math.round(SAMPLE_STUDENTS.reduce((s, x) => s + (x.assignDone / x.assignTotal), 0) / total * 100);
    return { total, activeToday, avgAccuracy, totalPoints, assignmentRate };
  }, []);

  // 레벨 분포
  const levelDist = useMemo(() => [
    { name: "상위 (A)", value: SAMPLE_STUDENTS.filter(s => s.level === "A").length, color: T.green },
    { name: "중위 (B)", value: SAMPLE_STUDENTS.filter(s => s.level === "B").length, color: T.accent },
    { name: "기초 (C)", value: SAMPLE_STUDENTS.filter(s => s.level === "C").length, color: T.orange },
  ], []);

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${T.accent} 0%, ${T.purple} 100%)`,
        padding: "20px 16px 24px", color: "white"
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 2 }}>📊 학생 진도 & 통계 대시보드</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>Angela's English Academy · 실시간 학습 현황</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(255,255,255,0.25)", border: "none", color: "white", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>📥 엑셀 내보내기</button>
            <button style={{ padding: "8px 14px", borderRadius: 10, background: "white", border: "none", color: T.accent, fontWeight: 800, fontSize: 12, cursor: "pointer" }}>📋 리포트 생성</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 16px 40px" }}>
        {/* 핵심 지표 카드 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
          <StatCard icon="👥" label="전체 학생" value={stats.total} sub={`오늘 ${stats.activeToday}명 활동`} color={T.accent} bgColor={T.accentLight} />
          <StatCard icon="✅" label="평균 과제 완료율" value={`${stats.assignmentRate}%`} sub="이번 주 기준" color={T.green} bgColor={T.greenLight} />
          <StatCard icon="🎯" label="평균 정답률" value={`${stats.avgAccuracy}%`} sub="전체 게임 합산" color={T.yellow} bgColor={T.yellowLight} />
          <StatCard icon="⭐" label="누적 포인트" value={stats.totalPoints.toLocaleString()} sub="학원 전체" color={T.pink} bgColor={T.pinkLight} />
        </div>

        {/* 차트 영역 */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 24 }}>
          {/* 주간 활동 추이 */}
          <Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>📅 주간 활동 추이</div>
              <Tag color={T.accent} bg={T.accentLight}>이번 주</Tag>
            </div>
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={WEEKLY_ACTIVITY}>
                  <defs>
                    <linearGradient id="gradA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.accent} stopOpacity={0.6} />
                      <stop offset="100%" stopColor={T.accent} stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="gradB" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.pink} stopOpacity={0.6} />
                      <stop offset="100%" stopColor={T.pink} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: T.textMid }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textMid }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${T.border}`, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                  <Area type="monotone" dataKey="과제" stroke={T.accent} strokeWidth={2.5} fill="url(#gradA)" />
                  <Area type="monotone" dataKey="게임" stroke={T.pink} strokeWidth={2.5} fill="url(#gradB)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* 레벨 분포 */}
          <Card>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 12 }}>🏆 레벨 분포</div>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={levelDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                    {levelDist.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${T.border}`, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {levelDist.map((d, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
                    <span style={{ color: T.textMid, fontWeight: 600 }}>{d.name}</span>
                  </div>
                  <span style={{ fontWeight: 800, color: T.text }}>{d.value}명</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 게임/카테고리 분석 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          {/* 단어 카테고리별 정답률 */}
          <Card>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 12 }}>📚 단어 카테고리별 정답률</div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={CATEGORY_STATS} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: T.textMid }} />
                  <YAxis type="category" dataKey="category" tick={{ fontSize: 12, fill: T.text, fontWeight: 600 }} width={50} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${T.border}`, fontSize: 12 }} />
                  <Bar dataKey="정답률" fill={T.accent} radius={[0, 8, 8, 0]}>
                    {CATEGORY_STATS.map((d, i) => (
                      <Cell key={i} fill={d.정답률 >= 85 ? T.green : d.정답률 >= 75 ? T.accent : T.orange} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* 게임별 플레이 횟수 */}
          <Card>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 12 }}>🎮 게임별 플레이 횟수</div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={GAME_POPULARITY}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textMid }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textMid }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${T.border}`, fontSize: 12 }} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {GAME_POPULARITY.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* 학생 목록 헤더 + 필터 */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: 18, borderBottom: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: T.text }}>👨‍🎓 학생별 진도 현황</div>
                <div style={{ fontSize: 11, color: T.textMid, marginTop: 2 }}>이름을 클릭하면 상세 정보를 볼 수 있어요</div>
              </div>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="🔍 학생 이름 검색"
                style={{
                  padding: "8px 12px", borderRadius: 10, border: `1.5px solid ${T.border}`,
                  fontSize: 13, outline: "none", minWidth: 180
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: T.textMid, fontWeight: 700, marginRight: 4 }}>레벨:</span>
              {[
                { id: "all", label: "전체" },
                { id: "A", label: "상위" },
                { id: "B", label: "중위" },
                { id: "C", label: "기초" }
              ].map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)} style={{
                  padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                  background: filter === f.id ? T.accent : T.accentLight,
                  color: filter === f.id ? "white" : T.accent,
                  border: "none", cursor: "pointer"
                }}>{f.label}</button>
              ))}
              <span style={{ fontSize: 11, color: T.textMid, fontWeight: 700, marginLeft: 8, marginRight: 4 }}>정렬:</span>
              {[
                { id: "points", label: "포인트순" },
                { id: "accuracy", label: "정답률순" },
                { id: "streak", label: "연속학습일순" }
              ].map(s => (
                <button key={s.id} onClick={() => setSortBy(s.id)} style={{
                  padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                  background: sortBy === s.id ? T.purple : T.purpleLight,
                  color: sortBy === s.id ? "white" : T.purple,
                  border: "none", cursor: "pointer"
                }}>{s.label}</button>
              ))}
            </div>
          </div>

          {/* 학생 목록 */}
          <div>
            {filtered.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: T.textDim }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                <div style={{ fontSize: 13 }}>검색 결과가 없어요</div>
              </div>
            ) : filtered.map((s, i) => {
              const lvl = LEVEL_COLORS[s.level];
              const assignPct = Math.round(s.assignDone / s.assignTotal * 100);
              return (
                <div key={s.id} onClick={() => setSelected(s)} style={{
                  padding: "14px 18px",
                  borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : "none",
                  display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
                  transition: "background 0.15s"
                }}
                  onMouseEnter={e => e.currentTarget.style.background = T.bg}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, background: lvl.bg,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0
                  }}>{s.avatar}</div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{s.name}</span>
                      <Tag color={lvl.color} bg={lvl.bg}>{s.grade} · {lvl.label}</Tag>
                      {s.lastActive === "오늘" && <Tag color={T.green} bg={T.greenLight}>● 활동중</Tag>}
                      {s.streak >= 10 && <Tag color={T.pink} bg={T.pinkLight}>🔥 {s.streak}일 연속</Tag>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: T.textMid }}>
                      <span>📝 과제 {s.assignDone}/{s.assignTotal}</span>
                      <span>🎯 정답률 {s.accuracy}%</span>
                      <span>⭐ {s.points.toLocaleString()}p</span>
                      <span style={{ color: s.lastActive === "오늘" ? T.green : T.textDim }}>· {s.lastActive}</span>
                    </div>
                  </div>

                  {/* 진도 바 */}
                  <div style={{ width: 100, flexShrink: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.textMid, marginBottom: 3, fontWeight: 700 }}>
                      <span>과제</span>
                      <span style={{ color: assignPct >= 80 ? T.green : assignPct >= 50 ? T.yellow : T.red }}>{assignPct}%</span>
                    </div>
                    <div style={{ height: 6, background: T.border, borderRadius: 4, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", width: `${assignPct}%`,
                        background: assignPct >= 80 ? T.green : assignPct >= 50 ? T.yellow : T.red,
                        transition: "width 0.4s"
                      }} />
                    </div>
                  </div>

                  <div style={{ fontSize: 20, color: T.textDim, flexShrink: 0 }}>›</div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* 알림 박스 */}
        <Card style={{ marginTop: 16, background: T.yellowLight, border: `1.5px dashed ${T.yellow}` }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ fontSize: 24 }}>💡</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 4 }}>관심이 필요한 학생</div>
              <div style={{ fontSize: 12, color: T.textMid, lineHeight: 1.6 }}>
                <strong style={{ color: T.red }}>정도윤</strong> 학생이 3일째 활동이 없어요. 격려 메시지를 보내보세요!<br />
                <strong style={{ color: T.orange }}>임채원</strong> 학생의 정답률(68%)이 평균보다 낮아요. 기초 단어 복습을 추천드려요.
              </div>
            </div>
          </div>
        </Card>
      </div>

      <StudentDetailModal student={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
