"use client";
import { useState } from "react";
import { T } from "./theme";

// ══════════════════════════════════════════════════════════════════════════
//   📅 AttendanceManager — 출석 관리
//   (features.js에서 분리됨 — 독립 컴포넌트, 외부 의존: theme의 T, React useState)
// ══════════════════════════════════════════════════════════════════════════

export function AttendanceManager({ students, attendance, setAttendance }) {
  const [selDate, setSelDate] = useState(new Date().toISOString().slice(0,10));
  const [view, setView] = useState("today"); // today | history | stats

  const studentList = Object.values(students||{});
  const today = new Date().toISOString().slice(0,10);

  // 오늘 출석 데이터
  const todayData = attendance[selDate] || {};

  const mark = (name, status) => {
    setAttendance(prev=>({
      ...prev,
      [selDate]: { ...(prev[selDate]||{}), [name]: status }
    }));
  };

  const markAll = (status) => {
    const all = {};
    studentList.forEach(s=>{ all[s.name]=status; });
    setAttendance(prev=>({...prev,[selDate]:all}));
  };

  // 학생별 출석 통계 계산
  const getStats = (name) => {
    const dates = Object.keys(attendance);
    const present = dates.filter(d=>attendance[d]?.[name]==="present").length;
    const absent  = dates.filter(d=>attendance[d]?.[name]==="absent").length;
    const late    = dates.filter(d=>attendance[d]?.[name]==="late").length;
    const total   = present+absent+late;
    return {present,absent,late,total,rate:total>0?Math.round(present/total*100):0};
  };

  const STATUS = {
    present: {label:"출석",color:T.green,bg:T.greenLight,emoji:"✅"},
    late:    {label:"지각",color:T.yellow,bg:T.yellowLight,emoji:"⏰"},
    absent:  {label:"결석",color:T.red,bg:T.redLight,emoji:"❌"},
  };

  return (
    <div>
      <div style={{fontSize:16,fontWeight:900,color:T.text,marginBottom:4}}>🔔 출석 & 수업 기록</div>
      <div style={{fontSize:11,color:T.textMid,marginBottom:14}}>날짜별 출석을 기록하고 통계를 확인하세요</div>

      {/* 탭 */}
      <div style={{display:"flex",gap:6,marginBottom:14,background:T.card,padding:5,borderRadius:12,boxShadow:T.shadow}}>
        {[{id:"today",label:"📋 출석 체크"},{id:"history",label:"📅 기록 보기"},{id:"stats",label:"📊 통계"}].map(t=>(
          <button key={t.id} onClick={()=>setView(t.id)} style={{flex:1,padding:"9px 6px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:800,background:view===t.id?T.accent:"transparent",color:view===t.id?"white":T.textMid}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 출석 체크 탭 */}
      {view==="today"&&(
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap"}}>
            <input type="date" value={selDate} onChange={e=>setSelDate(e.target.value)}
              style={{padding:"8px 10px",borderRadius:9,border:`1.5px solid ${T.border}`,fontSize:13,flex:1}}/>
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>markAll("present")} style={{padding:"7px 10px",borderRadius:8,border:`1px solid ${T.green}`,background:T.greenLight,color:T.green,fontSize:11,fontWeight:700,cursor:"pointer"}}>전체 출석</button>
              <button onClick={()=>markAll("absent")} style={{padding:"7px 10px",borderRadius:8,border:`1px solid ${T.red}`,background:T.redLight,color:T.red,fontSize:11,fontWeight:700,cursor:"pointer"}}>전체 결석</button>
            </div>
          </div>

          {studentList.length===0
            ? <div style={{padding:32,textAlign:"center",color:T.textDim,fontSize:12}}>등록된 학생이 없어요</div>
            : studentList.map(s=>{
                const cur = todayData[s.name];
                return (
                  <div key={s.name} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
                    <div style={{fontSize:22,flexShrink:0}}>{s.avatar||"🧑"}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:800,color:T.text}}>{s.name}</div>
                      <div style={{fontSize:10,color:T.textMid}}>{s.grade||""}</div>
                    </div>
                    <div style={{display:"flex",gap:5}}>
                      {Object.entries(STATUS).map(([k,v])=>(
                        <button key={k} onClick={()=>mark(s.name,k)} style={{
                          padding:"5px 8px",borderRadius:8,border:`1.5px solid ${cur===k?v.color:T.border}`,
                          background:cur===k?v.bg:T.card,color:cur===k?v.color:T.textMid,
                          fontSize:11,fontWeight:800,cursor:"pointer",transition:"all 0.15s"
                        }}>{v.emoji}</button>
                      ))}
                    </div>
                  </div>
                );
              })
          }

          {/* 요약 */}
          {studentList.length>0&&(
            <div style={{display:"flex",gap:10,marginTop:12,padding:"10px 14px",background:T.bg,borderRadius:12}}>
              {Object.entries(STATUS).map(([k,v])=>{
                const cnt=Object.values(todayData).filter(s=>s===k).length;
                return <div key={k} style={{flex:1,textAlign:"center"}}>
                  <div style={{fontSize:16,fontWeight:900,color:v.color}}>{cnt}</div>
                  <div style={{fontSize:10,color:T.textMid,fontWeight:700}}>{v.label}</div>
                </div>;
              })}
              <div style={{flex:1,textAlign:"center"}}>
                <div style={{fontSize:16,fontWeight:900,color:T.textMid}}>{studentList.length-Object.values(todayData).length}</div>
                <div style={{fontSize:10,color:T.textMid,fontWeight:700}}>미처리</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 기록 탭 */}
      {view==="history"&&(
        <div>
          {Object.keys(attendance).length===0
            ? <div style={{padding:32,textAlign:"center",color:T.textDim,fontSize:12}}>출석 기록이 없어요</div>
            : Object.keys(attendance).sort().reverse().slice(0,20).map(date=>{
                const dayData=attendance[date];
                const p=Object.values(dayData).filter(s=>s==="present").length;
                const a=Object.values(dayData).filter(s=>s==="absent").length;
                const l=Object.values(dayData).filter(s=>s==="late").length;
                return (
                  <div key={date} style={{padding:"10px 0",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:12}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:800,color:T.text}}>{date}</div>
                      <div style={{fontSize:11,color:T.textMid,marginTop:2}}>
                        ✅{p}명 ❌{a}명 ⏰{l}명
                      </div>
                    </div>
                    <div style={{fontSize:14,fontWeight:900,color:T.green}}>
                      {p+a+l>0?Math.round(p/(p+a+l)*100):0}%
                    </div>
                  </div>
                );
              })
          }
        </div>
      )}

      {/* 통계 탭 */}
      {view==="stats"&&(
        <div>
          {studentList.length===0
            ? <div style={{padding:32,textAlign:"center",color:T.textDim,fontSize:12}}>학생이 없어요</div>
            : studentList.map(s=>{
                const st=getStats(s.name);
                return (
                  <div key={s.name} style={{background:T.card,borderRadius:12,padding:12,marginBottom:10,border:`1px solid ${T.border}`}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                      <div style={{fontSize:22}}>{s.avatar||"🧑"}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:800,color:T.text}}>{s.name}</div>
                        <div style={{fontSize:10,color:T.textMid}}>{st.total}회 수업 중</div>
                      </div>
                      <div style={{fontSize:18,fontWeight:900,color:st.rate>=90?T.green:st.rate>=70?T.yellow:T.red}}>{st.rate}%</div>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      {[
                        {label:"출석",val:st.present,c:T.green,bg:T.greenLight},
                        {label:"지각",val:st.late,c:T.yellow,bg:T.yellowLight},
                        {label:"결석",val:st.absent,c:T.red,bg:T.redLight},
                      ].map((m,i)=>(
                        <div key={i} style={{flex:1,textAlign:"center",background:m.bg,borderRadius:8,padding:"6px 4px"}}>
                          <div style={{fontSize:15,fontWeight:900,color:m.c}}>{m.val}</div>
                          <div style={{fontSize:10,color:T.textMid,fontWeight:700}}>{m.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
          }
        </div>
      )}
    </div>
  );
}
