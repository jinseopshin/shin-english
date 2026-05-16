"use client";
import { useState, useMemo, useEffect } from "react";

// ── THEME ─────────────────────────────────────────────────────────────────
const T = {
  bg: "#f0f4ff",
  card: "#ffffff",
  border: "#dce3f5",
  borderDark: "#b8c5e8",
  accent: "#3b6ef8",
  accentLight: "#e8eeff",
  accentDark: "#1e4ad4",
  green: "#16a34a",
  greenLight: "#dcfce7",
  red: "#dc2626",
  redLight: "#fee2e2",
  yellow: "#d97706",
  yellowLight: "#fef3c7",
  purple: "#7c3aed",
  purpleLight: "#ede9fe",
  text: "#1e2640",
  textMid: "#5a6482",
  textDim: "#9ba3bf",
  white: "#ffffff",
  shadow: "0 2px 12px rgba(59,110,248,0.10)",
};

const GRADES = ["초등3","초등4","초등5","초등6","중1","중2","중3"];
const TAGS   = ["be동사","일반동사","조동사","시제","의문문","부정문","어휘","기타"];
const MARKS  = ["①","②","③","④","⑤"];
let _uid = Date.now();
const uid = () => (++_uid).toString(36);

// ── INITIAL DATA ──────────────────────────────────────────────────────────
const INIT_BANK = {
  bp: {
    id:"bp", title:"Be동사 현재시제", grade:"초등5", tag:"be동사",
    questions:[
      {id:1,q:"I ______ a student.",opts:["am","is","are","was","were"],ans:1,exp:"I → am"},
      {id:2,q:"She ______ my best friend.",opts:["am","are","is","was","were"],ans:3,exp:"3인칭 단수 → is"},
      {id:3,q:"They ______ soccer players.",opts:["am","is","are","was","were"],ans:3,exp:"복수 주어 → are"},
      {id:4,q:"We ______ in the same class.",opts:["am","is","are","was","were"],ans:3,exp:"We → are"},
      {id:5,q:"He ______ a kind teacher.",opts:["am","are","is","was","were"],ans:3,exp:"He → is"},
      {id:6,q:"You ______ very smart.",opts:["am","is","are","was","were"],ans:3,exp:"You → are"},
      {id:7,q:"It ______ a beautiful day.",opts:["am","are","is","was","were"],ans:3,exp:"It → is"},
      {id:8,q:"______ you a new student?",opts:["Am","Is","Are","Was","Were"],ans:3,exp:"You 의문문 → Are"},
      {id:9,q:"A: Is this your pen? B: Yes, ______.",opts:["it is","it are","it am","they are","I am"],ans:1,exp:"Yes, it is."},
      {id:10,q:"I ______ not tired today.",opts:["am","is","are","was","were"],ans:1,exp:"I am not"},
      {id:11,q:"She ______ not at school today.",opts:["am","is","are","was","were"],ans:2,exp:"She is not"},
      {id:12,q:"다음 중 올바른 문장은?",opts:["I is happy.","She are tall.","We am students.","He is a doctor.","They is kind."],ans:4,exp:"He is a doctor."},
      {id:13,q:"______ she at home now?",opts:["Am","Are","Is","Was","Were"],ans:3,exp:"She → Is"},
      {id:14,q:"The dog ______ very cute.",opts:["am","are","is","were","be"],ans:3,exp:"단수 → is"},
      {id:15,q:"My parents ______ very busy.",opts:["am","is","are","was","be"],ans:3,exp:"복수 → are"},
    ]
  },
  bpa: {
    id:"bpa", title:"Be동사 과거시제", grade:"초등6", tag:"be동사",
    questions:[
      {id:1,q:"I ______ very happy yesterday.",opts:["am","is","are","was","were"],ans:4,exp:"I 과거 → was"},
      {id:2,q:"She ______ sick last week.",opts:["am","is","are","was","were"],ans:4,exp:"She 과거 → was"},
      {id:3,q:"They ______ at the park yesterday.",opts:["am","is","are","was","were"],ans:5,exp:"They 과거 → were"},
      {id:4,q:"We ______ in Seoul last summer.",opts:["am","is","are","was","were"],ans:5,exp:"We 과거 → were"},
      {id:5,q:"______ you at home last night?",opts:["Am","Is","Are","Was","Were"],ans:5,exp:"You 과거 의문 → Were"},
      {id:6,q:"A: Were you nervous? B: Yes, ______.",opts:["I was","I were","I am","I is","I be"],ans:1,exp:"Yes, I was."},
      {id:7,q:"She ______ not at home last night.",opts:["am","is","are","was","were"],ans:4,exp:"She was not"},
      {id:8,q:"was not 의 줄임말은?",opts:["wasn't","weren't","isn't","aren't","don't"],ans:1,exp:"wasn't"},
      {id:9,q:"I was a child. 부정문은?",opts:["I not was a child.","I was not a child.","I did not a child.","I was not not.","I am not a child."],ans:2,exp:"I was not a child."},
      {id:10,q:"다음 중 틀린 문장은?",opts:["He was a pilot.","I was hungry.","She were at home.","They were busy.","We were late."],ans:3,exp:"She were → She was"},
    ]
  },
  vp: {
    id:"vp", title:"일반동사 현재시제", grade:"중1", tag:"일반동사",
    questions:[
      {id:1,q:"I ______ English every day.",opts:["study","studies","studied","am study","does study"],ans:1,exp:"I + 동사원형 → study"},
      {id:2,q:"She ______ to school by bus.",opts:["go","goes","went","is go","do go"],ans:2,exp:"3인칭단수 → goes"},
      {id:3,q:"They ______ soccer after school.",opts:["plays","play","played","is play","does play"],ans:2,exp:"복수 → play"},
      {id:4,q:"______ you like pizza?",opts:["Does","Do","Is","Are","Did"],ans:2,exp:"Do you~?"},
      {id:5,q:"______ she speak Chinese?",opts:["Do","Did","Are","Does","Is"],ans:4,exp:"3인칭단수 의문 → Does"},
      {id:6,q:"He ______ not like spicy food.",opts:["do","did","am","does","is"],ans:4,exp:"He 부정 → does not"},
      {id:7,q:"동사 have의 3인칭단수 현재형은?",opts:["haves","havs","has","does have","having"],ans:3,exp:"have → has (불규칙)"},
      {id:8,q:"동사 study의 3인칭단수 현재형은?",opts:["studys","studies","studiez","study","do study"],ans:2,exp:"자음+y → ies"},
      {id:9,q:"Does your brother play guitar? Yes, ______.",opts:["he does","he do","he plays","he is","he did"],ans:1,exp:"Yes, he does."},
      {id:10,q:"다음 중 틀린 문장은?",opts:["She likes cats.","He goes to school.","They plays soccer.","We eat dinner.","It rains a lot here."],ans:3,exp:"They plays → They play"},
    ]
  },
  vpa: {
    id:"vpa", title:"일반동사 과거시제", grade:"중1", tag:"일반동사",
    questions:[
      {id:1,q:"I ______ pizza for lunch yesterday.",opts:["eat","eats","ate","am eat","do eat"],ans:3,exp:"eat → ate"},
      {id:2,q:"She ______ to school by bus last week.",opts:["go","goes","went","goed","going"],ans:3,exp:"go → went"},
      {id:3,q:"______ you see the game last night?",opts:["Does","Do","Are","Did","Was"],ans:4,exp:"과거의문 → Did"},
      {id:4,q:"I ______ not go to school yesterday.",opts:["does","do","am","did","was"],ans:4,exp:"과거부정 → did not"},
      {id:5,q:"A: Did you sleep well? Yes, ______.",opts:["I did","I does","I do","I was","I slept"],ans:1,exp:"Yes, I did."},
      {id:6,q:"He ______ his key yesterday. (잃다)",opts:["lose","loses","lost","losed","did lose"],ans:3,exp:"lose → lost"},
      {id:7,q:"buy의 과거형은?",opts:["buyed","buys","boughted","bought","buying"],ans:4,exp:"buy → bought (불규칙)"},
      {id:8,q:"다음 중 틀린 과거문장은?",opts:["She walked to school.","He ate breakfast.","They went to the park.","I buyed a book.","We saw a movie."],ans:4,exp:"buy → bought"},
      {id:9,q:"Did she call you? No, ______.",opts:["she didn't","she don't","she doesn't","she wasn't","she couldn't"],ans:1,exp:"No, she didn't."},
      {id:10,q:"다음 중 규칙변화 과거형은?",opts:["go → went","see → saw","come → came","walk → walked","eat → ate"],ans:4,exp:"walk → walked (규칙)"},
    ]
  },
};

