"use client";
import { useState, useMemo } from "react";
import { T, Btn, Tag, Card, Input } from "./theme";

// ══════════════════════════════════════════════════════════════════════════
//   📝 맞춤 시험지 시스템 (CustomExam) — features.js에서 분리
//   - CustomExamManager / Print / Banner / Play
//   외부 의존: theme만. (다른 features 함수·wordData와 안 얽힘)
// ══════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════
//   📝 맞춤 시험지 시스템 (Custom Exam)
//   - CustomExamManager:  선생님이 문제집에서 문제 골라 학생에게 시험 출제
//   - CustomExamPrint:    A4 시험지 인쇄 (문제 + 답란 + 채점란)
//   - CustomExamBanner:   학생 홈에 표시되는 시험 알림 배너
//   - CustomExamPlay:     학생이 웹에서 시험 풀기 (자동 채점)
// ══════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════
//   1) 선생님: 맞춤 시험지 관리자
// ════════════════════════════════════════════════════════════════════
export function CustomExamManager({ students, setStudents, bank, onNav }) {
  const studentList = Object.values(students || {});
  const bankList = Object.values(bank || {});
  const [step, setStep] = useState("list"); // list | create | print
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedBankId, setSelectedBankId] = useState(bankList[0]?.id || null);
  const [picked, setPicked] = useState({}); // { qid: true }
  const [title, setTitle] = useState("");
  const [search, setSearch] = useState(""); // 문제 검색
  const [filterMode, setFilterMode] = useState("all"); // all | onlyPicked | unchecked

  const pickStudent = (s) => {
    setSelectedStudent(s.name);
    setSelectedBankId(bankList[0]?.id || null);
    setPicked({});
    setTitle(`${s.name} 시험 ${new Date().toISOString().slice(5,10)}`);
    setSearch("");
    setFilterMode("all");
    setStep("create");
  };

  const currentBank = selectedBankId ? bank[selectedBankId] : null;
  const allQs = currentBank?.questions || [];
  // 검색 + 필터 적용
  const candidateQs = useMemo(() => {
    let qs = allQs;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      qs = qs.filter(item => {
        const inQuestion = (item.q || "").toLowerCase().includes(q);
        const inOpts = (item.opts || []).some(o => (o || "").toLowerCase().includes(q));
        return inQuestion || inOpts;
      });
    }
    if (filterMode === "onlyPicked") qs = qs.filter(item => picked[item.id]);
    if (filterMode === "unchecked") qs = qs.filter(item => !picked[item.id]);
    return qs;
  }, [allQs, search, filterMode, picked]);
  const pickedCount = Object.values(picked).filter(Boolean).length;
  const togglePick = (qid) => setPicked(p => ({ ...p, [qid]: !p[qid] }));
  const pickAll = () => {
    const next = { ...picked };
    candidateQs.forEach(q => { next[q.id] = true; });
    setPicked(next);
  };
  const clearPick = () => setPicked({});

  // 시험지 저장 (학생에게 배정)
  const saveExam = () => {
    if (!selectedStudent) return;
    if (pickedCount === 0) { alert("최소 1개 이상의 문제를 선택해주세요"); return; }
    const stu = students[selectedStudent];
    if (stu?.customExam?.active) {
      if (!confirm(`${selectedStudent} 학생에게 이미 진행 중인 시험이 있습니다. 덮어쓸까요?`)) return;
    }
    const pickedQs = allQs.filter(q => picked[q.id]);
    const exam = {
      id: "exam_" + Date.now().toString(36),
      title: title || `${selectedStudent} 시험`,
      createdAt: new Date().toISOString(),
      bankId: selectedBankId,
      bankTitle: currentBank?.title || "",
      questions: pickedQs.map(q => ({
        id: q.id, q: q.q, opts: q.opts || [], ans: q.ans, exp: q.exp || ""
      })),
      active: true,
      completed: false,
    };
    setStudents(prev => ({
      ...prev,
      [selectedStudent]: { ...prev[selectedStudent], customExam: exam }
    }));
    alert(`${selectedStudent} 학생에게 ${pickedQs.length}문항 시험을 배정했어요!`);
    setStep("list");
    setSelectedStudent(null);
    setPicked({});
  };

  // 시험 취소
  const cancelExam = (studentName) => {
    if (!confirm(`${studentName} 학생의 진행중인 시험을 취소할까요?`)) return;
    setStudents(prev => {
      const s = prev[studentName];
      if (!s?.customExam) return prev;
      return { ...prev, [studentName]: { ...s, customExam: { ...s.customExam, active: false, canceledAt: new Date().toISOString() } } };
    });
  };

  // ── 화면 1: 학생 목록 ──
  if (step === "list") {
    return (
      <div>
        <div style={{ fontSize: 18, fontWeight: 900, color: T.text, marginBottom: 4 }}>📝 맞춤 시험지 만들기</div>
        <div style={{ fontSize: 12, color: T.textMid, marginBottom: 16 }}>
          학생별로 문제집에서 원하는 문제만 골라 시험지를 만들 수 있어요. 웹에서 풀게 하거나 인쇄해서 종이로도 가능합니다.
        </div>

        {bankList.length === 0 ? (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 30, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📚</div>
            <div style={{ fontSize: 13, color: T.textMid, marginBottom: 12 }}>먼저 문제집을 만들어야 해요</div>
            <button onClick={() => onNav("bank")} style={{
              background: T.accent, color: "white", border: "none", borderRadius: 10,
              padding: "10px 18px", fontSize: 12, fontWeight: 800, cursor: "pointer"
            }}>📚 문제 은행으로 이동</button>
          </div>
        ) : studentList.length === 0 ? (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 30, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>👶</div>
            <div style={{ fontSize: 13, color: T.textMid }}>먼저 [학생 관리]에서 학생을 등록해주세요.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {studentList.map(s => {
              const ex = s.customExam;
              const active = ex?.active;
              const total = ex?.questions?.length || 0;
              const submitted = ex?.completed || false;
              const score = ex?.score;
              return (
                <div key={s.name} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: active ? 10 : 0 }}>
                    <div style={{ fontSize: 26 }}>{s.avatar || "🙂"}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: T.text }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: T.textMid }}>{s.grade || "학년 미지정"}</div>
                    </div>
                    {!active && (
                      <button onClick={() => pickStudent(s)} style={{
                        background: T.accent, color: "white", border: "none", borderRadius: 10,
                        padding: "8px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer"
                      }}>+ 시험 출제</button>
                    )}
                  </div>
                  {active && (
                    <div style={{ background: submitted ? T.greenLight : T.yellowLight, borderRadius: 10, padding: 10, fontSize: 11 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ fontWeight: 800, color: T.text }}>
                          {submitted ? "✅ 완료" : "📝 진행중"}: {ex.title}
                        </div>
                        <div style={{ fontWeight: 800, color: submitted ? T.green : T.orange }}>
                          {submitted ? `${score}/${total}점` : `${total}문항`}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => { setSelectedStudent(s.name); setStep("print"); }}
                          style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", color: T.text }}>
                          🖨️ 시험지 인쇄
                        </button>
                        <button onClick={() => cancelExam(s.name)}
                          style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", color: T.red }}>
                          시험 취소
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── 화면 2: 문제 선택 ──
  if (step === "create") {
    const stu = students[selectedStudent];

    return (
      <div>
        <button onClick={() => setStep("list")} style={{
          background: "none", border: "none", color: T.accent, fontSize: 12, fontWeight: 700,
          padding: "4px 0", marginBottom: 10, cursor: "pointer"
        }}>← 학생 목록으로</button>

        <div style={{ background: T.accentLight, borderRadius: 14, padding: 14, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 30 }}>{stu?.avatar || "🙂"}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: T.text }}>{selectedStudent}</div>
              <div style={{ fontSize: 11, color: T.textMid }}>{stu?.grade} · 시험 출제</div>
            </div>
          </div>
        </div>

        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="시험 이름 (예: 동사 단원 평가)"
          style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${T.border}`,
            fontSize: 13, marginBottom: 12, background: T.card, color: T.text }} />

        {/* 문제집 선택 */}
        <div style={{ fontSize: 12, fontWeight: 800, color: T.textMid, marginBottom: 6 }}>📚 문제집 선택</div>
        <select value={selectedBankId || ""} onChange={e => { setSelectedBankId(e.target.value); setPicked({}); }}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${T.border}`,
            fontSize: 13, marginBottom: 14, background: T.card, color: T.text }}>
          {bankList.map(b => (
            <option key={b.id} value={b.id}>{b.title} ({b.questions?.length || 0}문항)</option>
          ))}
        </select>

        {/* 🔍 검색 + 필터 */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 문제 내용 검색"
            style={{
              flex: 1, padding: "8px 10px", borderRadius: 8,
              border: `1px solid ${T.border}`, fontSize: 12,
              background: T.card, color: T.text
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{
              background: T.card, border: `1px solid ${T.border}`, borderRadius: 8,
              padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", color: T.textMid
            }}>×</button>
          )}
        </div>

        {/* 필터 토글 */}
        <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
          {[
            { id: "all", label: `전체 (${allQs.length})` },
            { id: "onlyPicked", label: `✓ 선택 (${pickedCount})` },
            { id: "unchecked", label: `미선택 (${allQs.length - pickedCount})` },
          ].map(f => (
            <button key={f.id} onClick={() => setFilterMode(f.id)} style={{
              background: filterMode === f.id ? T.accent : T.card,
              color: filterMode === f.id ? "white" : T.text,
              border: `1px solid ${filterMode === f.id ? T.accent : T.border}`,
              borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer"
            }}>{f.label}</button>
          ))}
        </div>

        {/* 선택 컨트롤 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "8px 0", borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 12, color: T.textMid }}>
            <span style={{ fontWeight: 900, color: T.accent, fontSize: 14 }}>{pickedCount}</span>
            <span>문항 선택 중 · 보이는 문항 {candidateQs.length}개</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={pickAll} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", color: T.text }}>보이는 것 전체</button>
            <button onClick={clearPick} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", color: T.textMid }}>전체 해제</button>
          </div>
        </div>

        {/* 문제 리스트 */}
        <div style={{ maxHeight: 480, overflowY: "auto", marginBottom: 14, padding: 2, display: "grid", gap: 6 }}>
          {candidateQs.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", color: T.textDim, fontSize: 12 }}>
              {search.trim() ? `"${search}" 검색 결과가 없어요` : "이 문제집에 등록된 문제가 없어요"}
            </div>
          ) : candidateQs.map((q, i) => {
            const isPicked = !!picked[q.id];
            return (
              <button key={q.id} onClick={() => togglePick(q.id)}
                style={{
                  background: isPicked ? T.accentLight : T.card,
                  border: `2px solid ${isPicked ? T.accent : T.border}`,
                  borderRadius: 10, padding: "10px 12px", cursor: "pointer", textAlign: "left",
                  transition: "all 0.1s"
                }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <div style={{
                    minWidth: 22, height: 22, borderRadius: 6,
                    background: isPicked ? T.accent : T.border,
                    color: isPicked ? "white" : T.textMid,
                    fontSize: 11, fontWeight: 900,
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4, lineHeight: 1.4 }}>
                      {q.q || "(빈 문제)"}
                    </div>
                    {q.opts && q.opts.filter(o => o).length > 0 && (
                      <div style={{ fontSize: 10, color: T.textMid }}>
                        정답: <span style={{ color: T.green, fontWeight: 700 }}>{["①","②","③","④","⑤"][q.ans] || "?"} {q.opts[q.ans] || ""}</span>
                      </div>
                    )}
                  </div>
                  {isPicked && <span style={{ fontSize: 16, color: T.accent }}>✓</span>}
                </div>
              </button>
            );
          })}
        </div>

        <button onClick={saveExam} disabled={pickedCount === 0}
          style={{
            width: "100%", background: pickedCount === 0 ? T.border : T.green, color: "white",
            border: "none", borderRadius: 12, padding: "14px 16px",
            fontSize: 15, fontWeight: 900, cursor: pickedCount === 0 ? "not-allowed" : "pointer"
          }}>
          📬 {selectedStudent}에게 {pickedCount}문항 시험으로 배정하기
        </button>
      </div>
    );
  }

  // ── 화면 3: 인쇄 ──
  if (step === "print") {
    return <CustomExamPrint student={students[selectedStudent]} onBack={() => setStep("list")} />;
  }

  return null;
}

