// ══════════════════════════════════════════════════════════════════════════
//   ✍️ LetterTracing.jsx — 알파벳 따라쓰기 컴포넌트 (52자)
//   - 4선지 가이드 + 획순/방향 안내 + 시범 재생
//   - letterStrokes.js의 획 경로 데이터 사용
//   - 소리효과(onCorrect/playClick) + Angela 연동 가능
// ══════════════════════════════════════════════════════════════════════════
import React, { useState, useRef, useEffect, useCallback } from "react";
import { getLetterStrokes, GUIDE_LINES } from "./letterStrokes";
import { onCorrect, playClick } from "./soundEffects";

// 음성으로 글자 읽기 (앱에 speakLetter가 있으면 그걸 써도 됨)
function speak(text, rate = 0.8) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = rate;
  window.speechSynthesis.speak(u);
}

const STROKE_COLORS = ["#4f8ef7", "#f59e0b", "#22c55e", "#ec4899"];

export default function LetterTracing({
  letter = "A",
  onComplete,          // (letter) => void  — 글자 완성 시 호출 (Angela 등 연동)
  showGuideLines = true,
  passThreshold = 0.65, // 획을 통과로 인정할 커버리지 (아이용으로 너그럽게)
  tolerance = 30,       // 경로에서 이만큼(px) 안쪽이면 따라간 걸로 인정
}) {
  const strokes = getLetterStrokes(letter) || [];
  const svgRef = useRef(null);
  const guideRefs = useRef([]);          // 각 획 path DOM
  const [strokeIdx, setStrokeIdx] = useState(0);
  const [inked, setInked] = useState("");
  const [status, setStatus] = useState("idle"); // idle | drawing | ok | back | short | done
  const [msg, setMsg] = useState("");
  const drawing = useRef(false);
  const pts = useRef([]);
  const covered = useRef([]);
  const totalSamples = useRef(0);
  const animRef = useRef(null);
  const [pacer, setPacer] = useState(null); // {x,y} | null

  const g = GUIDE_LINES;

  // 글자가 바뀌면 초기화
  useEffect(() => {
    cancelAnim();
    setStrokeIdx(0);
    setInked("");
    setStatus("idle");
    setMsg("초록 점에서 시작해 화살표 방향으로 그어요");
    drawing.current = false;
    pts.current = [];
  }, [letter]);

  // 현재 획이 바뀌면 커버리지 샘플 초기화
  useEffect(() => {
    const path = guideRefs.current[strokeIdx];
    if (!path) return;
    const len = path.getTotalLength();
    totalSamples.current = Math.max(30, Math.floor(len / 6));
    covered.current = new Array(totalSamples.current).fill(false);
    pts.current = [];
    setInked("");
  }, [strokeIdx, letter]);

  const cancelAnim = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = null;
    setPacer(null);
  };

  const toLocal = (e) => {
    const svg = svgRef.current;
    const r = svg.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return {
      x: ((t.clientX - r.left) / r.width) * 300,
      y: ((t.clientY - r.top) / r.height) * 300,
    };
  };

  const nearest = (p) => {
    const path = guideRefs.current[strokeIdx];
    if (!path) return { d: 999, i: -1 };
    const len = path.getTotalLength();
    let best = 999, bi = -1;
    const n = totalSamples.current;
    for (let i = 0; i < n; i++) {
      const gp = path.getPointAtLength((i / n) * len);
      const d = Math.hypot(gp.x - p.x, gp.y - p.y);
      if (d < best) { best = d; bi = i; }
    }
    return { d: best, i: bi };
  };

  const mark = (p) => {
    const nr = nearest(p);
    if (nr.d < tolerance && nr.i >= 0) covered.current[nr.i] = true;
  };

  const coverage = () => {
    const arr = covered.current;
    let c = 0;
    for (let i = 0; i < arr.length; i++) if (arr[i]) c++;
    return arr.length ? c / arr.length : 0;
  };

  const start = (e) => {
    if (animRef.current) return;
    e.preventDefault();
    const p = toLocal(e);
    const nr = nearest(p);
    // 시작점 근처(앞쪽 30%)에서 시작했는지
    if (nr.i > totalSamples.current * 0.35) {
      setStatus("back");
      setMsg("시작점(초록 점)부터 시작해요");
      return;
    }
    drawing.current = true;
    pts.current = [p];
    mark(p);
    setStatus("drawing");
  };

  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const p = toLocal(e);
    pts.current.push(p);
    mark(p);
    const ps = pts.current;
    let d = `M ${ps[0].x} ${ps[0].y}`;
    for (let i = 1; i < ps.length; i++) d += ` L ${ps[i].x} ${ps[i].y}`;
    setInked(d);
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const score = coverage();
    if (score >= passThreshold) {
      if (strokeIdx < strokes.length - 1) {
        playClick();
        setStrokeIdx((i) => i + 1);
        setStatus("ok");
        setMsg(`좋아요! 다음 획 ${strokeIdx + 2}번`);
      } else {
        setStatus("done");
        setMsg(`완성! ${letter} 잘 썼어요 ⭐`);
        onCorrect();
        speak(letter);
        if (onComplete) onComplete(letter);
      }
    } else {
      setStatus("short");
      setMsg("점선을 끝까지 따라가 봐요");
      // 현재 획 다시
      covered.current = new Array(totalSamples.current).fill(false);
      pts.current = [];
      setInked("");
    }
  };

  const playDemo = useCallback(() => {
    if (animRef.current || drawing.current) return;
    const path = guideRefs.current[strokeIdx];
    if (!path) return;
    const len = path.getTotalLength();
    const dur = 1100;
    let t0 = null;
    setMsg("이 방향으로 그어요 👀");
    setStatus("drawing");
    const step = (ts) => {
      if (!t0) t0 = ts;
      const t = (ts - t0) / dur;
      if (t >= 1) {
        cancelAnim();
        covered.current = new Array(totalSamples.current).fill(false);
        setInked("");
        setMsg("이제 직접 따라 그어보세요");
        setStatus("idle");
        return;
      }
      const cp = path.getPointAtLength(t * len);
      setPacer({ x: cp.x, y: cp.y });
      let d = "";
      const s0 = path.getPointAtLength(0);
      d = `M ${s0.x} ${s0.y}`;
      for (let l = 0; l <= t * len; l += 5) {
        const q = path.getPointAtLength(l);
        d += ` L ${q.x} ${q.y}`;
      }
      setInked(d);
      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
  }, [strokeIdx]);

  const reset = () => {
    cancelAnim();
    setStrokeIdx(0);
    setInked("");
    setStatus("idle");
    setMsg("초록 점에서 시작해 화살표 방향으로 그어요");
  };

  // 시작점 좌표 (현재 획)
  const startPt = (() => {
    const path = guideRefs.current[strokeIdx];
    if (!path) return null;
    try { return path.getPointAtLength(0); } catch { return null; }
  })();

  const inkColor = status === "done" ? "#22c55e" : "#4f8ef7";
  const statusColor =
    status === "done" || status === "ok" ? "#22c55e" :
    status === "back" || status === "short" ? "#f59e0b" :
    status === "drawing" ? "#4f8ef7" : "#6b7280";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <svg
        ref={svgRef}
        viewBox="0 0 300 300"
        style={{ width: "100%", maxWidth: 300, touchAction: "none", cursor: "crosshair",
                 background: "#fff", borderRadius: 16, border: "1px solid #eee" }}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      >
        <defs>
          <marker id="lt-arrow" viewBox="0 0 10 10" refX="6" refY="5"
                  markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#4f8ef7" />
          </marker>
        </defs>

        {/* 4선지 */}
        {showGuideLines && [
          [g.cap, "2 5"], [g.mid, "2 5"], [g.base, null], [g.desc, "2 5"],
        ].map(([y, dash], i) => (
          <line key={i} x1="18" y1={y} x2="282" y2={y}
                stroke="#cbd5e1" strokeWidth={dash ? 1 : 1.5}
                strokeDasharray={dash || undefined}
                opacity={dash ? 0.6 : 0.8} />
        ))}

        {/* 옅은 글자 본 (ghost) — 전체 획 */}
        {strokes.map((d, i) => (
          <path key={`ghost-${i}`} d={d} fill="none" stroke="#e5e7eb"
                strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
        ))}

        {/* 가이드 경로 (현재 획만 진하게 + 화살표) */}
        {strokes.map((d, i) => (
          <path
            key={`guide-${i}`}
            ref={(el) => (guideRefs.current[i] = el)}
            d={d}
            fill="none"
            stroke={i === strokeIdx ? "#94a3b8" : "transparent"}
            strokeWidth="3"
            strokeDasharray="6 10"
            strokeLinecap="round"
            markerEnd={i === strokeIdx ? "url(#lt-arrow)" : undefined}
          />
        ))}

        {/* 획 순서 번호 (획 2개 이상일 때) */}
        {strokes.length > 1 && strokes.map((d, i) => {
          const path = guideRefs.current[i];
          if (!path) return null;
          let s;
          try { s = path.getPointAtLength(0); } catch { return null; }
          const doneStroke = i < strokeIdx;
          return (
            <g key={`num-${i}`}>
              <circle cx={s.x} cy={s.y} r="13"
                      fill={doneStroke ? "#22c55e" : "#fff"}
                      stroke="#94a3b8" strokeWidth="1.5" />
              <text x={s.x} y={s.y} textAnchor="middle" dominantBaseline="central"
                    fontSize="15" fontWeight="700"
                    fill={doneStroke ? "#fff" : "#64748b"}>{i + 1}</text>
            </g>
          );
        })}

        {/* 사용자가 그린 잉크 */}
        <path d={inked} fill="none" stroke={inkColor} strokeWidth="14"
              strokeLinecap="round" strokeLinejoin="round" />

        {/* 시범 안내 점 */}
        {pacer && (
          <circle cx={pacer.x} cy={pacer.y} r="9" fill="#4f8ef7" stroke="#fff" strokeWidth="2" />
        )}

        {/* 시작점 (그리기 전) */}
        {status !== "done" && !pacer && startPt && pts.current.length === 0 && (
          <circle cx={startPt.x} cy={startPt.y} r="12" fill="#22c55e" />
        )}
      </svg>

      <div style={{ fontSize: 15, fontWeight: 700, color: statusColor, minHeight: 22, textAlign: "center" }}>
        {msg}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={playDemo}
          style={{ padding: "8px 16px", borderRadius: 10, border: "1.5px solid #4f8ef7",
                   background: "#fff", color: "#4f8ef7", fontWeight: 800, cursor: "pointer" }}>
          ▶ 시범
        </button>
        <button onClick={reset}
          style={{ padding: "8px 16px", borderRadius: 10, border: "1.5px solid #e5e7eb",
                   background: "#fff", color: "#6b7280", fontWeight: 800, cursor: "pointer" }}>
          ↺ 다시
        </button>
      </div>
    </div>
  );
}