// ── COMPONENTS ────────────────────────────────────────────────────────────
function Btn({children,onClick,v="default",size="md",disabled,full,style={}}) {
  const base={fontFamily:"inherit",cursor:disabled?"not-allowed":"pointer",border:"none",borderRadius:10,fontWeight:700,transition:"all .15s",opacity:disabled?.45:1,outline:"none",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:5,width:full?"100%":undefined,...style};
  const vs={
    default:{background:T.card,color:T.text,border:`1.5px solid ${T.border}`,boxShadow:T.shadow},
    primary:{background:T.accent,color:"#fff"},
    success:{background:T.green,color:"#fff"},
    danger:{background:T.red,color:"#fff"},
    ghost:{background:"transparent",color:T.textMid,border:`1.5px solid ${T.border}`},
    soft:{background:T.accentLight,color:T.accent,border:`1.5px solid ${T.border}`},
    warning:{background:T.yellow,color:"#fff"},
  };
  const ss={sm:{fontSize:12,padding:"6px 12px"},md:{fontSize:13,padding:"9px 18px"},lg:{fontSize:15,padding:"13px 26px"}};
  return <button onClick={disabled?undefined:onClick} style={{...base,...vs[v],...ss[size]}}>{children}</button>;
}

function Tag({children,color="blue"}) {
  const m={blue:[T.accentLight,T.accent],green:[T.greenLight,T.green],yellow:[T.yellowLight,T.yellow],purple:[T.purpleLight,T.purple],red:[T.redLight,T.red]};
  const [bg,fg]=m[color]||m.blue;
  return <span style={{background:bg,color:fg,fontSize:10,fontWeight:800,padding:"3px 9px",borderRadius:20,letterSpacing:.4,whiteSpace:"nowrap",border:`1px solid ${fg}22`}}>{children}</span>;
}

function Field({label,children,hint}) {
  return (
    <div style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:5}}>
        <div style={{fontSize:12,fontWeight:700,color:T.textMid,letterSpacing:.3}}>{label}</div>
        {hint&&<div style={{fontSize:11,color:T.textDim}}>{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function Inp({value,onChange,placeholder,multi,style={}}) {
  const s={background:T.card,border:`1.5px solid ${T.border}`,color:T.text,borderRadius:10,padding:"10px 13px",fontSize:13,width:"100%",outline:"none",resize:"vertical",transition:"border-color .15s",...style};
  const focus={borderColor:T.accent};
  return multi
    ?<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{...s,minHeight:72}} onFocus={e=>Object.assign(e.target.style,focus)} onBlur={e=>e.target.style.borderColor=T.border}/>
    :<input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={s} onFocus={e=>Object.assign(e.target.style,focus)} onBlur={e=>e.target.style.borderColor=T.border}/>;
}

function Sel({value,onChange,options,style={}}) {
  return (
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{background:T.card,border:`1.5px solid ${T.border}`,color:T.text,borderRadius:10,padding:"10px 13px",fontSize:13,outline:"none",width:"100%",...style}}>
      {options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
    </select>
  );
}

function Card({children,style={},onClick}) {
  return <div onClick={onClick} style={{background:T.card,border:`1.5px solid ${T.border}`,borderRadius:16,padding:18,boxShadow:T.shadow,...style}}>{children}</div>;
}

function Modal({open,onClose,title,children,width=560}) {
  if(!open) return null;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:9999,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:0}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:T.card,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:640,maxHeight:"90vh",overflow:"auto",boxShadow:"0 -8px 40px rgba(0,0,0,.18)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 20px",borderBottom:`1px solid ${T.border}`,position:"sticky",top:0,background:T.card,zIndex:1}}>
          <div style={{fontWeight:800,fontSize:16,color:T.text}}>{title}</div>
          <button onClick={onClose} style={{background:T.border,border:"none",color:T.textMid,fontSize:16,cursor:"pointer",width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <div style={{padding:20}}>{children}</div>
      </div>
    </div>
  );
}