// ════════════════════════════════════════════════════════════════════
//   2) 시험지 인쇄 (A4)
// ════════════════════════════════════════════════════════════════════
export function CustomExamPrint({ student, onBack }) {
  const ex = student?.customExam;
  const [showAnswers, setShowAnswers] = useState(false);

  if (!ex || !ex.questions) {
    return (
      <div style={{ padding: 30, textAlign: "center", color: T.textMid }}>
        진행중인 시험이 없어요.
        <div style={{ marginTop: 16 }}>
          <button onClick={onBack} style={{ background: T.accent, color: "white", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>← 돌아가기</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="no-print" style={{ marginBottom: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={onBack} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", color: T.text }}>← 돌아가기</button>
        <button onClick={() => setShowAnswers(a => !a)} style={{ background: showAnswers ? T.purpleLight : T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", color: T.text }}>
          {showAnswers ? "📄 학생용" : "🔑 정답지"}
        </button>
        <button onClick={() => window.print()} style={{ flex: 1, minWidth: 120, background: T.accent, color: "white", border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 900, cursor: "pointer" }}>
          🖨️ {showAnswers ? "정답지" : "시험지"} 인쇄
        </button>
      </div>

      <div className="exam-print-body" style={{ background: "white", padding: "24px 26px", borderRadius: 8, boxShadow: T.shadow, color: "#222" }}>
        {/* 헤더 */}
        <div style={{ textAlign: "center", borderBottom: "2px solid #333", paddingBottom: 10, marginBottom: 16 }}>
          <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>
            📝 {ex.title} {showAnswers && <span style={{ color: "#d32", fontSize: 16 }}>[정답]</span>}
          </div>
          <div style={{ fontSize: 11, color: "#666" }}>
            이름: <span style={{ borderBottom: "1px solid #999", padding: "0 30px" }}>{student.name}</span>
            <span style={{ margin: "0 14px" }}>·</span>
            점수: <span style={{ borderBottom: "1px solid #999", padding: "0 24px" }}>{showAnswers ? `${ex.questions.length}/${ex.questions.length}` : ""}</span>
            <span style={{ margin: "0 14px" }}>·</span>
            날짜: <span style={{ borderBottom: "1px solid #999", padding: "0 28px" }}>{ex.createdAt?.slice(0, 10)}</span>
          </div>
        </div>

        {/* 문제 목록 */}
        <div style={{ fontSize: 13, lineHeight: 1.6 }}>
          {ex.questions.map((q, i) => {
            const validOpts = (q.opts || []).filter(o => o && o.trim());
            const hasOpts = validOpts.length > 0;
            return (
              <div key={q.id} style={{
                marginBottom: 18, paddingBottom: 14,
                borderBottom: i < ex.questions.length - 1 ? "1px dashed #ccc" : "none",
                breakInside: "avoid"
              }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  <div style={{ fontWeight: 900, minWidth: 28 }}>{i + 1}.</div>
                  <div style={{ flex: 1, fontWeight: 600 }}>{q.q}</div>
                </div>
                {hasOpts ? (
                  <div style={{ paddingLeft: 34, fontSize: 12 }}>
                    {validOpts.map((opt, oi) => {
                      const isAns = oi === q.ans;
                      return (
                        <div key={oi} style={{
                          marginBottom: 4,
                          color: showAnswers && isAns ? "#d32" : "#222",
                          fontWeight: showAnswers && isAns ? 800 : 400
                        }}>
                          {["①","②","③","④","⑤"][oi]} {opt}
                          {showAnswers && isAns && <span style={{ marginLeft: 6, fontSize: 11 }}>✓ 정답</span>}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{
                    paddingLeft: 34, marginTop: 6,
                    borderBottom: "1px solid #999", minHeight: showAnswers ? "auto" : 30,
                    color: showAnswers ? "#d32" : "#222", fontWeight: showAnswers ? 800 : 400
                  }}>
                    {showAnswers ? `정답: ${q.opts?.[q.ans] || "(미입력)"}` : ""}
                  </div>
                )}
                {showAnswers && q.exp && (
                  <div style={{ paddingLeft: 34, marginTop: 6, fontSize: 11, color: "#666", fontStyle: "italic" }}>
                    💡 해설: {q.exp}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 20, fontSize: 11, color: "#888", textAlign: "right", borderTop: "1px solid #ddd", paddingTop: 8 }}>
          Angela's English Academy · {ex.bankTitle}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//   3) 학생 홈 배너 (시험 알림)
// ════════════════════════════════════════════════════════════════════
export function CustomExamBanner({ student, onStart }) {
  const ex = student?.customExam;
  if (!ex?.active || !ex.questions?.length) return null;

  const total = ex.questions.length;
  const completed = ex.completed;
  const score = ex.score;

  return (
    <div style={{
      background: completed
        ? `linear-gradient(135deg, ${T.green} 0%, ${T.accent} 100%)`
        : `linear-gradient(135deg, ${T.orange} 0%, ${T.red} 100%)`,
      borderRadius: 14, padding: 14, marginBottom: 14, color: "white",
      boxShadow: T.shadow
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ fontSize: 30 }}>{completed ? "✅" : "📝"}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, opacity: 0.9 }}>{completed ? "시험 완료!" : "선생님이 출제한 시험"}</div>
          <div style={{ fontSize: 15, fontWeight: 900 }}>{ex.title}</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.25)", borderRadius: 10, padding: "6px 10px", textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 900 }}>{completed ? `${score}/${total}` : `${total}`}</div>
          <div style={{ fontSize: 9, opacity: 0.9 }}>{completed ? "점수" : "문항"}</div>
        </div>
      </div>
      <button onClick={onStart} style={{
        width: "100%", background: "white", color: completed ? T.green : T.orange,
        border: "none", borderRadius: 10, padding: "10px 14px",
        fontSize: 13, fontWeight: 900, cursor: "pointer"
      }}>
        {completed ? "📋 결과 다시 보기" : "▶️ 지금 시험 시작"}
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//   4) 학생 시험 풀이 화면 (웹)
// ════════════════════════════════════════════════════════════════════
export function CustomExamPlay({ student, name, setStudents, onExit }) {
  const ex = student?.customExam;
  const [answers, setAnswers] = useState(() => {
    // 이미 완료한 시험이면 저장된 답 보기
    if (ex?.completed && ex.answers) return ex.answers;
    return {};
  });
  const [submitted, setSubmitted] = useState(ex?.completed || false);
  const [reviewMode, setReviewMode] = useState(ex?.completed || false);

  if (!ex || !ex.questions?.length) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, padding: 30, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>📝</div>
        <div style={{ fontSize: 14, color: T.textMid, marginBottom: 16 }}>진행할 시험이 없어요</div>
        <button onClick={onExit} style={{ background: T.accent, color: "white", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>← 홈으로</button>
      </div>
    );
  }

  const setAnswer = (qid, optIdx) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qid]: optIdx }));
  };

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === ex.questions.length;

  const submit = () => {
    if (!allAnswered) {
      if (!confirm(`아직 ${ex.questions.length - answeredCount}문제 답을 안 했어요. 그래도 제출할까요?`)) return;
    }
    let correct = 0;
    ex.questions.forEach(q => {
      if (answers[q.id] === q.ans) correct++;
    });
    // 저장
    setStudents(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        customExam: {
          ...prev[name].customExam,
          completed: true,
          completedAt: new Date().toISOString(),
          answers,
          score: correct,
        },
        // 학습 기록에도 추가
        records: [
          ...(prev[name].records || []),
          {
            type: "custom-exam",
            date: new Date().toISOString(),
            title: ex.title,
            score: correct,
            total: ex.questions.length,
          }
        ],
        points: (prev[name].points || 0) + correct * 2, // 문제당 2포인트
      }
    }));
    setSubmitted(true);
    setReviewMode(true);
  };

  const score = reviewMode
    ? ex.questions.reduce((sum, q) => sum + (answers[q.id] === q.ans ? 1 : 0), 0)
    : 0;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, paddingBottom: 100 }}>
      {/* 상단 바 */}
      <div style={{
        background: reviewMode ? T.green : T.orange,
        color: "white", padding: "14px 16px",
        position: "sticky", top: 0, zIndex: 50,
        display: "flex", alignItems: "center", gap: 10
      }}>
        <button onClick={onExit} style={{ background: "rgba(255,255,255,0.25)", border: "none", color: "white", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>← 종료</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 900 }}>{ex.title}</div>
          <div style={{ fontSize: 10, opacity: 0.9 }}>
            {reviewMode ? `점수: ${score} / ${ex.questions.length}` : `${answeredCount} / ${ex.questions.length} 답함`}
          </div>
        </div>
      </div>

      <div className="app-container">
        {/* 문제 리스트 */}
        {ex.questions.map((q, i) => {
          const validOpts = (q.opts || []).filter(o => o && o.trim());
          const hasOpts = validOpts.length > 0;
          const myAns = answers[q.id];
          const isCorrect = reviewMode && myAns === q.ans;
          const isWrong = reviewMode && myAns !== undefined && myAns !== q.ans;

          return (
            <div key={q.id} style={{
              background: T.card,
              border: `1px solid ${reviewMode ? (isCorrect ? T.green : isWrong ? T.red : T.border) : T.border}`,
              borderRadius: 14, padding: 14, marginBottom: 12
            }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{
                  minWidth: 28, height: 28, borderRadius: 8,
                  background: reviewMode ? (isCorrect ? T.green : isWrong ? T.red : T.border) : T.accent,
                  color: "white", fontSize: 13, fontWeight: 900,
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {reviewMode ? (isCorrect ? "✓" : isWrong ? "✗" : "-") : i + 1}
                </div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: T.text, lineHeight: 1.5 }}>
                  {q.q}
                </div>
              </div>

              {hasOpts ? (
                <div style={{ display: "grid", gap: 8 }}>
                  {validOpts.map((opt, oi) => {
                    const selected = myAns === oi;
                    const correctOpt = reviewMode && oi === q.ans;
                    const wrongPick = reviewMode && selected && oi !== q.ans;
                    return (
                      <button key={oi} onClick={() => setAnswer(q.id, oi)}
                        disabled={submitted}
                        style={{
                          background: correctOpt ? T.greenLight : wrongPick ? T.redLight : selected ? T.accentLight : T.card,
                          border: `2px solid ${correctOpt ? T.green : wrongPick ? T.red : selected ? T.accent : T.border}`,
                          borderRadius: 10, padding: "10px 12px",
                          textAlign: "left", cursor: submitted ? "default" : "pointer",
                          display: "flex", alignItems: "center", gap: 10,
                          color: T.text, fontSize: 13, fontWeight: 600
                        }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: correctOpt ? T.green : wrongPick ? T.red : selected ? T.accent : T.textMid }}>
                          {["①","②","③","④","⑤"][oi]}
                        </span>
                        <span style={{ flex: 1 }}>{opt}</span>
                        {correctOpt && <span style={{ color: T.green, fontSize: 16 }}>✓</span>}
                        {wrongPick && <span style={{ color: T.red, fontSize: 16 }}>✗</span>}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: T.textMid, fontStyle: "italic" }}>
                  {reviewMode ? `정답: ${q.opts?.[q.ans] || "(미입력)"}` : "(주관식 — 종이 시험으로 풀어주세요)"}
                </div>
              )}

              {reviewMode && q.exp && (
                <div style={{ marginTop: 10, padding: 10, background: T.accentLight, borderRadius: 8, fontSize: 11, color: T.text, lineHeight: 1.5 }}>
                  💡 <strong>해설:</strong> {q.exp}
                </div>
              )}
            </div>
          );
        })}

        {/* 제출 버튼 */}
        {!submitted && (
          <button onClick={submit}
            style={{
              width: "100%", background: T.green, color: "white",
              border: "none", borderRadius: 12, padding: "16px",
              fontSize: 15, fontWeight: 900, cursor: "pointer", marginTop: 8
            }}>
            ✅ 시험 제출하기 ({answeredCount}/{ex.questions.length} 답함)
          </button>
        )}

        {reviewMode && (
          <div style={{
            background: T.greenLight, color: T.text, borderRadius: 12,
            padding: 20, textAlign: "center", marginTop: 8
          }}>
            <div style={{ fontSize: 30, marginBottom: 6 }}>🎉</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: T.green }}>
              {score} / {ex.questions.length}점
            </div>
            <div style={{ fontSize: 12, color: T.textMid, marginTop: 4 }}>
              정답률 {Math.round(score / ex.questions.length * 100)}%
            </div>
            <button onClick={onExit} style={{
              marginTop: 14, background: T.green, color: "white", border: "none",
              borderRadius: 10, padding: "10px 22px", fontSize: 13, fontWeight: 800, cursor: "pointer"
            }}>홈으로 돌아가기</button>
          </div>
        )}
      </div>
    </div>
  );
}