function EmptyState({icon,title,sub,action,onAction}) {
  return (
    <div style={{textAlign:"center",padding:"48px 24px",background:T.card,borderRadius:16,border:`1.5px dashed ${T.borderDark}`}}>
      <div style={{fontSize:44,marginBottom:10}}>{icon}</div>
      <div style={{fontSize:15,fontWeight:800,color:T.text,marginBottom:5}}>{title}</div>
      <div style={{fontSize:12,color:T.textMid,marginBottom:18,lineHeight:1.6}}>{sub}</div>
      {action&&<Btn v="primary" onClick={onAction}>{action}</Btn>}
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────
function Dashboard({bank,exams,onNav}) {
  const totalQ=Object.values(bank).reduce((s,b)=>s+b.questions.length,0);
  const h=new Date().getHours();
  const greet=h<6?"안녕히 주무셨나요 🌙":h<12?"좋은 아침이에요 🌅":h<18?"좋은 오후예요 ☀️":"좋은 저녁이에요 🌆";

  return (
    <div>
      {/* Hero card */}
      <div style={{background:`linear-gradient(135deg,${T.accent} 0%,#6a8fff 100%)`,borderRadius:20,padding:"22px 20px 20px",marginBottom:20,color:"#fff",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-30,right:-20,width:120,height:120,background:"rgba(255,255,255,.07)",borderRadius:"50%"}}/>
        <div style={{position:"absolute",bottom:-40,right:10,width:80,height:80,background:"rgba(255,255,255,.05)",borderRadius:"50%"}}/>
        <div style={{fontSize:13,opacity:.85,marginBottom:3}}>{greet}</div>
        <div style={{fontSize:24,fontWeight:900,marginBottom:1}}>신경은 선생님 👋</div>
        <div style={{fontSize:12,opacity:.75,marginBottom:18}}>오늘도 멋진 수업 준비 함께해요!</div>
        <div style={{display:"flex",gap:20}}>
          {[{n:Object.keys(bank).length,l:"문제 세트",icon:"📚"},{n:totalQ,l:"총 문항",icon:"✏️"},{n:exams.length,l:"시험지",icon:"📄"}].map(s=>(
            <div key={s.l} style={{textAlign:"center"}}>
              <div style={{fontSize:11,opacity:.7,marginBottom:2}}>{s.icon} {s.l}</div>
              <div style={{fontSize:28,fontWeight:900,lineHeight:1}}>{s.n}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{marginBottom:20}}>
        <div style={{fontSize:11,fontWeight:800,color:T.textDim,marginBottom:10,letterSpacing:.8,textTransform:"uppercase"}}>빠른 실행</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[
            {icon:"📝",label:"시험지 출제",sub:"문제 선택 후 즉시 출력",screen:"exam-builder",c:T.accent},
            {icon:"➕",label:"문항 추가",sub:"문제 은행에 새 문항",screen:"bank",c:T.green},
            {icon:"🖨️",label:"출력 목록",sub:"저장된 시험지 관리",screen:"exams",c:T.purple},
            {icon:"📚",label:"문제 은행",sub:"세트 및 문항 관리",screen:"bank",c:T.yellow},
          ].map(a=>(
            <div key={a.label} onClick={()=>onNav(a.screen)}
              style={{background:T.card,border:`1.5px solid ${T.border}`,borderRadius:16,padding:"16px 14px",cursor:"pointer",boxShadow:T.shadow,transition:"all .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=a.c;e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 24px rgba(59,110,248,.16)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=T.shadow;}}>
              <div style={{fontSize:28,marginBottom:7}}>{a.icon}</div>
              <div style={{fontSize:13,fontWeight:800,color:T.text,marginBottom:2}}>{a.label}</div>
              <div style={{fontSize:11,color:T.textMid}}>{a.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent exams */}
      <div style={{fontSize:11,fontWeight:800,color:T.textDim,marginBottom:10,letterSpacing:.8,textTransform:"uppercase"}}>최근 시험지</div>
      {exams.length===0
        ?<EmptyState icon="📝" title="아직 시험지가 없어요" sub={"출제 버튼을 눌러\n첫 시험지를 만들어보세요!"} action="시험지 출제하기" onAction={()=>onNav("exam-builder")}/>
        :exams.slice(-4).reverse().map(e=>(
          <div key={e.id} onClick={()=>onNav("exam-view",e.id)}
            style={{background:T.card,border:`1.5px solid ${T.border}`,borderRadius:14,padding:"13px 16px",marginBottom:8,cursor:"pointer",boxShadow:T.shadow,display:"flex",alignItems:"center",gap:12,transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;}}>
            <div style={{width:42,height:42,background:T.accentLight,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>📄</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.title}</div>
              <div style={{fontSize:11,color:T.textMid,marginTop:2}}>{e.questions.length}문항 · {e.grade} · {e.createdAt}</div>
            </div>
            <div style={{color:T.textDim,fontSize:20}}>›</div>
          </div>
        ))}
    </div>
  );
}

// ── QUESTION BANK ─────────────────────────────────────────────────────────
function QuestionBank({bank,setBank}) {
  const [sel,setSel]=useState(null);
  const [showNewSet,setShowNewSet]=useState(false);
  const [showNewQ,setShowNewQ]=useState(false);
  const [editQ,setEditQ]=useState(null);
  const [nset,setNset]=useState({title:"",grade:"중1",tag:"be동사"});
  const [nq,setNq]=useState({q:"",opts:["","","","",""],ans:1,exp:""});
  const [search,setSearch]=useState("");

  const cur=sel?bank[sel]:null;

  function createSet(){
    if(!nset.title.trim()) return;
    const id=uid();
    setBank(b=>({...b,[id]:{id,title:nset.title,grade:nset.grade,tag:nset.tag,questions:[]}}));
    setSel(id);setShowNewSet(false);setNset({title:"",grade:"중1",tag:"be동사"});
  }

  function delSet(id){
    if(!confirm("이 세트를 삭제할까요?")) return;
    setBank(b=>{const n={...b};delete n[id];return n;});
    if(sel===id) setSel(null);
  }

  function addQ(){
    if(!nq.q.trim()||nq.opts.some(o=>!o.trim())) return;
    const maxId=Math.max(0,...cur.questions.map(q=>q.id));
    setBank(b=>({...b,[sel]:{...b[sel],questions:[...b[sel].questions,{...nq,opts:[...nq.opts],id:maxId+1}]}}));
    setNq({q:"",opts:["","","","",""],ans:1,exp:""});setShowNewQ(false);
  }

  function saveEdit(){
    setBank(b=>({...b,[sel]:{...b[sel],questions:b[sel].questions.map(q=>q.id===editQ.id?editQ:q)}}));
    setEditQ(null);
  }

  function delQ(qid){
    setBank(b=>({...b,[sel]:{...b[sel],questions:b[sel].questions.filter(q=>q.id!==qid)}}));
  }

  const sets=Object.values(bank).filter(s=>s.title.includes(search)||s.grade.includes(search)||s.tag.includes(search));

  // Set list
  if(!sel) return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <div style={{fontSize:18,fontWeight:900,color:T.text}}>📚 문제 은행</div>
        <Btn v="primary" onClick={()=>setShowNewSet(true)}>+ 새 세트</Btn>
      </div>
      <Inp value={search} onChange={setSearch} placeholder="세트 검색..." style={{marginBottom:14}}/>
      {sets.length===0
        ?<EmptyState icon="📚" title="문제 세트가 없어요" sub="새 세트를 만들어 문항을 추가하세요." action="새 세트 만들기" onAction={()=>setShowNewSet(true)}/>
        :sets.map(s=>(
          <Card key={s.id} style={{marginBottom:10,cursor:"pointer"}}
            onClick={()=>setSel(s.id)}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,fontSize:14,color:T.text,marginBottom:7}}>{s.title}</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  <Tag color="blue">{s.grade}</Tag><Tag color="purple">{s.tag}</Tag><Tag color="green">{s.questions.length}문항</Tag>
                </div>
              </div>
              <button onClick={e=>{e.stopPropagation();delSet(s.id);}}
                style={{background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:18,padding:"0 4px",lineHeight:1}}>🗑</button>
            </div>
          </Card>
        ))}

      <Modal open={showNewSet} onClose={()=>setShowNewSet(false)} title="새 문제 세트 만들기">
        <Field label="세트 제목 *"><Inp value={nset.title} onChange={v=>setNset(s=>({...s,title:v}))} placeholder="예: Be동사 현재시제 연습"/></Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Field label="학년"><Sel value={nset.grade} onChange={v=>setNset(s=>({...s,grade:v}))} options={GRADES}/></Field>
          <Field label="태그"><Sel value={nset.tag} onChange={v=>setNset(s=>({...s,tag:v}))} options={TAGS}/></Field>
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}>
          <Btn v="ghost" onClick={()=>setShowNewSet(false)}>취소</Btn>
          <Btn v="primary" onClick={createSet}>만들기</Btn>
        </div>
      </Modal>
    </div>
  );

  // Question list
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <button onClick={()=>setSel(null)} style={{background:"none",border:"none",color:T.accent,cursor:"pointer",fontSize:13,fontWeight:700,padding:0}}>← 목록</button>
        <div style={{flex:1,fontWeight:900,fontSize:16,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cur.title}</div>
        <Btn v="primary" size="sm" onClick={()=>setShowNewQ(true)}>+ 추가</Btn>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        <Tag color="blue">{cur.grade}</Tag><Tag color="purple">{cur.tag}</Tag><Tag color="green">{cur.questions.length}문항</Tag>
      </div>

      {cur.questions.length===0
        ?<EmptyState icon="✏️" title="문항이 없어요" sub="문항 추가 버튼을 눌러 문제를 만드세요." action="문항 추가" onAction={()=>setShowNewQ(true)}/>
        :cur.questions.map((q,i)=>(
          <Card key={q.id} style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontSize:11,fontWeight:800,color:T.accent,background:T.accentLight,padding:"2px 8px",borderRadius:6,fontFamily:"monospace"}}>Q{String(i+1).padStart(2,"0")}</span>
              <div style={{display:"flex",gap:6}}>
                <Btn v="ghost" size="sm" onClick={()=>setEditQ({...q,opts:[...q.opts]})}>편집</Btn>
                <Btn v="danger" size="sm" onClick={()=>delQ(q.id)}>삭제</Btn>
              </div>
            </div>
            <div style={{fontSize:14,color:T.text,marginBottom:9,lineHeight:1.65}}>{q.q}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px 16px"}}>
              {q.opts.map((o,j)=>(
                <div key={j} style={{fontSize:12,color:j+1===q.ans?T.green:T.textMid,display:"flex",gap:5,alignItems:"center",lineHeight:1.6}}>
                  <span style={{fontWeight:800,flexShrink:0}}>{MARKS[j]}</span>
                  <span>{o}</span>
                  {j+1===q.ans&&<span style={{fontSize:10,color:T.green}}>✓</span>}
                </div>
              ))}
            </div>
            {q.exp&&<div style={{marginTop:8,fontSize:11,color:T.yellow,borderTop:`1px solid ${T.border}`,paddingTop:7}}>💡 {q.exp}</div>}
          </Card>
        ))}

      {/* Add Modal */}
      <Modal open={showNewQ} onClose={()=>setShowNewQ(false)} title="새 문항 추가" width={600}>
        <Field label="문제" hint="빈칸 → ______"><Inp value={nq.q} onChange={v=>setNq(q=>({...q,q:v}))} placeholder="예: She ______ my best friend." multi/></Field>
        <Field label="보기 5개 (정답 클릭)">
          {nq.opts.map((o,i)=>(
            <div key={i} style={{display:"flex",gap:8,alignItems:"center",marginBottom:7}}>
              <span style={{fontSize:14,fontWeight:800,color:i+1===nq.ans?T.green:T.textDim,width:22,flexShrink:0}}>{MARKS[i]}</span>
              <Inp value={o} onChange={v=>setNq(q=>{const opts=[...q.opts];opts[i]=v;return{...q,opts};})} placeholder={`보기 ${i+1}`} style={{flex:1}}/>
              <button onClick={()=>setNq(q=>({...q,ans:i+1}))}
                style={{background:i+1===nq.ans?T.green:"transparent",border:`1.5px solid ${i+1===nq.ans?T.green:T.border}`,color:i+1===nq.ans?"#fff":T.textMid,borderRadius:8,padding:"7px 12px",cursor:"pointer",fontSize:11,fontWeight:800,whiteSpace:"nowrap",flexShrink:0}}>
                {i+1===nq.ans?"✓ 정답":"정답"}
              </button>
            </div>
          ))}
        </Field>
        <Field label="해설 (선택)"><Inp value={nq.exp} onChange={v=>setNq(q=>({...q,exp:v}))} placeholder="예: 3인칭 단수 → is"/></Field>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <Btn v="ghost" onClick={()=>setShowNewQ(false)}>취소</Btn>
          <Btn v="primary" onClick={addQ}>추가</Btn>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editQ} onClose={()=>setEditQ(null)} title="문항 편집" width={600}>
        {editQ&&(
          <>
            <Field label="문제"><Inp value={editQ.q} onChange={v=>setEditQ(q=>({...q,q:v}))} placeholder="문제 입력" multi/></Field>
            <Field label="보기">
              {editQ.opts.map((o,i)=>(
                <div key={i} style={{display:"flex",gap:8,alignItems:"center",marginBottom:7}}>
                  <span style={{fontSize:14,fontWeight:800,color:i+1===editQ.ans?T.green:T.textDim,width:22}}>{MARKS[i]}</span>
                  <Inp value={o} onChange={v=>setEditQ(q=>{const opts=[...q.opts];opts[i]=v;return{...q,opts};})} style={{flex:1}}/>
                  <button onClick={()=>setEditQ(q=>({...q,ans:i+1}))}
                    style={{background:i+1===editQ.ans?T.green:"transparent",border:`1.5px solid ${i+1===editQ.ans?T.green:T.border}`,color:i+1===editQ.ans?"#fff":T.textMid,borderRadius:8,padding:"7px 12px",cursor:"pointer",fontSize:11,fontWeight:800,whiteSpace:"nowrap"}}>
                    {i+1===editQ.ans?"✓ 정답":"정답"}
                  </button>
                </div>
              ))}
            </Field>
            <Field label="해설"><Inp value={editQ.exp} onChange={v=>setEditQ(q=>({...q,exp:v}))}/></Field>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <Btn v="ghost" onClick={()=>setEditQ(null)}>취소</Btn>
              <Btn v="success" onClick={saveEdit}>저장</Btn>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

// ── EXAM BUILDER ──────────────────────────────────────────────────────────
function ExamBuilder({bank,setExams,onNav}) {
  const [step,setStep]=useState(1);
  const [meta,setMeta]=useState({title:"",school:"",grade:"중1",teacher:"신경은",date:"",timeLimit:"30",totalScore:"100",note:"",showAns:true,showExp:true,twoCol:false});
  const [selSets,setSelSets]=useState([]);
  const [selQs,setSelQs]=useState([]);
  const [shuffle,setShuffle]=useState(false);

  const allQs=selSets.flatMap(sid=>(bank[sid]?.questions||[]).map(q=>({...q,setId:sid,setTitle:bank[sid]?.title})));

  function go(){
    let qs=allQs.filter(q=>selQs.includes(`${q.setId}-${q.id}`));
    if(shuffle) qs=[...qs].sort(()=>Math.random()-.5);
    const exam={id:uid(),...meta,questions:qs,createdAt:new Date().toLocaleDateString("ko-KR")};
    setExams(e=>[...e,exam]);
    onNav("exam-view",exam.id);
  }

  return (
    <div>
      <div style={{fontSize:18,fontWeight:900,color:T.text,marginBottom:20}}>📝 시험지 출제</div>
      {/* Step bar */}
      <div style={{background:T.card,borderRadius:14,padding:4,marginBottom:20,display:"flex",border:`1.5px solid ${T.border}`,boxShadow:T.shadow}}>
        {["① 기본 정보","② 문항 선택"].map((s,i)=>(
          <div key={i} onClick={()=>i===0&&setStep(1)}
            style={{flex:1,textAlign:"center",padding:"9px 4px",borderRadius:10,fontSize:12,fontWeight:800,cursor:i===0?"pointer":"default",background:step===i+1?T.accent:"transparent",color:step===i+1?"#fff":T.textMid,transition:"all .15s"}}>
            {s}
          </div>
        ))}
      </div>

      {step===1&&(
        <div>
          <Card style={{marginBottom:14}}>
            <div style={{fontWeight:800,color:T.text,marginBottom:14,fontSize:14}}>시험지 정보</div>
            <Field label="시험지 제목 *"><Inp value={meta.title} onChange={v=>setMeta(m=>({...m,title:v}))} placeholder="예: 1학기 중간고사 - Be동사"/></Field>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Field label="학교명"><Inp value={meta.school} onChange={v=>setMeta(m=>({...m,school:v}))} placeholder="OO중학교"/></Field>
              <Field label="담당 교사"><Inp value={meta.teacher} onChange={v=>setMeta(m=>({...m,teacher:v}))} placeholder="신경은"/></Field>
              <Field label="학년"><Sel value={meta.grade} onChange={v=>setMeta(m=>({...m,grade:v}))} options={GRADES}/></Field>
              <Field label="시험일"><Inp value={meta.date} onChange={v=>setMeta(m=>({...m,date:v}))} placeholder="2024. 5. 15"/></Field>
              <Field label="제한시간(분)"><Inp value={meta.timeLimit} onChange={v=>setMeta(m=>({...m,timeLimit:v}))} placeholder="30"/></Field>
              <Field label="총점"><Inp value={meta.totalScore} onChange={v=>setMeta(m=>({...m,totalScore:v}))} placeholder="100"/></Field>
            </div>
            <Field label="유의사항 (선택)"><Inp value={meta.note} onChange={v=>setMeta(m=>({...m,note:v}))} placeholder="예: 모든 답은 OMR 카드에 기입하세요." multi style={{minHeight:56}}/></Field>
            <div style={{display:"flex",flexWrap:"wrap",gap:16,marginTop:4}}>
              {[{k:"showAns",l:"✅ 답안표"},{k:"showExp",l:"💡 해설"},{k:"twoCol",l:"📰 2단 편집"}].map(o=>(
                <label key={o.k} style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",fontSize:13,color:T.textMid}}>
                  <input type="checkbox" checked={meta[o.k]} onChange={e=>setMeta(m=>({...m,[o.k]:e.target.checked}))} style={{width:16,height:16,accentColor:T.accent}}/>
                  {o.l}
                </label>
              ))}
            </div>
          </Card>
          <Btn v="primary" full onClick={()=>setStep(2)} disabled={!meta.title.trim()}>다음: 문항 선택 →</Btn>
          {!meta.title.trim()&&<div style={{fontSize:11,color:T.red,textAlign:"center",marginTop:6}}>시험지 제목을 입력해주세요</div>}
        </div>
      )}

      {step===2&&(
        <div>
          <Card style={{marginBottom:14}}>
            <div style={{fontWeight:800,color:T.text,marginBottom:12,fontSize:13}}>① 문제 세트 선택</div>
            {Object.values(bank).length===0
              ?<div style={{textAlign:"center",color:T.textDim,padding:20,fontSize:12}}>문제 은행에 세트를 먼저 추가해주세요.</div>
              :Object.values(bank).map(s=>(
                <div key={s.id} onClick={()=>setSelSets(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p,s.id])}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"11px 0",borderBottom:`1px solid ${T.border}`,cursor:"pointer"}}>
                  <div style={{width:22,height:22,borderRadius:6,border:`2px solid ${selSets.includes(s.id)?T.accent:T.border}`,background:selSets.includes(s.id)?T.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}}>
                    {selSets.includes(s.id)&&<span style={{color:"#fff",fontSize:14,fontWeight:900}}>✓</span>}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:T.text}}>{s.title}</div>
                    <div style={{display:"flex",gap:5,marginTop:3}}><Tag color="blue">{s.grade}</Tag><Tag color="green">{s.questions.length}문항</Tag></div>
                  </div>
                </div>
              ))}
          </Card>

          {selSets.length>0&&(
            <Card style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontWeight:800,color:T.text,fontSize:13}}>② 문항 선택 <span style={{color:T.accent}}>({selQs.length}/{allQs.length})</span></div>
                <Btn v="ghost" size="sm" onClick={()=>setSelQs(selQs.length===allQs.length?[]:allQs.map(q=>`${q.setId}-${q.id}`))}>
                  {selQs.length===allQs.length?"전체 해제":"전체 선택"}
                </Btn>
              </div>
              {allQs.map(q=>{
                const key=`${q.setId}-${q.id}`;
                return (
                  <div key={key} onClick={()=>setSelQs(p=>p.includes(key)?p.filter(x=>x!==key):[...p,key])}
                    style={{display:"flex",gap:10,padding:"10px 0",borderBottom:`1px solid ${T.border}`,cursor:"pointer",alignItems:"flex-start"}}>
                    <div style={{width:20,height:20,borderRadius:5,border:`2px solid ${selQs.includes(key)?T.green:T.border}`,background:selQs.includes(key)?T.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,transition:"all .15s"}}>
                      {selQs.includes(key)&&<span style={{color:"#fff",fontSize:12,fontWeight:900}}>✓</span>}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,color:T.textMid,marginBottom:1}}>{q.setTitle}</div>
                      <div style={{fontSize:13,color:T.text,lineHeight:1.5}}>{q.q}</div>
                    </div>
                  </div>
                );
              })}
              <label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",fontSize:13,color:T.textMid,marginTop:12}}>
                <input type="checkbox" checked={shuffle} onChange={e=>setShuffle(e.target.checked)} style={{width:16,height:16,accentColor:T.accent}}/>
                문항 순서 랜덤 섞기
              </label>
            </Card>
          )}

          <div style={{display:"flex",gap:8}}>
            <Btn v="ghost" onClick={()=>setStep(1)}>← 이전</Btn>
            <Btn v="primary" full disabled={selQs.length===0} onClick={go}>
              🖨️ 시험지 생성 ({selQs.length}문항)
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ── EXAM PRINT VIEW ───────────────────────────────────────────────────────
function ExamPrintView({exam,onBack}) {
  const qs=exam.questions||[];
  const perQ=qs.length>0?Math.floor(parseInt(exam.totalScore||100)/qs.length):0;
  const [mode,setMode]=useState("print"); // print | student
  const [ans,setAns]=useState({});
  const [graded,setGraded]=useState(false);

  const score=useMemo(()=>{
    if(!graded) return null;
    const c=qs.filter((q,i)=>ans[i]===q.ans).length;
    return {c,total:qs.length,pct:Math.round(c/qs.length*100)};
  },[graded,ans,qs]);

  if(mode==="student") return (
    <div>
      <div className="no-print" style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        <Btn v="ghost" onClick={()=>{setMode("print");setAns({});setGraded(false);}}>← 출력 보기</Btn>
        {graded
          ?<Btn v="ghost" onClick={()=>{setAns({});setGraded(false);}}>🔄 다시 풀기</Btn>
          :<Btn v="primary" disabled={Object.keys(ans).length<qs.length} onClick={()=>setGraded(true)}>
            채점하기 ({Object.keys(ans).length}/{qs.length})
          </Btn>}
      </div>
      {graded&&score&&(
        <div className="no-print" style={{background:`linear-gradient(135deg,${T.accent},#6a8fff)`,borderRadius:16,padding:"20px 16px",marginBottom:20,color:"#fff",textAlign:"center"}}>
          <div style={{fontSize:52,fontWeight:900}}>{score.pct}점</div>
          <div style={{fontSize:14,opacity:.85}}>{score.c}/{score.total}개 정답</div>
        </div>
      )}
      {qs.map((q,i)=>{
        const ua=ans[i],ok=graded&&ua===q.ans,bad=graded&&ua&&ua!==q.ans;
        return (
          <div key={i} style={{background:T.card,border:`1.5px solid ${ok?T.green:bad?T.red:T.border}`,borderRadius:14,padding:"14px 16px",marginBottom:12,boxShadow:T.shadow}}>
            <div style={{display:"grid",gridTemplateColumns:"28px 1fr",gap:6,marginBottom:10}}>
              <span style={{fontWeight:800,fontSize:14,color:T.accent,fontFamily:"monospace"}}>{String(i+1).padStart(2,"0")}</span>
              <span style={{fontSize:14,lineHeight:1.7,color:T.text}}>{q.q}</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 16px"}}>
              {q.opts.map((o,j)=>{
                const v=j+1,isSel=ua===v,isAns=q.ans===v;
                return (
                  <div key={j} onClick={()=>!graded&&setAns(a=>({...a,[i]:v}))}
                    style={{display:"flex",gap:5,padding:"7px 9px",borderRadius:8,fontSize:13,lineHeight:1.6,cursor:graded?"default":"pointer",transition:"all .15s",alignItems:"baseline",
                      background:graded?(isAns?T.greenLight:isSel?T.redLight:"transparent"):(isSel?T.accentLight:"transparent"),
                      border:`1px solid ${graded?(isAns?T.green:isSel?T.red:T.border):(isSel?T.accent:T.border)}`}}>
                    <span style={{fontWeight:800,flexShrink:0,color:graded?(isAns?T.green:isSel?T.red:T.textDim):(isSel?T.accent:T.textDim)}}>{MARKS[j]}</span>
                    <span style={{color:T.text}}>{o}</span>
                  </div>
                );
              })}
            </div>
            {graded&&bad&&q.exp&&<div style={{marginTop:8,fontSize:12,color:T.yellow,padding:"6px 10px",background:T.yellowLight,borderRadius:8}}>💡 {MARKS[q.ans-1]} {q.exp}</div>}
          </div>
        );
      })}
    </div>
  );

  return (
    <div>
      {/* Action bar */}
      <div className="no-print" style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
        <Btn v="ghost" onClick={onBack}>← 목록</Btn>
        <Btn v="soft" onClick={()=>setMode("student")}>✏️ 학생 풀기</Btn>
        <Btn v="primary" onClick={()=>window.print()}>🖨️ 인쇄 / PDF</Btn>
      </div>
      <div className="no-print" style={{fontSize:11,color:T.textMid,marginBottom:14,padding:"9px 13px",background:T.accentLight,borderRadius:10,lineHeight:1.6}}>
        💡 <b>인쇄 팁:</b> 인쇄 버튼 클릭 → 프린터 선택 또는 <b>PDF로 저장</b> 선택. 배율은 <b>맞춤/100%</b>로 설정하세요.
      </div>

      {/* Print sheet */}
      <div id="print-area" style={{background:"white",borderRadius:16,boxShadow:"0 4px 32px rgba(59,110,248,.13)",border:`1.5px solid ${T.border}`,padding:"28px 24px",fontFamily:"'Malgun Gothic','나눔고딕',serif"}}>
        {/* Header */}
        <div style={{textAlign:"center",borderBottom:"3px double #222",paddingBottom:14,marginBottom:18}}>
          {exam.school&&<div style={{fontSize:13,color:"#444",marginBottom:2}}>{exam.school}</div>}
          <div style={{fontSize:24,fontWeight:900,letterSpacing:1,color:"#111",margin:"5px 0"}}>{exam.title}</div>
          <div style={{display:"flex",justifyContent:"center",gap:24,fontSize:12,color:"#555",flexWrap:"wrap",marginTop:6}}>
            {exam.grade&&<span>대상: <b>{exam.grade}</b></span>}
            {exam.timeLimit&&<span>제한 시간: <b>{exam.timeLimit}분</b></span>}
            {exam.totalScore&&<span>총점: <b>{exam.totalScore}점</b></span>}
            {exam.date&&<span>날짜: <b>{exam.date}</b></span>}
            {exam.teacher&&<span>출제: <b>{exam.teacher}</b></span>}
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:20,marginTop:12,paddingTop:10,borderTop:"1px solid #e0e0e0",fontSize:12}}>
            <span>이름: ___________________</span>
            <span>학번: __________</span>
            <span>점수: __________</span>
          </div>
        </div>

        {/* Info bar */}
        <div style={{background:"#f5f7ff",borderLeft:"4px solid #3b6ef8",padding:"8px 14px",marginBottom:20,fontSize:12,display:"flex",gap:20,flexWrap:"wrap",borderRadius:"0 6px 6px 0"}}>
          <span>● 총 <b>{qs.length}문항</b></span>
          <span>● 각 <b>{perQ}점</b></span>
          <span>● 각 문제의 ①~⑤ 중 하나를 선택하세요.</span>
          {exam.note&&<span>● {exam.note}</span>}
        </div>

        {/* Questions */}
        <div style={exam.twoCol?{columns:2,columnGap:32}:{}}>
          {qs.map((q,i)=>(
            <div key={i} style={{breakInside:"avoid",pageBreakInside:"avoid",marginBottom:18,paddingBottom:14,borderBottom:"1px dashed #e0e6f5"}}>
              <div style={{display:"flex",gap:8,marginBottom:9,alignItems:"flex-start"}}>
                <span style={{fontWeight:900,fontSize:15,color:"#1a4fcc",minWidth:28,flexShrink:0,lineHeight:1.5}}>{i+1}.</span>
                <span style={{fontSize:14,lineHeight:1.8,color:"#111",flex:1}}>{q.q}</span>
                <span style={{fontSize:11,color:"#aaa",flexShrink:0,marginTop:3}}>({perQ}점)</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 20px",paddingLeft:36}}>
                {q.opts.map((o,j)=>(
                  <div key={j} style={{fontSize:13,display:"flex",gap:6,lineHeight:1.7,color:"#222",alignItems:"baseline"}}>
                    <span style={{fontWeight:700,flexShrink:0}}>{MARKS[j]}</span><span>{o}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Answer table */}
        {exam.showAns&&qs.length>0&&(
          <div style={{marginTop:24,borderTop:"2px solid #222",paddingTop:18}}>
            <div style={{fontWeight:900,fontSize:14,marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
              <span style={{background:"#222",color:"#fff",padding:"2px 10px",borderRadius:4,fontSize:12}}>■ 정 답 표</span>
            </div>
            {/* Rows of 10 */}
            {Array.from({length:Math.ceil(qs.length/10)},(_,row)=>(
              <div key={row} style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(10,qs.length-row*10)},1fr)`,gap:5,marginBottom:6}}>
                {qs.slice(row*10,(row+1)*10).map((q,j)=>(
                  <div key={j} style={{border:"1px solid #ccc",borderRadius:6,padding:"6px 3px",textAlign:"center",background:(row*10+j)%2===0?"#f9faff":"#fff"}}>
                    <div style={{fontSize:10,color:"#777",marginBottom:1}}>{row*10+j+1}</div>
                    <div style={{fontSize:16,fontWeight:900,color:"#1a4fcc"}}>{MARKS[q.ans-1]}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Explanations */}
        {exam.showExp&&qs.some(q=>q.exp)&&(
          <div style={{marginTop:20,borderTop:"1px solid #ccc",paddingTop:16}}>
            <div style={{fontWeight:900,fontSize:13,marginBottom:10}}>■ 문제 해설</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px 28px"}}>
              {qs.map((q,i)=>q.exp&&(
                <div key={i} style={{fontSize:11,display:"flex",gap:6,paddingBottom:5,borderBottom:"1px solid #eee",alignItems:"baseline"}}>
                  <span style={{fontWeight:900,color:"#1a4fcc",flexShrink:0,minWidth:22}}>{i+1}.</span>
                  <span style={{fontWeight:700,color:"#16a34a",flexShrink:0}}>{MARKS[q.ans-1]}</span>
                  <span style={{color:"#333"}}>{q.exp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{marginTop:20,borderTop:"1px solid #e0e0e0",paddingTop:8,display:"flex",justifyContent:"space-between",fontSize:10,color:"#bbb"}}>
          <span>{exam.school||""} {exam.grade||""} 영어</span>
          <span>{exam.teacher&&`출제: ${exam.teacher}`}</span>
          <span>생성일: {exam.createdAt}</span>
        </div>
      </div>
    </div>
  );
}

// ── EXAM LIST ─────────────────────────────────────────────────────────────
function ExamList({exams,setExams,onNav}) {
  function del(id){if(confirm("이 시험지를 삭제할까요?"))setExams(e=>e.filter(x=>x.id!==id));}
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <div style={{fontSize:18,fontWeight:900,color:T.text}}>🖨️ 시험지 목록</div>
        <Btn v="primary" onClick={()=>onNav("exam-builder")}>+ 새 출제</Btn>
      </div>
      {exams.length===0
        ?<EmptyState icon="🖨️" title="시험지가 없어요" sub="출제 화면에서 새 시험지를 만들어보세요." action="시험지 출제하기" onAction={()=>onNav("exam-builder")}/>
        :exams.slice().reverse().map(e=>(
          <div key={e.id} style={{background:T.card,border:`1.5px solid ${T.border}`,borderRadius:16,padding:"15px 16px",marginBottom:10,boxShadow:T.shadow}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
              <div onClick={()=>onNav("exam-view",e.id)} style={{flex:1,cursor:"pointer"}}>
                <div style={{fontWeight:800,fontSize:14,color:T.text,marginBottom:6}}>{e.title}</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  <Tag color="blue">{e.grade}</Tag>
                  <Tag color="green">{e.questions.length}문항</Tag>
                  {e.timeLimit&&<Tag color="yellow">{e.timeLimit}분</Tag>}
                  <Tag color="purple">{e.createdAt}</Tag>
                </div>
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0,flexWrap:"wrap",justifyContent:"flex-end"}}>
                <Btn v="primary" size="sm" onClick={()=>onNav("exam-view",e.id)}>🖨️ 출력</Btn>
                <Btn v="danger" size="sm" onClick={()=>del(e.id)}>삭제</Btn>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen,setScreen]=useState("dashboard");
  const [arg,setArg]=useState(null);
  const [bank,setBank]=useState(()=>{
    if(typeof window==="undefined") return INIT_BANK;
    try { const s=localStorage.getItem("shin_bank"); return s?JSON.parse(s):INIT_BANK; } catch { return INIT_BANK; }
  });
  const [exams,setExams]=useState(()=>{
    if(typeof window==="undefined") return [];
    try { const s=localStorage.getItem("shin_exams"); return s?JSON.parse(s):[]; } catch { return []; }
  });

  // Persist to localStorage
  useEffect(()=>{ try{localStorage.setItem("shin_bank",JSON.stringify(bank));}catch{} },[bank]);
  useEffect(()=>{ try{localStorage.setItem("shin_exams",JSON.stringify(exams));}catch{} },[exams]);

  function onNav(s,a=null){setScreen(s);setArg(a);if(typeof window!=="undefined")window.scrollTo(0,0);}

  const examView=arg?exams.find(e=>e.id===arg):null;

  const NAV=[
    {id:"dashboard",icon:"🏠",label:"홈"},
    {id:"bank",icon:"📚",label:"문제 은행"},
    {id:"exam-builder",icon:"📝",label:"출제"},
    {id:"exams",icon:"🖨️",label:"시험지"},
  ];

  return (
    <div style={{background:T.bg,minHeight:"100vh",color:T.text}}>
      {/* Top bar */}
      <div className="topbar" style={{background:T.card,borderBottom:`1px solid ${T.border}`,padding:"10px 16px",display:"flex",alignItems:"center",gap:10,position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 8px rgba(59,110,248,.07)"}}>
        <div style={{width:36,height:36,background:T.accent,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>📖</div>
        <div style={{flex:1}}>
          <div style={{fontSize:15,fontWeight:900,color:T.text,lineHeight:1.1}}>영어 문제 플랫폼</div>
          <div style={{fontSize:10,color:T.textDim}}>신경은 선생님 전용 · 데이터 자동 저장</div>
        </div>
        {(screen==="exam-view"&&examView)&&(
          <Btn v="primary" size="sm" onClick={()=>window.print()}>🖨️ 인쇄</Btn>
        )}
      </div>

      {/* Content */}
      <div style={{maxWidth:700,margin:"0 auto",padding:"16px 12px 100px"}}>
        {screen==="dashboard"&&<Dashboard bank={bank} exams={exams} onNav={onNav}/>}
        {screen==="bank"&&<QuestionBank bank={bank} setBank={setBank}/>}
        {screen==="exam-builder"&&<ExamBuilder bank={bank} setExams={setExams} onNav={onNav}/>}
        {screen==="exams"&&<ExamList exams={exams} setExams={setExams} onNav={onNav}/>}
        {screen==="exam-view"&&(examView
          ?<ExamPrintView exam={examView} onBack={()=>onNav("exams")}/>
          :<EmptyState icon="❓" title="시험지를 찾을 수 없어요" sub="" action="목록으로" onAction={()=>onNav("exams")}/>
        )}
      </div>

      {/* Bottom nav */}
      <div className="bottomnav" style={{position:"fixed",bottom:0,left:0,right:0,background:T.card,borderTop:`1px solid ${T.border}`,display:"flex",zIndex:100,boxShadow:"0 -2px 16px rgba(59,110,248,.08)"}}>
        {NAV.map(n=>(
          <button key={n.id} onClick={()=>onNav(n.id)}
            style={{flex:1,background:"none",border:"none",padding:"10px 4px 16px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <div style={{fontSize:22,transition:"transform .15s",transform:screen===n.id?"scale(1.2)":"scale(1)"}}>{n.icon}</div>
            <div style={{fontSize:10,fontWeight:800,color:screen===n.id?T.accent:T.textDim}}>{n.label}</div>
            {screen===n.id&&<div style={{width:20,height:3,borderRadius:2,background:T.accent}}/>}
          </button>
        ))}
      </div>
    </div>
  );
}
