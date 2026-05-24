"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { T, Btn, Card } from "./theme";
import {
  ALPHABET_DATA, CVC_DATA, MAGIC_E_DATA, BLENDS_DATA, SIGHT_WORDS,
  PHONICS_LEVELS, getPhonicsWords, getFirstLetter, makeCVCBlank, makeAlphabetChoices,
  getStudentAssignedSets, getPublicSets, getCustomSet
} from "./phonicsData";
import {
  onCorrect, onWrong, onFinish, playClick, isSoundEnabled
} from "./soundEffects";
import { useAngela, getComboReaction, getFinishReaction, FullScreenConfetti } from "./AngelaMascot";
import { PhonicsClassMode } from "./PhonicsClassMode";
import { getCuratedImageUrl, hasCuratedImage, preloadImages } from "./phonicsImages";
import { getLetterStrokes, GUIDE_LINES } from "./letterStrokes";
import { getSoundHint } from "./soundHints";
import { recordReview, getDueItems, getNewItems, getReviewStats } from "./reviewSystem";

// ══════════════════════════════════════════════════════════════════════════
//   🔤 PhonicsGames.js v2.0 — 유치부 파닉스 게임 5종
//   게임 로직 100% 유지, 디자인만 새 시스템 적용
// ══════════════════════════════════════════════════════════════════════════

// ── 헬퍼: TTS로 영어 발음 재생 ──
function speakEN(text, rate = 0.85) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  if (!isSoundEnabled()) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = rate;
    utter.pitch = 1.0;
    window.speechSynthesis.speak(utter);
  } catch {}
}

function speakLetter(letter) { speakEN(letter, 0.7); }
function speakWord(word) { speakEN(word, 0.85); }

function getStars(score, total) {
  const ratio = total > 0 ? score / total : 0;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.7) return 2;
  if (ratio >= 0.5) return 1;
  return 0;
}

function saveProgress(studentName, gameId, levelId, score, total) {
  if (typeof window === "undefined" || !studentName) return;
  try {
    const key = `phonics_progress_${studentName}`;
    const stored = JSON.parse(window.localStorage.getItem(key) || "{}");
    const recordKey = `${levelId}_${gameId}`;
    const prev = stored[recordKey] || { bestStars: 0, plays: 0 };
    const stars = getStars(score, total);
    stored[recordKey] = {
      bestStars: Math.max(prev.bestStars, stars),
      lastScore: score,
      lastTotal: total,
      plays: prev.plays + 1,
      lastPlayed: new Date().toISOString(),
    };
    window.localStorage.setItem(key, JSON.stringify(stored));
  } catch {}
}

function getProgress(studentName) {
  if (typeof window === "undefined" || !studentName) return {};
  try {
    return JSON.parse(window.localStorage.getItem(`phonics_progress_${studentName}`) || "{}");
  } catch {
    return {};
  }
}

function shuffle(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ── 공통: 둥근 뒤로가기 버튼 ──
function BackBtn({ onClick, label = "← 뒤로" }) {
  return (
    <button onClick={onClick} style={{
      background: T.bgSoft, border: "none", borderRadius: T.radiusSm,
      padding: "9px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", color: T.textMid,
      transition: "all 0.15s"
    }}>{label}</button>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//   📋 메인 메뉴
// ══════════════════════════════════════════════════════════════════════════
export function PhonicsMenu({ studentName, onExit }) {
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedCustomSet, setSelectedCustomSet] = useState(null);
  const progress = useMemo(() => getProgress(studentName), [studentName]);
  const myAssignedSets = useMemo(() => getStudentAssignedSets(studentName), [studentName]);
  const publicSets = useMemo(() => {
    const assignedIds = new Set(myAssignedSets.map(s => s.id));
    return getPublicSets().filter(s => !assignedIds.has(s.id));
  }, [myAssignedSets]);

  if (selectedCustomSet) {
    return (
      <CustomSetMenu
        studentName={studentName}
        customSet={selectedCustomSet}
        onBack={() => setSelectedCustomSet(null)}
        onExit={onExit}
      />
    );
  }

  if (selectedLevel) {
    return (
      <PhonicsGameMenu
        studentName={studentName}
        levelId={selectedLevel}
        onBack={() => setSelectedLevel(null)}
        onExit={onExit}
      />
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <BackBtn onClick={onExit} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: T.text }}>🔤 파닉스 학습</div>
          <div style={{ fontSize: 11, color: T.textMid, marginTop: 2 }}>알파벳부터 차근차근 배워봐요!</div>
        </div>
      </div>

      {/* 선생님이 내준 단어집 */}
      {myAssignedSets.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 13, fontWeight: 900, color: T.text,
            marginBottom: 10, display: "flex", alignItems: "center", gap: 6
          }}>
            <span style={{ fontSize: 16 }}>⭐</span>
            선생님이 내준 단어집
            <span style={{
              fontSize: 10, background: T.accent, color: "white",
              padding: "2px 9px", borderRadius: T.radiusFull, marginLeft: 4, fontWeight: 900
            }}>{myAssignedSets.length}</span>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {myAssignedSets.map(set => {
              const level = PHONICS_LEVELS.find(l => l.id === set.levelId);
              return (
                <div key={set.id} onClick={() => { playClick(); setSelectedCustomSet(set); }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = T.shadowLg; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = T.shadow; }}
                  style={{
                    padding: 14, cursor: "pointer", borderRadius: T.radiusLg,
                    background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`,
                    color: "white", border: "none", boxShadow: T.shadow,
                    display: "flex", alignItems: "center", gap: 12, transition: "all 0.2s"
                  }}>
                  <div style={{
                    width: 48, height: 48, background: "rgba(255,255,255,0.25)",
                    borderRadius: T.radius, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 24
                  }}>{level?.icon || "📚"}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 900 }}>{set.name}</div>
                    <div style={{ fontSize: 10, opacity: 0.95, marginTop: 2 }}>
                      {level?.label} · {set.words?.length || 0}개 단어
                    </div>
                  </div>
                  <div style={{ fontSize: 22, opacity: 0.8 }}>›</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 공개 단어집 */}
      {publicSets.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 13, fontWeight: 900, color: T.text,
            marginBottom: 10, display: "flex", alignItems: "center", gap: 6
          }}>
            <span style={{ fontSize: 16 }}>🌐</span>
            누구나 풀 수 있는 단어집
            <span style={{
              fontSize: 10, background: T.green, color: "white",
              padding: "2px 9px", borderRadius: T.radiusFull, marginLeft: 4, fontWeight: 900
            }}>{publicSets.length}</span>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {publicSets.map(set => {
              const level = PHONICS_LEVELS.find(l => l.id === set.levelId);
              return (
                <Card key={set.id} onClick={() => { playClick(); setSelectedCustomSet(set); }}
                  style={{
                    padding: 14, cursor: "pointer",
                    border: `2px solid ${level?.color || T.green}`,
                    display: "flex", alignItems: "center", gap: 12
                  }}>
                  <div style={{
                    width: 48, height: 48, background: level?.bg || T.bgSoft,
                    borderRadius: T.radius, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 24
                  }}>{level?.icon || "📚"}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: T.text }}>{set.name}</div>
                    <div style={{ fontSize: 10, color: T.textMid, marginTop: 2 }}>
                      {level?.label} · {set.words?.length || 0}개 단어
                    </div>
                  </div>
                  <div style={{ fontSize: 22, color: T.textDim }}>›</div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* 📚 기본 단계 */}
      <div style={{
        fontSize: 13, fontWeight: 900, color: T.text,
        marginBottom: 10, display: "flex", alignItems: "center", gap: 6
      }}>
        <span style={{ fontSize: 16 }}>📚</span>
        기본 단계
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {PHONICS_LEVELS.map((lv, idx) => {
          const stars = Math.max(
            ...["alphabet-sound", "first-sound", "cvc-blank", "picture-letter", "build-word"]
              .map(g => (progress[`${lv.id}_${g}`]?.bestStars || 0))
          );
          return (
            <div key={lv.id} onClick={() => { playClick(); setSelectedLevel(lv.id); }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = T.shadowLg; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = T.shadow; }}
              style={{
                padding: 16, borderRadius: T.radiusLg,
                background: T.card,
                border: `2px solid ${T.border}`,
                borderLeft: `5px solid ${lv.color}`,
                cursor: "pointer", boxShadow: T.shadow, transition: "all 0.2s",
                display: "flex", alignItems: "center", gap: 14
              }}>
              <div style={{
                width: 56, height: 56, background: lv.bg, borderRadius: T.radius,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32
              }}>{lv.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 9, color: "white", fontWeight: 800,
                    background: lv.color, padding: "2px 7px", borderRadius: T.radiusFull
                  }}>STEP {idx+1}</span>
                  <span style={{ fontSize: 15, fontWeight: 900, color: T.text }}>{lv.label}</span>
                </div>
                <div style={{ fontSize: 10, color: T.textMid, marginBottom: 6 }}>{lv.desc}</div>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  {[1, 2, 3].map(i => (
                    <span key={i} style={{ fontSize: 13, opacity: stars >= i ? 1 : 0.25 }}>⭐</span>
                  ))}
                  <span style={{ fontSize: 10, color: T.textDim, marginLeft: 4 }}>
                    · {lv.count}개 단어
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 22, color: T.textDim }}>›</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//   📦 커스텀 단어집 메뉴
// ══════════════════════════════════════════════════════════════════════════
function CustomSetMenu({ studentName, customSet, onBack, onExit }) {
  const [mode, setMode] = useState(null);
  const level = PHONICS_LEVELS.find(l => l.id === customSet.levelId);

  if (mode === "class") {
    return (
      <PhonicsClassMode
        words={customSet.words}
        title={customSet.name}
        levelId={customSet.levelId}
        onExit={() => setMode(null)}
      />
    );
  }

  if (mode) {
    return (
      <CustomSetGameRunner
        studentName={studentName}
        customSet={customSet}
        gameId={mode}
        onBack={() => setMode(null)}
        onExit={onExit}
      />
    );
  }

  const availableGames = [
    { id: "class", icon: "📖", label: "수업 모드", desc: "선생님과 같이 보며 천천히 익혀요", featured: true },
    { id: "first-sound", icon: "🎵", label: "첫소리 맞추기", desc: "단어 듣고 첫글자 고르기" },
    { id: "picture-letter", icon: "🖼️", label: "그림 보고 첫글자", desc: "그림 보고 알파벳 고르기" },
    { id: "build-word", icon: "🧩", label: "단어 만들기", desc: "소리 듣고 순서대로 클릭" },
  ];

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <BackBtn onClick={onBack} />
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: T.text }}>
            {level?.icon} {customSet.name}
          </div>
          <div style={{ fontSize: 11, color: T.textMid, marginTop: 2 }}>
            {level?.label} · {customSet.words?.length || 0}개 단어
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {availableGames.map(g => (
          <div key={g.id} onClick={() => { playClick(); setMode(g.id); }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = T.shadowLg; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = T.shadow; }}
            style={{
              padding: 16, display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
              borderRadius: T.radiusLg, boxShadow: T.shadow, transition: "all 0.2s",
              background: g.featured
                ? `linear-gradient(135deg, ${T.green}, ${T.teal})`
                : T.card,
              color: g.featured ? "white" : T.text,
              border: g.featured ? "none" : `2px solid ${T.border}`,
            }}>
            <div style={{
              width: 52, height: 52,
              background: g.featured ? "rgba(255,255,255,0.25)" : (level?.bg || T.bgSoft),
              borderRadius: T.radius,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26
            }}>{g.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800 }}>{g.label}</div>
              <div style={{
                fontSize: 10,
                color: g.featured ? "rgba(255,255,255,0.95)" : T.textMid,
                marginTop: 2
              }}>{g.desc}</div>
            </div>
            <div style={{ fontSize: 20, opacity: g.featured ? 0.85 : 0.5 }}>›</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomSetGameRunner({ studentName, customSet, gameId, onBack, onExit }) {
  const customWords = customSet.words;
  const levelId = customSet.levelId || "cvc";
  const props = { studentName, levelId, gameId: `custom_${customSet.id}_${gameId}`, onBack, onExit, customWords };

  switch (gameId) {
    case "first-sound":     return <FirstSoundGame {...props} />;
    case "picture-letter":  return <PictureLetterGame {...props} />;
    case "build-word":      return <BuildWordGame {...props} />;
    default:
      return (
        <div style={{ padding: 20, textAlign: "center" }}>
          <div style={{ fontSize: 14, color: T.red, marginBottom: 12 }}>지원하지 않는 게임</div>
          <BackBtn onClick={onBack} />
        </div>
      );
  }
}

function PhonicsGameMenu({ studentName, levelId, onBack, onExit }) {
  const [selectedGame, setSelectedGame] = useState(null);
  const [showClassMode, setShowClassMode] = useState(false);
  const level = PHONICS_LEVELS.find(l => l.id === levelId);
  const progress = useMemo(() => getProgress(studentName), [studentName, selectedGame]);

  const games = useMemo(() => {
    const all = [
      { id: "alphabet-sound",  icon: "🔊", label: "알파벳 소리 듣기",   desc: "글자 보고 소리 따라하기", levels: ["alphabet"] },
      { id: "first-sound",     icon: "🎵", label: "첫소리 맞추기",       desc: "단어 듣고 첫글자 고르기", levels: ["alphabet", "cvc", "blends"] },
      { id: "cvc-blank",       icon: "🔤", label: "CVC 빈칸 채우기",     desc: "c_t 보고 가운데 모음 고르기", levels: ["cvc"] },
      { id: "picture-letter",  icon: "🖼️", label: "그림 보고 첫글자",   desc: "그림 보고 알파벳 고르기", levels: ["alphabet", "cvc", "blends", "sight"] },
      { id: "build-word",      icon: "🧩", label: "단어 만들기",        desc: "소리 듣고 순서대로 클릭", levels: ["cvc", "magic-e", "blends"] },
      { id: "letter-write",    icon: "✍️", label: "글자 따라쓰기",      desc: "획순 따라 손가락으로 쓰기", levels: ["alphabet", "cvc", "magic-e", "blends", "sight"] },
      { id: "review",          icon: "🔁", label: "오늘의 복습",        desc: "복습할 때가 된 글자 다시 쓰기", levels: ["alphabet", "cvc", "magic-e", "blends", "sight"] },
      { id: "board",           icon: "🎲", label: "단어 보드게임",      desc: "주사위 굴리며 단어 읽기", levels: ["cvc", "magic-e", "blends", "sight"] },
      { id: "bingo",           icon: "🎱", label: "단어 빙고",          desc: "듣고 단어 찾아 한 줄 완성", levels: ["cvc", "magic-e", "blends", "sight"] },
      { id: "domino",          icon: "🁢", label: "끝소리 잇기",        desc: "끝 글자로 시작하는 단어 잇기", levels: ["cvc", "magic-e", "blends", "sight"] },
    ];
    return all.filter(g => g.levels.includes(levelId));
  }, [levelId]);

  const classWords = useMemo(() => getPhonicsWords(levelId), [levelId]);

  if (showClassMode) {
    return (
      <PhonicsClassMode
        words={classWords}
        title={level?.label}
        levelId={levelId}
        onExit={() => setShowClassMode(false)}
      />
    );
  }

  if (selectedGame) {
    return (
      <PhonicsGameRunner
        studentName={studentName}
        levelId={levelId}
        gameId={selectedGame}
        onBack={() => setSelectedGame(null)}
        onExit={onExit}
      />
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <BackBtn onClick={onBack} />
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: T.text }}>
            {level?.icon} {level?.label}
          </div>
          <div style={{ fontSize: 11, color: T.textMid, marginTop: 2 }}>{level?.desc}</div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {/* 수업 모드 (featured) */}
        <div onClick={() => { playClick(); setShowClassMode(true); }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = T.shadowLg; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = T.shadow; }}
          style={{
            padding: 16, display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
            borderRadius: T.radiusLg, boxShadow: T.shadow, transition: "all 0.2s",
            background: `linear-gradient(135deg, ${T.green}, ${T.teal})`,
            color: "white", border: "none"
          }}>
          <div style={{
            width: 52, height: 52, background: "rgba(255,255,255,0.25)",
            borderRadius: T.radius,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26
          }}>📖</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 900 }}>수업 모드</div>
            <div style={{ fontSize: 10, opacity: 0.95, marginTop: 2 }}>
              선생님과 같이 보며 천천히 익혀요
            </div>
          </div>
          <div style={{ fontSize: 20, opacity: 0.85 }}>›</div>
        </div>

        {games.map(g => {
          const rec = progress[`${levelId}_${g.id}`];
          const stars = rec?.bestStars || 0;
          return (
            <Card key={g.id} onClick={() => { playClick(); setSelectedGame(g.id); }}
              style={{
                padding: 16, display: "flex", alignItems: "center", gap: 12, cursor: "pointer"
              }}>
              <div style={{
                width: 52, height: 52, background: level?.bg, borderRadius: T.radius,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26
              }}>{g.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{g.label}</div>
                <div style={{ fontSize: 10, color: T.textMid, marginTop: 2 }}>{g.desc}</div>
                <div style={{ display: "flex", gap: 2, marginTop: 6, alignItems: "center" }}>
                  {[1, 2, 3].map(i => (
                    <span key={i} style={{ fontSize: 12, opacity: stars >= i ? 1 : 0.25 }}>⭐</span>
                  ))}
                  {rec?.plays > 0 && (
                    <span style={{ fontSize: 9, color: T.textDim, marginLeft: 6 }}>
                      · {rec.plays}회 도전
                    </span>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 20, color: T.textDim }}>›</div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function PhonicsGameRunner({ studentName, levelId, gameId, onBack, onExit }) {
  const props = { studentName, levelId, gameId, onBack, onExit };
  switch (gameId) {
    case "alphabet-sound":  return <AlphabetSoundGame {...props} />;
    case "first-sound":     return <FirstSoundGame {...props} />;
    case "cvc-blank":       return <CVCBlankGame {...props} />;
    case "picture-letter":  return <PictureLetterGame {...props} />;
    case "build-word":      return <BuildWordGame {...props} />;
    case "letter-write":    return <LetterWriteGame {...props} />;
    case "review":          return <ReviewGame {...props} />;
    case "board":           return <BoardGame {...props} />;
    case "bingo":           return <BingoGame {...props} />;
    case "domino":          return <DominoGame {...props} />;
    default: return <div>지원하지 않는 게임</div>;
  }
}

// ══════════════════════════════════════════════════════════════════════════
//   GAME 1: 🔊 알파벳 소리 듣기
// ══════════════════════════════════════════════════════════════════════════
function AlphabetSoundGame({ studentName, levelId, gameId, onBack, onExit }) {
  const [order] = useState(() => shuffle(ALPHABET_DATA));
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [imageError, setImageError] = useState(false);
  const angela = useAngela();
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  const current = order[idx];
  const imageUrl = useMemo(() => current ? getCuratedImageUrl(current.word) : null, [current]);
  const hint = useMemo(() => current ? getSoundHint(current.letter) : null, [current]);

  useEffect(() => { setImageError(false); }, [idx]);

  useEffect(() => {
    if (current) {
      const t = setTimeout(() => {
        speakLetter(current.letter);
        setTimeout(() => speakWord(current.word), 1000);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [idx]);

  const next = () => {
    playClick();
    if (idx < order.length - 1) {
      setIdx(i => i + 1);
    } else {
      setDone(true);
      saveProgress(studentName, gameId, levelId, order.length, order.length);
      setConfettiTrigger(t => t + 1);
      angela.show("perfect");
      onFinish(order.length, order.length);
    }
  };

  if (done) {
    return (
      <FinishScreen
        score={order.length} total={order.length}
        levelId={levelId} onBack={onBack} onExit={onExit}
      />
    );
  }

  if (!current) {
    return <EmptyPoolMessage onBack={onBack} />;
  }

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <FullScreenConfetti trigger={confettiTrigger} />
      <angela.AngelaComponent />
      <GameHeader
        onBack={onBack}
        title="🔊 알파벳 소리 듣기"
        progress={idx + 1}
        total={order.length}
      />

      <div style={{
        background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`,
        borderRadius: T.radiusXl, padding: "40px 24px", textAlign: "center",
        color: "white", marginBottom: 20, boxShadow: T.shadowLg
      }}>
        <div style={{
          fontSize: 140, fontWeight: 900, lineHeight: 1,
          marginBottom: 8, textShadow: "0 4px 12px rgba(0,0,0,0.2)"
        }}>
          {current.letter}<span style={{ opacity: 0.6, fontSize: 80 }}>{current.letter.toLowerCase()}</span>
        </div>
        <div style={{ fontSize: 18, opacity: 0.9, marginBottom: 16 }}>
          {current.sound}
        </div>

        {hint && (
          <div style={{
            background: "rgba(255,255,255,0.22)",
            borderRadius: T.radius, padding: "10px 14px", marginBottom: 16,
            maxWidth: 320, marginLeft: "auto", marginRight: "auto"
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 2, opacity: 0.95 }}>
              👄 이렇게 소리 내요
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.4, opacity: 0.95 }}>
              {hint.mouth}
            </div>
          </div>
        )}

        <div style={{
          width: 150, height: 150, margin: "0 auto 8px",
          borderRadius: T.radius, overflow: "hidden",
          background: "rgba(255,255,255,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          {imageUrl && !imageError ? (
            <img src={imageUrl} alt={current.word} loading="lazy"
              onError={() => setImageError(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ fontSize: 90, lineHeight: 1 }}>{current.emoji}</div>
          )}
        </div>
        <div style={{ fontSize: 24, fontWeight: 900 }}>{current.word}</div>
        <div style={{ fontSize: 14, opacity: 0.85, marginTop: 4 }}>{current.ko}</div>
      </div>

      <button onClick={() => { speakLetter(current.letter); setTimeout(() => speakWord(current.word), 1000); }}
        style={{
          width: "100%", padding: 14, background: T.card,
          border: `2px solid ${T.accent}`, borderRadius: T.radius, marginBottom: 12,
          fontSize: 14, fontWeight: 800, color: T.accent, cursor: "pointer"
        }}>
        🔊 다시 듣기
      </button>

      <button onClick={next} style={{
        width: "100%", padding: 18, background: T.green,
        color: "white", border: "none", borderRadius: T.radius,
        fontSize: 16, fontWeight: 900, cursor: "pointer",
        boxShadow: "0 4px 12px rgba(16,185,129,0.25)"
      }}>
        {idx < order.length - 1 ? "다음 →" : "끝내기 ✨"}
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//   GAME 2: 🎵 첫소리 맞추기
// ══════════════════════════════════════════════════════════════════════════
function FirstSoundGame({ studentName, levelId, gameId, onBack, onExit, customWords }) {
  const [rounds] = useState(() => {
    const all = customWords || getPhonicsWords(levelId);
    return shuffle(all).slice(0, Math.min(10, all.length));
  });
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [done, setDone] = useState(false);
  const [imageError, setImageError] = useState(false);
  const angela = useAngela();
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  const current = rounds[idx];
  const choices = useMemo(() => current ? makeAlphabetChoices(getFirstLetter(current.word)) : [], [current]);
  const imageUrl = useMemo(() => current ? getCuratedImageUrl(current.word) : null, [current]);

  useEffect(() => { setImageError(false); }, [idx]);

  useEffect(() => {
    if (current && !feedback) {
      const t = setTimeout(() => speakWord(current.word), 300);
      return () => clearTimeout(t);
    }
  }, [idx, feedback]);

  const handleChoice = (letter) => {
    if (feedback) return;
    const correct = letter === getFirstLetter(current.word);
    setFeedback(correct ? "correct" : "wrong");
    recordReview(studentName, getFirstLetter(current.word), correct);
    if (correct) {
      onCorrect();
      const newCombo = combo + 1;
      setCombo(newCombo);
      setScore(s => s + 1);
      if (newCombo >= 3) {
        setTimeout(() => angela.show(getComboReaction(newCombo)), 200);
      } else {
        setTimeout(() => angela.show("correct"), 200);
      }
    } else {
      onWrong();
      setCombo(0);
      setTimeout(() => angela.show("wrong"), 200);
    }
    setTimeout(() => {
      if (idx < rounds.length - 1) {
        setIdx(i => i + 1);
        setFeedback(null);
      } else {
        const final = score + (correct ? 1 : 0);
        setDone(true);
        saveProgress(studentName, gameId, levelId, final, rounds.length);
        onFinish(final, rounds.length);
        setTimeout(() => angela.show(getFinishReaction(final, rounds.length)), 500);
        if (final / rounds.length >= 0.8) setConfettiTrigger(t => t + 1);
      }
    }, 1200);
  };

  if (done) {
    return <FinishScreen score={score} total={rounds.length} levelId={levelId} onBack={onBack} onExit={onExit} />;
  }

  if (!current) {
    return <EmptyPoolMessage onBack={onBack} />;
  }

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <FullScreenConfetti trigger={confettiTrigger} />
      <angela.AngelaComponent />
      <GameHeader
        onBack={onBack}
        title="🎵 첫소리 맞추기"
        progress={idx + 1}
        total={rounds.length}
        score={score}
        combo={combo}
      />

      <div style={{
        background: T.card, borderRadius: T.radiusXl, padding: "30px 20px",
        textAlign: "center", marginBottom: 16, border: `2px solid ${T.border}`
      }}>
        <div style={{
          width: 160, height: 160, margin: "0 auto 8px",
          borderRadius: T.radius, overflow: "hidden",
          background: "rgba(255,255,255,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
        }}>
          {imageUrl && !imageError ? (
            <img src={imageUrl} alt={current.word} loading="lazy"
              onError={() => setImageError(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ fontSize: 100, lineHeight: 1 }}>{current.emoji}</div>
          )}
        </div>
        <button onClick={() => speakWord(current.word)}
          style={{
            background: T.accent, color: "white",
            border: "none", borderRadius: T.radius, padding: "12px 20px",
            fontSize: 16, fontWeight: 800, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 8
          }}>
          🔊 다시 듣기
        </button>
        <div style={{ fontSize: 12, color: T.textMid, marginTop: 12 }}>
          첫 글자는 무엇일까요?
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {choices.map(letter => {
          const correct = letter === getFirstLetter(current.word);
          const isAnswered = feedback !== null;
          let bg = T.card, color = T.text, border = T.border;
          if (isAnswered) {
            if (correct) { bg = T.green; color = "white"; border = T.green; }
          }
          return (
            <button key={letter} onClick={() => handleChoice(letter)}
              disabled={isAnswered}
              style={{
                background: bg, color, border: `3px solid ${border}`,
                borderRadius: T.radius, padding: "30px 0",
                fontSize: 56, fontWeight: 900,
                cursor: isAnswered ? "default" : "pointer",
                transition: "all 0.2s"
              }}>
              {letter}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//   GAME 3: 🔤 CVC 빈칸 채우기
// ══════════════════════════════════════════════════════════════════════════
function CVCBlankGame({ studentName, levelId, gameId, onBack, onExit }) {
  const [rounds] = useState(() => {
    const all = getPhonicsWords("cvc").filter(w => w.word.length === 3);
    return shuffle(all).slice(0, 10);
  });
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [done, setDone] = useState(false);
  const [imageError, setImageError] = useState(false);
  const angela = useAngela();
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  const current = rounds[idx];
  const parts = useMemo(() => current ? makeCVCBlank(current.word) : null, [current]);
  const imageUrl = useMemo(() => current ? getCuratedImageUrl(current.word) : null, [current]);

  const choices = useMemo(() => {
    if (!parts) return [];
    const vowels = ["a", "e", "i", "o", "u"];
    const wrongs = vowels.filter(v => v !== parts.missing);
    const picks = shuffle(wrongs).slice(0, 3);
    return shuffle([...picks, parts.missing]);
  }, [parts]);

  useEffect(() => {
    if (current && !feedback) {
      const t = setTimeout(() => speakWord(current.word), 300);
      return () => clearTimeout(t);
    }
  }, [idx, feedback]);

  useEffect(() => { setImageError(false); }, [idx]);

  const handleChoice = (vowel) => {
    if (feedback) return;
    const correct = vowel === parts.missing;
    setFeedback(correct ? "correct" : "wrong");
    if (correct) {
      onCorrect();
      const newCombo = combo + 1;
      setCombo(newCombo);
      setScore(s => s + 1);
      if (newCombo >= 3) {
        setTimeout(() => angela.show(getComboReaction(newCombo)), 200);
      } else {
        setTimeout(() => angela.show("correct"), 200);
      }
    } else {
      onWrong();
      setCombo(0);
      setTimeout(() => angela.show("wrong"), 200);
    }
    setTimeout(() => {
      if (idx < rounds.length - 1) {
        setIdx(i => i + 1);
        setFeedback(null);
      } else {
        const final = score + (correct ? 1 : 0);
        setDone(true);
        saveProgress(studentName, gameId, levelId, final, rounds.length);
        onFinish(final, rounds.length);
        setTimeout(() => angela.show(getFinishReaction(final, rounds.length)), 500);
        if (final / rounds.length >= 0.8) setConfettiTrigger(t => t + 1);
      }
    }, 1200);
  };

  if (done) {
    return <FinishScreen score={score} total={rounds.length} levelId={levelId} onBack={onBack} onExit={onExit} />;
  }

  if (!current) {
    return <EmptyPoolMessage onBack={onBack} />;
  }

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <FullScreenConfetti trigger={confettiTrigger} />
      <angela.AngelaComponent />
      <GameHeader
        onBack={onBack}
        title="🔤 빈칸 채우기"
        progress={idx + 1}
        total={rounds.length}
        score={score}
        combo={combo}
      />

      <div style={{
        background: T.card, borderRadius: T.radiusXl, padding: "30px 20px",
        textAlign: "center", marginBottom: 16, border: `2px solid ${T.border}`
      }}>
        <div style={{
          width: 140, height: 140, margin: "0 auto 12px",
          borderRadius: T.radius, overflow: "hidden",
          background: "rgba(255,255,255,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
        }}>
          {imageUrl && !imageError ? (
            <img src={imageUrl} alt={current.word} loading="lazy"
              onError={() => setImageError(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ fontSize: 80, lineHeight: 1 }}>{current.emoji}</div>
          )}
        </div>
        <div style={{ fontSize: 14, color: T.textMid, marginBottom: 4 }}>{current.ko}</div>

        <div style={{
          fontSize: 72, fontWeight: 900, fontFamily: "monospace",
          marginTop: 12, marginBottom: 16, color: T.text,
          letterSpacing: 8
        }}>
          {parts.prefix}
          <span style={{
            display: "inline-block", minWidth: 60,
            color: feedback === "correct" ? T.green : T.orange,
            background: feedback ? "transparent" : T.yellowLight,
            borderRadius: T.radiusSm, padding: "0 4px"
          }}>
            {feedback ? parts.missing : "_"}
          </span>
          {parts.suffix}
        </div>

        <button onClick={() => speakWord(current.word)}
          style={{
            background: T.accent, color: "white",
            border: "none", borderRadius: T.radiusSm, padding: "10px 16px",
            fontSize: 13, fontWeight: 700, cursor: "pointer"
          }}>
          🔊 소리 듣기
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {choices.map(vowel => {
          const correct = vowel === parts.missing;
          const isAnswered = feedback !== null;
          let bg = T.card, color = T.text, border = T.border;
          if (isAnswered && correct) { bg = T.green; color = "white"; border = T.green; }
          return (
            <button key={vowel} onClick={() => handleChoice(vowel)}
              disabled={isAnswered}
              style={{
                background: bg, color, border: `3px solid ${border}`,
                borderRadius: T.radius, padding: "26px 0",
                fontSize: 48, fontWeight: 900,
                cursor: isAnswered ? "default" : "pointer",
                transition: "all 0.2s"
              }}>
              {vowel}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//   GAME 4: 🖼️ 그림 보고 첫글자 (Cloudinary 큐레이션 이미지 + 힌트)
// ══════════════════════════════════════════════════════════════════════════
function PictureLetterGame({ studentName, levelId, gameId, onBack, onExit, customWords }) {
  const [rounds] = useState(() => {
    const source = customWords || getPhonicsWords(levelId);
    const withImages = customWords
      ? source
      : source.filter(w => hasCuratedImage(w.word));
    return shuffle(withImages).slice(0, Math.min(10, withImages.length));
  });
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [done, setDone] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [imageError, setImageError] = useState(false);
  const angela = useAngela();
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  const current = rounds[idx];

  useEffect(() => {
    if (!rounds || rounds.length === 0) return;
    if (idx === 0) {
      preloadImages(rounds.slice(0, 3));
    }
    const nextRounds = rounds.slice(idx + 1, idx + 3);
    preloadImages(nextRounds);
  }, [idx, rounds]);
  const choices = useMemo(() => current ? makeAlphabetChoices(getFirstLetter(current.word)) : [], [current]);
  const imageUrl = useMemo(() => current ? getCuratedImageUrl(current.word) : null, [current]);

  useEffect(() => {
    setShowHint(false);
    setImageError(false);
  }, [idx]);

  const handleChoice = (letter) => {
    if (feedback) return;
    const correct = letter === getFirstLetter(current.word);
    setFeedback(correct ? "correct" : "wrong");
    recordReview(studentName, getFirstLetter(current.word), correct);
    if (correct) {
      onCorrect();
      const newCombo = combo + 1;
      setCombo(newCombo);
      setScore(s => s + 1);
      setTimeout(() => speakWord(current.word), 200);
      if (newCombo >= 3) {
        setTimeout(() => angela.show(getComboReaction(newCombo)), 400);
      } else {
        setTimeout(() => angela.show("correct"), 400);
      }
    } else {
      onWrong();
      setCombo(0);
      setTimeout(() => angela.show("wrong"), 200);
    }
    setTimeout(() => {
      if (idx < rounds.length - 1) {
        setIdx(i => i + 1);
        setFeedback(null);
      } else {
        const final = score + (correct ? 1 : 0);
        setDone(true);
        saveProgress(studentName, gameId, levelId, final, rounds.length);
        onFinish(final, rounds.length);
        setTimeout(() => angela.show(getFinishReaction(final, rounds.length)), 500);
        if (final / rounds.length >= 0.8) setConfettiTrigger(t => t + 1);
      }
    }, 1500);
  };

  const handleHint = () => {
    playClick();
    setShowHint(true);
  };

  if (done) {
    return <FinishScreen score={score} total={rounds.length} levelId={levelId} onBack={onBack} onExit={onExit} />;
  }

  if (!current) {
    return <EmptyPoolMessage onBack={onBack} message="이 단계엔 그림으로 풀 수 있는 단어가 없어요" />;
  }

  const restOfWord = current.word.slice(1);

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <FullScreenConfetti trigger={confettiTrigger} />
      <angela.AngelaComponent />
      <GameHeader
        onBack={onBack}
        title="🖼️ 그림 보고 첫글자"
        progress={idx + 1}
        total={rounds.length}
        score={score}
        combo={combo}
      />

      <div style={{
        background: `linear-gradient(135deg, ${T.yellowLight}, ${T.pinkLight})`,
        borderRadius: T.radiusXl, padding: "30px 20px 24px",
        textAlign: "center", marginBottom: 16,
        position: "relative"
      }}>
        {!showHint && feedback === null && (
          <button
            onClick={handleHint}
            title="힌트 보기"
            style={{
              position: "absolute", top: 12, right: 12,
              background: "rgba(255,255,255,0.85)",
              border: `1.5px solid ${T.orange}`,
              borderRadius: T.radiusFull, padding: "6px 12px",
              fontSize: 12, fontWeight: 800,
              color: T.orange, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4,
              boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
            }}
          >
            💡 힌트
          </button>
        )}

        <div style={{
          width: "100%", maxWidth: 320, height: 240,
          margin: "0 auto 14px",
          borderRadius: T.radius, overflow: "hidden",
          background: "rgba(255,255,255,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
        }}>
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={current.word}
              loading="lazy"
              onError={() => setImageError(true)}
              style={{
                width: "100%", height: "100%",
                objectFit: "cover", display: "block"
              }}
            />
          ) : (
            <div style={{ fontSize: 130, lineHeight: 1 }}>{current.emoji}</div>
          )}
        </div>

        <div style={{ fontSize: 13, color: T.textMid, fontWeight: 700 }}>
          이 그림의 첫 글자는?
        </div>

        {showHint && feedback === null && (
          <div style={{
            marginTop: 12,
            display: "inline-flex", gap: 4,
            background: "rgba(255,255,255,0.7)",
            padding: "8px 16px", borderRadius: T.radiusSm,
            border: `1.5px dashed ${T.orange}`,
            fontFamily: "monospace", letterSpacing: 2
          }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: T.orange }}>_</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: T.text }}>{restOfWord}</span>
          </div>
        )}

        {feedback === "correct" && (
          <div style={{ fontSize: 26, fontWeight: 900, color: T.green, marginTop: 10 }}>
            {current.word} <span style={{ fontSize: 16, opacity: 0.85 }}>({current.ko})</span>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {choices.map(letter => {
          const correct = letter === getFirstLetter(current.word);
          const isAnswered = feedback !== null;
          let bg = T.card, color = T.text, border = T.border;
          if (isAnswered && correct) { bg = T.green; color = "white"; border = T.green; }
          return (
            <button key={letter} onClick={() => handleChoice(letter)}
              disabled={isAnswered}
              style={{
                background: bg, color, border: `3px solid ${border}`,
                borderRadius: T.radius, padding: "28px 0",
                fontSize: 52, fontWeight: 900,
                cursor: isAnswered ? "default" : "pointer",
                transition: "all 0.2s"
              }}>
              {letter}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//   공통: 빈 풀이 메시지
// ══════════════════════════════════════════════════════════════════════════
function EmptyPoolMessage({ onBack, message }) {
  return (
    <div style={{ padding: 20, maxWidth: 480, margin: "40px auto 0", textAlign: "center" }}>
      <div style={{ fontSize: 60, marginBottom: 12 }}>📭</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 8 }}>
        {message || "이 단계엔 풀 단어가 없어요"}
      </div>
      <button onClick={onBack} style={{
        marginTop: 16, padding: "12px 24px", background: T.accent,
        color: "white", border: "none", borderRadius: T.radius,
        fontSize: 13, fontWeight: 800, cursor: "pointer"
      }}>← 뒤로</button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//   GAME 5: 🧩 소리 듣고 단어 만들기
// ══════════════════════════════════════════════════════════════════════════
function BuildWordGame({ studentName, levelId, gameId, onBack, onExit, customWords }) {
  const [rounds] = useState(() => {
    const source = customWords || getPhonicsWords(levelId);
    const all = source.filter(w => w.word && w.word.length >= 3 && w.word.length <= 5);
    return shuffle(all).slice(0, 10);
  });
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [builtLetters, setBuiltLetters] = useState([]);
  const [done, setDone] = useState(false);
  const [imageError, setImageError] = useState(false);
  const angela = useAngela();
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  const current = rounds[idx];
  const imageUrl = useMemo(() => current ? getCuratedImageUrl(current.word) : null, [current]);
  const targetWord = current?.word.toLowerCase() || "";

  const letterChoices = useMemo(() => {
    if (!current || !targetWord) return [];
    const wordEntries = targetWord.split("").map((letter, i) => ({
      id: `w${i}`, letter
    }));
    const allLetters = "abcdefghijklmnopqrstuvwxyz".split("");
    const inWord = new Set(targetWord);
    const wrongs = allLetters.filter(l => !inWord.has(l));
    const wrongCount = Math.max(2, Math.min(3, 7 - targetWord.length));
    const wrongPicks = shuffle(wrongs).slice(0, wrongCount);
    const wrongEntries = wrongPicks.map((letter, i) => ({
      id: `x${i}`, letter
    }));
    return shuffle([...wordEntries, ...wrongEntries]);
  }, [current, targetWord]);

  useEffect(() => {
    if (current && !feedback) {
      setBuiltLetters([]);
      const t = setTimeout(() => speakWord(current.word), 300);
      return () => clearTimeout(t);
    }
  }, [idx, feedback]);

  useEffect(() => { setImageError(false); }, [idx]);

  const handleLetterClick = (entry) => {
    if (feedback) return;
    const nextLetters = [...builtLetters, entry];
    setBuiltLetters(nextLetters);
    playClick();

    if (nextLetters.length === targetWord.length) {
      const built = nextLetters.map(l => l.letter).join("");
      const correct = built === targetWord;
      setFeedback(correct ? "correct" : "wrong");
      if (correct) {
        onCorrect();
        const newCombo = combo + 1;
        setCombo(newCombo);
        setScore(s => s + 1);
        setTimeout(() => speakWord(current.word), 200);
        if (newCombo >= 3) {
          setTimeout(() => angela.show(getComboReaction(newCombo)), 400);
        } else {
          setTimeout(() => angela.show("correct"), 400);
        }
      } else {
        onWrong();
        setCombo(0);
        setTimeout(() => angela.show("wrong"), 200);
      }
      setTimeout(() => {
        if (idx < rounds.length - 1) {
          setIdx(i => i + 1);
          setFeedback(null);
        } else {
          const final = score + (correct ? 1 : 0);
          setDone(true);
          saveProgress(studentName, gameId, levelId, final, rounds.length);
          onFinish(final, rounds.length);
          setTimeout(() => angela.show(getFinishReaction(final, rounds.length)), 500);
          if (final / rounds.length >= 0.8) setConfettiTrigger(t => t + 1);
        }
      }, 1800);
    }
  };

  const undo = () => {
    if (feedback) return;
    playClick();
    setBuiltLetters(prev => prev.slice(0, -1));
  };

  if (!current) {
    return <EmptyPoolMessage onBack={onBack} message="이 단계엔 단어 만들기를 할 단어가 없어요 (3-5글자 단어만 지원)" />;
  }

  if (done) {
    return <FinishScreen score={score} total={rounds.length} levelId={levelId} onBack={onBack} onExit={onExit} />;
  }

  const cols = Math.min(5, letterChoices.length);

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <FullScreenConfetti trigger={confettiTrigger} />
      <angela.AngelaComponent />
      <GameHeader
        onBack={onBack}
        title="🧩 단어 만들기"
        progress={idx + 1}
        total={rounds.length}
        score={score}
        combo={combo}
      />

      <div style={{
        background: T.card, borderRadius: T.radiusXl, padding: "24px 16px",
        textAlign: "center", marginBottom: 16, border: `2px solid ${T.border}`
      }}>
        <div style={{
          width: 130, height: 130, margin: "0 auto 6px",
          borderRadius: T.radius, overflow: "hidden",
          background: "rgba(255,255,255,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
        }}>
          {imageUrl && !imageError ? (
            <img src={imageUrl} alt={current.word} loading="lazy"
              onError={() => setImageError(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ fontSize: 80, lineHeight: 1 }}>{current.emoji}</div>
          )}
        </div>
        <div style={{ fontSize: 12, color: T.textMid, marginBottom: 12 }}>{current.ko}</div>

        <button onClick={() => speakWord(current.word)}
          style={{
            background: T.accent, color: "white",
            border: "none", borderRadius: T.radiusSm, padding: "10px 16px",
            fontSize: 13, fontWeight: 700, cursor: "pointer", marginBottom: 16
          }}>
          🔊 다시 듣기
        </button>

        <div style={{
          display: "flex", gap: 6, justifyContent: "center", marginBottom: 8, flexWrap: "wrap"
        }}>
          {Array.from({ length: targetWord.length }).map((_, i) => {
            const built = builtLetters[i];
            const isCorrect = feedback === "correct";
            const isWrong = feedback === "wrong";
            return (
              <div key={i} style={{
                width: 48, height: 56,
                background: built
                  ? (isCorrect ? T.green : isWrong ? T.redLight : T.accentLight)
                  : T.bg,
                border: `2px solid ${built
                  ? (isCorrect ? T.green : isWrong ? T.red : T.accent)
                  : T.border}`,
                borderRadius: T.radiusSm,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, fontWeight: 900,
                color: built
                  ? (isCorrect ? "white" : isWrong ? T.red : T.accent)
                  : T.textDim,
                fontFamily: "monospace"
              }}>
                {built ? built.letter : "_"}
              </div>
            );
          })}
        </div>

        {builtLetters.length > 0 && !feedback && (
          <button onClick={undo} style={{
            background: "transparent", color: T.textMid,
            border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
            padding: "4px 10px", fontSize: 11, fontWeight: 700,
            cursor: "pointer", marginTop: 6
          }}>
            ← 되돌리기
          </button>
        )}

        {feedback === "wrong" && (
          <div style={{ fontSize: 13, color: T.red, fontWeight: 700, marginTop: 10 }}>
            정답: <strong style={{ fontSize: 16 }}>{current.word}</strong>
          </div>
        )}
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 8
      }}>
        {letterChoices.map((entry) => {
          const used = builtLetters.some(b => b.id === entry.id);
          return (
            <button key={entry.id} onClick={() => handleLetterClick(entry)}
              disabled={used || feedback !== null}
              style={{
                background: used ? T.border : T.card,
                color: used ? T.textDim : T.text,
                border: `2px solid ${used ? T.border : T.accent}`,
                borderRadius: T.radiusSm, padding: "16px 0",
                fontSize: 28, fontWeight: 900,
                cursor: used || feedback ? "default" : "pointer",
                opacity: used ? 0.4 : 1,
                transition: "all 0.2s"
              }}>
              {entry.letter}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//   GAME 6: ✍️ 글자 따라쓰기 (대소문자 짝, 획순/방향 안내 + 4선지)
// ══════════════════════════════════════════════════════════════════════════
const PAIRS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(c => [c, c.toLowerCase()]);
const PAIRS_PER_SESSION = 5; // 한 세션에 5쌍(=10글자)

function speakLetterName(ch) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(ch);
  u.lang = "en-US"; u.rate = 0.8;
  window.speechSynthesis.speak(u);
}

function LetterWriteGame({ studentName, levelId, gameId, onBack, onExit, letterPool, titleOverride }) {
  // 세션 글자 목록: letterPool이 주어지면 그걸 쓰고, 없으면 랜덤 5쌍
  const [letters] = useState(() => {
    if (Array.isArray(letterPool) && letterPool.length > 0) return letterPool;
    const start = Math.floor(Math.random() * (PAIRS.length - PAIRS_PER_SESSION + 1));
    const chosen = PAIRS.slice(start, start + PAIRS_PER_SESSION);
    return chosen.flat();
  });

  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const angela = useAngela();

  const letter = letters[idx];
  const strokes = useMemo(() => getLetterStrokes(letter) || [], [letter]);
  const g = GUIDE_LINES;

  // 획 추적 상태
  const svgRef = useRef(null);
  const guideRefs = useRef([]);
  const [strokeIdx, setStrokeIdx] = useState(0);
  const [inked, setInked] = useState("");
  const [completedInk, setCompletedInk] = useState([]); // 완성된 획들(화면에 계속 남김)
  const [msg, setMsg] = useState("초록 점에서 시작해 화살표 방향으로 그어요");
  const [msgKind, setMsgKind] = useState("idle"); // idle|ok|warn|done|info
  const drawing = useRef(false);
  const pts = useRef([]);
  const covered = useRef([]);
  const totalSamples = useRef(0);
  const animRef = useRef(null);
  const [pacer, setPacer] = useState(null);

  const TOL = 30, PASS = 0.6;

  // 글자 바뀌면 초기화
  useEffect(() => {
    cancelAnim();
    setStrokeIdx(0); setInked(""); setCompletedInk([]); drawing.current = false; pts.current = [];
    setMsg("초록 점에서 시작해 화살표 방향으로 그어요"); setMsgKind("idle");
    speakLetterName(letter);
  }, [idx]);

  // 획 바뀌면 샘플 초기화
  useEffect(() => {
    const path = guideRefs.current[strokeIdx];
    if (!path) return;
    const len = path.getTotalLength();
    totalSamples.current = Math.max(30, Math.floor(len / 6));
    covered.current = new Array(totalSamples.current).fill(false);
    pts.current = []; setInked("");
  }, [strokeIdx, letter]);

  function cancelAnim() {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = null; setPacer(null);
  }
  function toLocal(e) {
    const r = svgRef.current.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: ((t.clientX - r.left) / r.width) * 300, y: ((t.clientY - r.top) / r.height) * 300 };
  }
  function nearest(p) {
    const path = guideRefs.current[strokeIdx];
    if (!path) return { d: 999, i: -1 };
    const len = path.getTotalLength(); let best = 999, bi = -1;
    const n = totalSamples.current;
    for (let i = 0; i < n; i++) {
      const gp = path.getPointAtLength((i / n) * len);
      const d = Math.hypot(gp.x - p.x, gp.y - p.y);
      if (d < best) { best = d; bi = i; }
    }
    return { d: best, i: bi };
  }
  function mark(p) { const nr = nearest(p); if (nr.d < TOL && nr.i >= 0) covered.current[nr.i] = true; }
  function coverage() {
    const a = covered.current; let c = 0;
    for (let i = 0; i < a.length; i++) if (a[i]) c++;
    return a.length ? c / a.length : 0;
  }
  function start(e) {
    if (animRef.current) return;
    e.preventDefault();
    const p = toLocal(e), nr = nearest(p);
    if (nr.i > totalSamples.current * 0.35) { setMsg("시작점(초록 점)부터 시작해요"); setMsgKind("warn"); return; }
    drawing.current = true; pts.current = [p]; mark(p); setMsgKind("info");
  }
  function move(e) {
    if (!drawing.current) return;
    e.preventDefault();
    const p = toLocal(e); pts.current.push(p); mark(p);
    const ps = pts.current; let d = `M ${ps[0].x} ${ps[0].y}`;
    for (let i = 1; i < ps.length; i++) d += ` L ${ps[i].x} ${ps[i].y}`;
    setInked(d);
  }
  function end() {
    if (!drawing.current) return;
    drawing.current = false;
    if (coverage() >= PASS) {
      // 완성된 획은 가이드 경로(반듯한 모양)로 화면에 남김
      const path = guideRefs.current[strokeIdx];
      const finishedD = path ? path.getAttribute("d") : inked;
      setCompletedInk(prev => [...prev, finishedD]);
      setInked("");
      if (strokeIdx < strokes.length - 1) {
        playClick(); setStrokeIdx(i => i + 1);
        setMsg(`좋아요! 다음 획 ${strokeIdx + 2}번`); setMsgKind("ok");
      } else {
        // 글자 완성
        onCorrect();
        recordReview(studentName, letter, true);
        speakLetterName(letter);
        setMsg(`완성! ${letter} 잘 썼어요 ⭐`); setMsgKind("done");
        setTimeout(() => angela.show("correct"), 300);
        setTimeout(() => {
          if (idx < letters.length - 1) {
            setIdx(i => i + 1);
          } else {
            setDone(true);
            saveProgress(studentName, gameId, levelId, letters.length, letters.length);
            setConfettiTrigger(t => t + 1);
            setTimeout(() => angela.show("perfect"), 300);
            onFinish(letters.length, letters.length);
          }
        }, 1100);
      }
    } else {
      setMsg("점선을 끝까지 따라가 봐요"); setMsgKind("warn");
      covered.current = new Array(totalSamples.current).fill(false);
      pts.current = []; setInked("");
    }
  }
  function playDemo() {
    if (animRef.current || drawing.current) return;
    const path = guideRefs.current[strokeIdx];
    if (!path) return;
    const len = path.getTotalLength(); const dur = 1100; let t0 = null;
    setMsg("이 방향으로 그어요 👀"); setMsgKind("info");
    const step = (ts) => {
      if (!t0) t0 = ts;
      const t = (ts - t0) / dur;
      if (t >= 1) {
        cancelAnim(); covered.current = new Array(totalSamples.current).fill(false);
        setInked(""); setMsg("이제 직접 따라 그어보세요"); setMsgKind("idle"); return;
      }
      const cp = path.getPointAtLength(t * len);
      setPacer({ x: cp.x, y: cp.y });
      const s0 = path.getPointAtLength(0); let d = `M ${s0.x} ${s0.y}`;
      for (let l = 0; l <= t * len; l += 5) { const q = path.getPointAtLength(l); d += ` L ${q.x} ${q.y}`; }
      setInked(d);
      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
  }
  function retry() {
    cancelAnim(); setStrokeIdx(0); setInked(""); setCompletedInk([]);
    setMsg("초록 점에서 시작해 화살표 방향으로 그어요"); setMsgKind("idle");
  }

  if (done) {
    return <FinishScreen score={letters.length} total={letters.length} levelId={levelId} onBack={onBack} onExit={onExit} />;
  }
  if (!letter || strokes.length === 0) {
    return <EmptyPoolMessage onBack={onBack} message="따라쓸 글자를 불러올 수 없어요" />;
  }

  let startPt = null;
  const cp = guideRefs.current[strokeIdx];
  if (cp) { try { startPt = cp.getPointAtLength(0); } catch {} }

  const inkColor = msgKind === "done" ? T.green : T.accent;
  const msgColor = msgKind === "done" || msgKind === "ok" ? T.green
    : msgKind === "warn" ? T.orange : msgKind === "info" ? T.accent : T.textMid;
  const isUpper = letter === letter.toUpperCase();

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <FullScreenConfetti trigger={confettiTrigger} />
      <angela.AngelaComponent />
      <GameHeader
        onBack={onBack}
        title={titleOverride || "✍️ 글자 따라쓰기"}
        progress={idx + 1}
        total={letters.length}
      />

      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 16, fontWeight: 900, color: T.text }}>
          {letter} <span style={{ fontSize: 12, color: T.textMid }}>
            ({isUpper ? "대문자" : "소문자"})
          </span>
        </span>
      </div>

      <div style={{
        background: `linear-gradient(135deg, ${T.yellowLight}, ${T.pinkLight})`,
        borderRadius: T.radiusXl, padding: 16,
        display: "flex", flexDirection: "column", alignItems: "center"
      }}>
        <svg
          ref={svgRef}
          viewBox="0 0 300 300"
          style={{ width: "100%", maxWidth: 300, touchAction: "none", cursor: "crosshair",
                   background: "#fff", borderRadius: T.radius, border: `1px solid ${T.border}` }}
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end}
        >
          <defs>
            <marker id="lw-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill={T.accent} />
            </marker>
          </defs>

          {[[g.cap, "2 5"], [g.mid, "2 5"], [g.base, null], [g.desc, "2 5"]].map(([y, dash], i) => (
            <line key={i} x1="18" y1={y} x2="282" y2={y}
              stroke="#cbd5e1" strokeWidth={dash ? 1 : 1.5}
              strokeDasharray={dash || undefined} opacity={dash ? 0.6 : 0.85} />
          ))}

          {strokes.map((d, i) => (
            <path key={`gh-${i}`} d={d} fill="none" stroke="#e8eaed"
              strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
          ))}

          {strokes.map((d, i) => (
            <path key={`gd-${i}`} ref={el => (guideRefs.current[i] = el)} d={d} fill="none"
              stroke={i === strokeIdx ? "#94a3b8" : "transparent"}
              strokeWidth="3" strokeDasharray="6 10" strokeLinecap="round"
              markerEnd={i === strokeIdx ? "url(#lw-arrow)" : undefined} />
          ))}

          {strokes.length > 1 && strokes.map((d, i) => {
            const path = guideRefs.current[i];
            if (!path) return null;
            let s; try { s = path.getPointAtLength(0); } catch { return null; }
            const doneStroke = i < strokeIdx;
            return (
              <g key={`n-${i}`}>
                <circle cx={s.x} cy={s.y} r="13" fill={doneStroke ? T.green : "#fff"}
                  stroke="#94a3b8" strokeWidth="1.5" />
                <text x={s.x} y={s.y} textAnchor="middle" dominantBaseline="central"
                  fontSize="15" fontWeight="700" fill={doneStroke ? "#fff" : "#64748b"}>{i + 1}</text>
              </g>
            );
          })}

          {completedInk.map((d, i) => (
            <path key={`done-${i}`} d={d} fill="none" stroke={T.green}
              strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
          ))}

          <path d={inked} fill="none" stroke={inkColor} strokeWidth="14"
            strokeLinecap="round" strokeLinejoin="round" />

          {pacer && <circle cx={pacer.x} cy={pacer.y} r="9" fill={T.accent} stroke="#fff" strokeWidth="2" />}

          {msgKind !== "done" && !pacer && startPt && pts.current.length === 0 && (
            <circle cx={startPt.x} cy={startPt.y} r="12" fill={T.green} />
          )}
        </svg>

        <div style={{ fontSize: 15, fontWeight: 800, color: msgColor, minHeight: 22, marginTop: 12, textAlign: "center" }}>
          {msg}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <Btn v="primary" size="sm" onClick={playDemo}>▶ 시범</Btn>
          <Btn v="ghost" size="sm" onClick={retry}>↺ 다시</Btn>
          <Btn v="ghost" size="sm" onClick={() => speakLetterName(letter)}>🔊 소리</Btn>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//   GAME 7: 🔁 오늘의 복습 (간격 반복 — 복습할 때가 된 글자 다시 쓰기)
// ══════════════════════════════════════════════════════════════════════════
function ReviewGame({ studentName, levelId, gameId, onBack, onExit }) {
  // 복습 대상 글자: 오늘 due인 것 우선, 부족하면 새 글자로 채움
  const [pool] = useState(() => {
    const allLetters = [
      ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
      ..."abcdefghijklmnopqrstuvwxyz".split(""),
    ];
    const due = getDueItems(studentName, allLetters, 10);
    if (due.length >= 3) return due;
    // 복습할 게 적으면 안 배운 글자로 보충
    const fresh = getNewItems(studentName, allLetters, 10 - due.length);
    return [...due, ...fresh];
  });

  if (!pool || pool.length === 0) {
    return (
      <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
        <GameHeader onBack={onBack} title="🔁 오늘의 복습" progress={0} total={1} />
        <div style={{
          marginTop: 40, textAlign: "center",
          background: T.card, borderRadius: T.radiusLg, padding: 32, boxShadow: T.shadow
        }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: T.text, marginBottom: 6 }}>
            지금 복습할 글자가 없어요!
          </div>
          <div style={{ fontSize: 13, color: T.textMid, marginBottom: 20, lineHeight: 1.5 }}>
            글자 게임을 더 하면, 익힌 글자를<br />
            알맞은 때에 다시 복습으로 꺼내줄게요.
          </div>
          <Btn v="primary" size="lg" onClick={onExit}>홈으로</Btn>
        </div>
      </div>
    );
  }

  // 복습은 따라쓰기 형식 재사용
  return (
    <LetterWriteGame
      studentName={studentName}
      levelId={levelId}
      gameId={gameId}
      onBack={onBack}
      onExit={onExit}
      letterPool={pool}
      titleOverride="🔁 오늘의 복습"
    />
  );
}

// ══════════════════════════════════════════════════════════════════════════
//   GAME 8: 🎲 단어 보드게임 (30칸, 주사위 + 퀴즈 + 보너스/함정)
// ══════════════════════════════════════════════════════════════════════════
const BOARD_SIZE = 30;

// 30칸 보드 생성: 출발/도착 + 중간 칸을 정해진 비율로 섞어 배치
function buildBoard(words) {
  const mid = []; // 1~28번 (28칸)
  // 종류별 개수
  const plan = [
    ...Array(12).fill("quiz"),
    ...Array(10).fill("word"),
    ...Array(3).fill("bonus"),
    ...Array(3).fill("trap"),
  ];
  // 섞기 (Fisher-Yates)
  for (let i = plan.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [plan[i], plan[j]] = [plan[j], plan[i]];
  }
  // 도착 직전 칸이 함정이면 단어로 교체 (좌절 방지)
  if (plan[plan.length - 1] === "trap") plan[plan.length - 1] = "word";
  // 첫 칸이 어려우면 단어로
  if (plan[0] === "trap" || plan[0] === "quiz") plan[0] = "word";

  let wi = 0;
  const pick = () => words.length ? words[wi++ % words.length] : { word: "cat", ko: "고양이", emoji: "🐱" };

  const cells = [{ type: "start" }];
  plan.forEach((type) => {
    if (type === "word" || type === "quiz") {
      cells.push({ type, w: pick() });
    } else if (type === "bonus") {
      cells.push({ type, n: 1 + Math.floor(Math.random() * 2) }); // +1~2
    } else {
      cells.push({ type, n: -(1 + Math.floor(Math.random() * 2)) }); // -1~2
    }
  });
  cells.push({ type: "goal" });
  return cells;
}

function BoardGame({ studentName, levelId, gameId, onBack, onExit }) {
  const angela = useAngela();
  const [board] = useState(() => {
    const src = getPhonicsWords(levelId) || [];
    const usable = src.filter(w => w && w.word);
    return buildBoard(shuffle(usable));
  });

  const [pos, setPos] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [busy, setBusy] = useState(false);     // 이동/처리 중 버튼 잠금
  const [diceFace, setDiceFace] = useState(0); // 0=물음표
  const [msg, setMsg] = useState("주사위를 굴려 출발해요!");
  const [quiz, setQuiz] = useState(null);       // {word, choices, answer} | null
  const [quizFeedback, setQuizFeedback] = useState(null); // null|correct|wrong
  const [done, setDone] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [rollCount, setRollCount] = useState(0);

  const posRef = useRef(0);
  useEffect(() => { posRef.current = pos; }, [pos]);

  // 안전 타이머: 진행 중 타이머를 모아 언마운트 시 일괄 정리 (게임 도중 나가도 안전)
  const timersRef = useRef([]);
  const safeTimeout = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  };
  useEffect(() => () => { timersRef.current.forEach(clearTimeout); }, []);

  const DICE_FACES = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

  // 칸 도착 처리
  function resolveCell(at) {
    const cell = board[at];
    if (!cell) { setBusy(false); return; }
    if (cell.type === "goal") {
      setMsg("🎉 도착! 참 잘했어요!");
      setDone(true);
      saveProgress(studentName, gameId, levelId, 1, 1);
      setConfettiTrigger(t => t + 1);
      safeTimeout(() => angela.show("perfect"), 300);
      onFinish(1, 1);
      setBusy(false);
      return;
    }
    if (cell.type === "word") {
      setMsg(`📖 "${cell.w.word}" 소리 내어 읽어요!`);
      speakWord(cell.w.word);
      safeTimeout(() => angela.show("happy"), 200);
      setBusy(false);
      return;
    }
    if (cell.type === "quiz") {
      const ans = getFirstLetter(cell.w.word);
      const choices = makeAlphabetChoices(ans);
      setQuiz({ word: cell.w.word, choices, answer: ans });
      setQuizFeedback(null);
      setMsg(`❓ "${cell.w.word}" — 첫 글자를 골라요!`);
      speakWord(cell.w.word);
      // busy 유지 (퀴즈 풀어야 다음 가능)
      return;
    }
    if (cell.type === "bonus") {
      setMsg(`⬆️ 보너스! ${cell.n}칸 더 앞으로!`);
      safeTimeout(() => angela.show("happy"), 100);
      onCorrect();
      safeTimeout(() => {
        const next = Math.min(BOARD_SIZE - 1, at + cell.n);
        moveTo(at, next, () => resolveCell(next));
      }, 800);
      return;
    }
    if (cell.type === "trap") {
      setMsg(`⬇️ 앗! ${Math.abs(cell.n)}칸 뒤로...`);
      safeTimeout(() => angela.show("oops"), 100);
      safeTimeout(() => {
        const next = Math.max(0, at + cell.n);
        moveBack(at, next, () => resolveCell(next));
      }, 800);
      return;
    }
    setBusy(false);
  }

  // 앞으로 한 칸씩 이동 애니메이션
  function moveTo(from, to, after) {
    if (from >= to) { setPos(to); after && after(); return; }
    const next = from + 1;
    setPos(next);
    if (next >= to) { after && after(); return; }
    safeTimeout(() => moveTo(next, to, after), 260);
  }
  // 뒤로 이동
  function moveBack(from, to, after) {
    if (from <= to) { setPos(to); after && after(); return; }
    const next = from - 1;
    setPos(next);
    if (next <= to) { after && after(); return; }
    safeTimeout(() => moveBack(next, to, after), 220);
  }

  function rollDice() {
    if (rolling || busy || done || quiz) return;
    setRolling(true); setBusy(true);
    const n = 1 + Math.floor(Math.random() * 6);
    let ticks = 0;
    const spin = setInterval(() => {
      setDiceFace(1 + Math.floor(Math.random() * 6));
      if (++ticks > 8) {
        clearInterval(spin);
        setDiceFace(n);
        setRolling(false);
        setRollCount(c => c + 1);
        setMsg(`${n}칸 이동!`);
        playClick();
        safeTimeout(() => {
          const target = Math.min(BOARD_SIZE - 1, posRef.current + n);
          moveTo(posRef.current, target, () => resolveCell(target));
        }, 450);
      }
    }, 70);
  }

  function answerQuiz(letter) {
    if (!quiz || quizFeedback === "correct") return;
    if (letter === quiz.answer) {
      setQuizFeedback("correct");
      onCorrect();
      recordReview(studentName, quiz.answer, true);
      setMsg(`정답! "${quiz.word}"의 첫 글자는 ${quiz.answer} ⭐`);
      safeTimeout(() => angela.show("happy"), 100);
      safeTimeout(() => { setQuiz(null); setQuizFeedback(null); setBusy(false); }, 1100);
    } else {
      setQuizFeedback("wrong");
      onWrong();
      recordReview(studentName, quiz.answer, false);
      setMsg("아쉬워요! 다시 골라볼까요?");
      safeTimeout(() => angela.show("oops"), 100);
      // 제자리 멈춤: 다시 고를 수 있게 wrong 표시만 잠깐
      safeTimeout(() => setQuizFeedback(null), 700);
    }
  }

  if (done) {
    return <FinishScreen score={1} total={1} levelId={levelId} onBack={onBack} onExit={onExit} />;
  }

  // 보드 셀 색상
  const cellStyle = (cell, isHere) => {
    let bg = T.card, color = T.text;
    if (cell.type === "start") { bg = T.tealLight || T.bgSoft; color = T.teal; }
    else if (cell.type === "goal") { bg = T.greenLight || T.bgSoft; color = T.green; }
    else if (cell.type === "quiz") { bg = T.yellowLight; color = T.orange; }
    else if (cell.type === "bonus") { bg = T.greenLight || T.bgSoft; color = T.green; }
    else if (cell.type === "trap") { bg = T.redLight; color = T.red; }
    return {
      position: "relative", aspectRatio: "1",
      borderRadius: T.radiusSm,
      background: bg, color,
      border: isHere ? `2px solid ${T.accent}` : `1px solid ${T.border}`,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontSize: 13, fontWeight: 800, overflow: "hidden",
      boxShadow: isHere ? T.shadow : "none",
    };
  };

  const cellInner = (cell) => {
    if (cell.type === "start") return "출발";
    if (cell.type === "goal") return "🏁";
    if (cell.type === "word") return cell.w.word;
    if (cell.type === "quiz") return "❓";
    if (cell.type === "bonus") return `⬆️${cell.n}`;
    if (cell.type === "trap") return `⬇️${cell.n}`;
    return "";
  };

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <FullScreenConfetti trigger={confettiTrigger} />
      <angela.AngelaComponent />
      <GameHeader
        onBack={onBack}
        title="🎲 단어 보드게임"
        progress={pos}
        total={BOARD_SIZE - 1}
      />

      {/* 보드 (6열 × 5행) */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 5, marginBottom: 14
      }}>
        {board.map((cell, i) => {
          const isHere = i === pos;
          return (
            <div key={i} style={cellStyle(cell, isHere)}>
              <span style={{ fontSize: cell.type === "word" ? 12 : 14 }}>{cellInner(cell)}</span>
              {isHere && (
                <div style={{ position: "absolute", bottom: 1, fontSize: 16 }}>🧒</div>
              )}
            </div>
          );
        })}
      </div>

      {/* 퀴즈 패널 또는 주사위 패널 */}
      {quiz ? (
        <div style={{
          background: T.yellowLight, borderRadius: T.radiusLg, padding: 16, textAlign: "center"
        }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: T.text, marginBottom: 4 }}>
            "{quiz.word}"의 첫 글자는?
          </div>
          <button onClick={() => speakWord(quiz.word)} style={{
            background: "none", border: "none", color: T.accent, fontSize: 13,
            fontWeight: 700, cursor: "pointer", marginBottom: 12
          }}>🔊 다시 듣기</button>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {quiz.choices.map((letter) => {
              const isAns = letter === quiz.answer;
              let bg = T.card, bc = T.border, col = T.text;
              if (quizFeedback === "correct" && isAns) { bg = T.green; col = "white"; bc = T.green; }
              if (quizFeedback === "wrong" && !isAns) { /* keep */ }
              return (
                <button key={letter} onClick={() => answerQuiz(letter)}
                  disabled={quizFeedback === "correct"}
                  style={{
                    padding: "18px 0", fontSize: 28, fontWeight: 900,
                    background: bg, color: col, border: `2px solid ${bc}`,
                    borderRadius: T.radius, cursor: "pointer"
                  }}>
                  {letter}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{
          background: T.bgSoft, borderRadius: T.radiusLg, padding: 16, textAlign: "center"
        }}>
          <div style={{
            width: 64, height: 64, margin: "0 auto 10px",
            background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36
          }}>{diceFace === 0 ? "🎲" : DICE_FACES[diceFace]}</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.textMid, minHeight: 40,
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            {msg}
          </div>
          <Btn v="primary" size="lg" onClick={rollDice} disabled={rolling || busy}>
            🎲 주사위 굴리기
          </Btn>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//   GAME 9: 🎱 단어 빙고 (3×3, 듣고 찾기 — 단어+그림)
// ══════════════════════════════════════════════════════════════════════════
const BINGO_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function BingoGame({ studentName, levelId, gameId, onBack, onExit }) {
  const angela = useAngela();

  const timersRef = useRef([]);
  const safeTimeout = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  };
  useEffect(() => () => { timersRef.current.forEach(clearTimeout); }, []);

  // 9칸 채울 단어 + 부르는 순서
  const setup = useMemo(() => {
    const src = (getPhonicsWords(levelId) || []).filter(w => w && w.word);
    const nine = shuffle(src).slice(0, 9);
    // 단어가 9개 미만이면 채워질 때까지 반복(작은 풀 방어)
    while (nine.length < 9 && src.length > 0) nine.push(src[nine.length % src.length]);
    const callOrder = shuffle(nine.map((_, i) => i)); // 부를 순서(칸 인덱스)
    return { cells: nine, callOrder };
  }, [levelId]);

  const [marked, setMarked] = useState(() => new Set());
  const [imgErr, setImgErr] = useState(() => new Set());
  const [callIdx, setCallIdx] = useState(-1);     // 지금까지 부른 횟수(-1=시작 전)
  const [current, setCurrent] = useState(null);    // 현재 부른 단어 {word,ko,emoji,cellIndex}
  const [bingoCount, setBingoCount] = useState(0);
  const [done, setDone] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [msg, setMsg] = useState("시작을 누르면 단어를 불러줄게요!");
  const [waiting, setWaiting] = useState(false);   // 부른 단어 찾는 중

  const cells = setup.cells;

  function callNext() {
    if (done || waiting) return;
    const nextCall = callIdx + 1;
    if (nextCall >= setup.callOrder.length) {
      // 다 불렀는데 안 끝났으면(이론상 거의 없음) 종료 처리
      finish();
      return;
    }
    const cellIndex = setup.callOrder[nextCall];
    const w = cells[cellIndex];
    setCallIdx(nextCall);
    setCurrent({ ...w, cellIndex });
    setMsg(`🔊 "${w.word}" — 어디 있을까요?`);
    setWaiting(true);
    speakWord(w.word);
  }

  function clickCell(i) {
    if (done || !waiting || !current) return;
    if (marked.has(i)) return;
    if (i === current.cellIndex) {
      // 정답 — 표시
      const nm = new Set(marked); nm.add(i);
      setMarked(nm);
      onCorrect();
      recordReview(studentName, getFirstLetter(current.word), true);
      setWaiting(false);

      // 빙고 줄 수 확인
      const newBingo = BINGO_LINES.filter(line => line.every(idx => nm.has(idx))).length;
      if (newBingo > bingoCount) {
        setBingoCount(newBingo);
        setMsg(`🎉 빙고! (${newBingo}줄)`);
        setConfettiTrigger(t => t + 1);
        safeTimeout(() => angela.show("perfect"), 200);
      } else {
        setMsg("잘 찾았어요! 다음 단어 들어볼까요?");
        safeTimeout(() => angela.show("happy"), 150);
      }

      // 9칸 다 채웠거나 빙고가 났으면 종료 판단
      if (nm.size >= 9) {
        safeTimeout(() => finishWin(newBingo), 1000);
      }
    } else {
      // 오답 — 흔들기 느낌(메시지)
      onWrong();
      setMsg("거기가 아니에요! 다시 들어볼까요?");
      safeTimeout(() => angela.show("oops"), 100);
    }
  }

  function finishWin(bingoLines) {
    setDone(true);
    saveProgress(studentName, gameId, levelId, 1, 1);
    setConfettiTrigger(t => t + 1);
    safeTimeout(() => angela.show("perfect"), 300);
    onFinish(1, 1);
  }
  function finish() {
    setDone(true);
    saveProgress(studentName, gameId, levelId, 1, 1);
    onFinish(1, 1);
  }

  if (done) {
    return <FinishScreen score={1} total={1} levelId={levelId} onBack={onBack} onExit={onExit} />;
  }

  if (!cells || cells.length < 9) {
    return <EmptyPoolMessage onBack={onBack} message="빙고를 만들 단어가 부족해요 (9개 필요)" />;
  }

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <FullScreenConfetti trigger={confettiTrigger} />
      <angela.AngelaComponent />
      <GameHeader
        onBack={onBack}
        title="🎱 단어 빙고"
        progress={marked.size}
        total={9}
      />

      {bingoCount > 0 && (
        <div style={{
          textAlign: "center", marginBottom: 8, fontSize: 14, fontWeight: 900, color: T.green
        }}>
          ⭐ {bingoCount}줄 빙고!
        </div>
      )}

      {/* 빙고판 3×3 */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14
      }}>
        {cells.map((w, i) => {
          const isMarked = marked.has(i);
          const url = getCuratedImageUrl(w.word);
          const showImg = url && !imgErr.has(i);
          return (
            <div key={i} onClick={() => clickCell(i)}
              style={{
                aspectRatio: "1", borderRadius: T.radius, cursor: waiting ? "pointer" : "default",
                background: isMarked ? T.green : T.card,
                border: `2px solid ${isMarked ? T.green : T.border}`,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 2,
                position: "relative", overflow: "hidden", transition: "all 0.15s",
                padding: 4,
              }}>
              <div style={{
                width: 48, height: 48, borderRadius: 8, overflow: "hidden",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: isMarked ? "rgba(255,255,255,0.25)" : T.bgSoft,
              }}>
                {showImg ? (
                  <img src={url} alt={w.word} loading="lazy"
                    onError={() => setImgErr(prev => new Set(prev).add(i))}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 30 }}>{w.emoji || "🔤"}</span>
                )}
              </div>
              <span style={{
                fontSize: 13, fontWeight: 800,
                color: isMarked ? "white" : T.text
              }}>{w.word}</span>
              {isMarked && (
                <div style={{ position: "absolute", top: 3, right: 5, fontSize: 16 }}>✓</div>
              )}
            </div>
          );
        })}
      </div>

      {/* 부르기 패널 */}
      <div style={{
        background: T.bgSoft, borderRadius: T.radiusLg, padding: 16, textAlign: "center"
      }}>
        <div style={{
          fontSize: 15, fontWeight: 800, color: T.textMid, minHeight: 40,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>{msg}</div>
        {waiting && current ? (
          <Btn v="ghost" size="sm" onClick={() => speakWord(current.word)}>
            🔊 다시 듣기
          </Btn>
        ) : (
          <Btn v="primary" size="lg" onClick={callNext}>
            {callIdx < 0 ? "🎤 시작!" : "🎤 다음 단어"}
          </Btn>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//   GAME 10: 🁢 끝소리 잇기 도미노 (끝 글자로 시작하는 단어 잇기)
// ══════════════════════════════════════════════════════════════════════════
const DOMINO_GOAL = 6; // 목표 연결 개수

function dLast(w) { return (w.word || "").trim().toLowerCase().slice(-1); }
function dFirst(w) { return (w.word || "").trim().toLowerCase()[0]; }

// 미리 이어지는 체인을 만들어둠 (중간에 막히지 않게)
function buildChain(pool, goalLen) {
  const usable = pool.filter(w => w && w.word && w.word.length >= 2);
  if (usable.length === 0) return [];
  // 여러 시작점을 시도해 가장 긴 체인 확보
  let best = [];
  const tries = shuffle(usable).slice(0, Math.min(8, usable.length));
  for (const startW of tries) {
    const chain = [startW];
    const used = new Set([startW.word]);
    let cur = startW;
    while (chain.length < goalLen + 1) {
      const target = dLast(cur);
      const cands = shuffle(usable.filter(w =>
        dFirst(w) === target && !used.has(w.word)
      ));
      if (cands.length === 0) break;
      cur = cands[0];
      chain.push(cur);
      used.add(cur.word);
    }
    if (chain.length > best.length) best = chain;
    if (best.length >= goalLen + 1) break;
  }
  return best;
}

function DominoGame({ studentName, levelId, gameId, onBack, onExit }) {
  const angela = useAngela();

  const timersRef = useRef([]);
  const safeTimeout = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  };
  useEffect(() => () => { timersRef.current.forEach(clearTimeout); }, []);

  const chain = useMemo(() => {
    const src = (getPhonicsWords(levelId) || []).filter(w => w && w.word);
    return buildChain(src, DOMINO_GOAL);
  }, [levelId]);

  const poolAll = useMemo(
    () => (getPhonicsWords(levelId) || []).filter(w => w && w.word),
    [levelId]
  );

  const [step, setStep] = useState(0);  // 현재까지 이어붙인 개수 (체인 인덱스)
  const [feedback, setFeedback] = useState(null); // null|correct|wrong
  const [done, setDone] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  // 현재 단어 = chain[step], 다음 정답 = chain[step+1]
  const cur = chain[step];
  const answer = chain[step + 1];

  // 보기: 정답 1개 + 오답 3개 (오답은 끝소리가 다른 단어들)
  const choices = useMemo(() => {
    if (!answer) return [];
    const wrongs = shuffle(
      poolAll.filter(w => w.word !== answer.word && w.word !== (cur && cur.word)
        && dFirst(w) !== dLast(cur || {}))
    ).slice(0, 3);
    // 오답이 부족하면 아무 단어로 채움
    if (wrongs.length < 3) {
      const extra = shuffle(poolAll.filter(w =>
        w.word !== answer.word && !wrongs.find(x => x.word === w.word)
      )).slice(0, 3 - wrongs.length);
      wrongs.push(...extra);
    }
    return shuffle([answer, ...wrongs]);
  }, [step, answer, cur, poolAll]);

  useEffect(() => {
    if (cur && cur.word) {
      const t = safeTimeout(() => speakWord(cur.word), 300);
      return () => clearTimeout(t);
    }
  }, [step]);

  function choose(w) {
    if (feedback === "correct" || !answer) return;
    if (w.word === answer.word) {
      setFeedback("correct");
      onCorrect();
      recordReview(studentName, dLast(cur), true); // 끝소리 글자 기록
      speakWord(w.word);
      safeTimeout(() => {
        const nextStep = step + 1;
        // 목표 달성 또는 체인 끝 도달
        if (nextStep >= DOMINO_GOAL || nextStep >= chain.length - 1) {
          setStep(nextStep);
          setDone(true);
          saveProgress(studentName, gameId, levelId, nextStep, DOMINO_GOAL);
          setConfettiTrigger(t => t + 1);
          safeTimeout(() => angela.show("perfect"), 300);
          onFinish(nextStep, DOMINO_GOAL);
        } else {
          setStep(nextStep);
          setFeedback(null);
          safeTimeout(() => angela.show("happy"), 100);
        }
      }, 1000);
    } else {
      setFeedback("wrong");
      onWrong();
      recordReview(studentName, dLast(cur), false);
      safeTimeout(() => angela.show("oops"), 100);
      safeTimeout(() => setFeedback(null), 800);
    }
  }

  if (done) {
    return <FinishScreen score={step} total={DOMINO_GOAL} levelId={levelId} onBack={onBack} onExit={onExit} />;
  }
  // 체인을 충분히 못 만들면(단어 풀 부족) 안내
  if (!chain || chain.length < 2) {
    return <EmptyPoolMessage onBack={onBack} message="끝소리로 이을 단어가 부족해요" />;
  }

  const endCh = dLast(cur || {});

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <FullScreenConfetti trigger={confettiTrigger} />
      <angela.AngelaComponent />
      <GameHeader
        onBack={onBack}
        title="🁢 끝소리 잇기"
        progress={step}
        total={DOMINO_GOAL}
      />

      {/* 지금까지 이어진 도미노 띠 */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14,
        justifyContent: "center", minHeight: 40
      }}>
        {chain.slice(0, step + 1).map((w, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 4
          }}>
            <span style={{
              padding: "6px 12px", borderRadius: T.radiusSm,
              background: i === step ? T.accent : T.green, color: "white",
              fontSize: 14, fontWeight: 800
            }}>{w.word}</span>
            {i < step && <span style={{ color: T.textDim, fontSize: 12 }}>→</span>}
          </div>
        ))}
      </div>

      {/* 현재 단어 + 끝소리 강조 */}
      <div style={{
        background: `linear-gradient(135deg, ${T.yellowLight}, ${T.pinkLight})`,
        borderRadius: T.radiusXl, padding: "20px 16px", textAlign: "center", marginBottom: 16
      }}>
        <div style={{ fontSize: 13, color: T.textMid, fontWeight: 700, marginBottom: 6 }}>
          이 단어의 끝소리로 시작하는 단어는?
        </div>
        <div style={{ fontSize: 36, fontWeight: 900, color: T.text, letterSpacing: 1 }}>
          {cur.word.slice(0, -1)}
          <span style={{ color: T.accent }}>{cur.word.slice(-1)}</span>
        </div>
        <button onClick={() => speakWord(cur.word)} style={{
          background: "none", border: "none", color: T.accent, fontSize: 13,
          fontWeight: 700, cursor: "pointer", marginTop: 6
        }}>🔊 다시 듣기 (끝소리 /{endCh}/)</button>
      </div>

      {/* 보기 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {choices.map((w) => {
          const isAns = answer && w.word === answer.word;
          let bg = T.card, bc = T.border, col = T.text;
          if (feedback === "correct" && isAns) { bg = T.green; col = "white"; bc = T.green; }
          if (feedback === "wrong" && isAns) { /* 정답은 그대로 */ }
          const url = getCuratedImageUrl(w.word);
          return (
            <button key={w.word} onClick={() => choose(w)}
              disabled={feedback === "correct"}
              style={{
                padding: "12px", background: bg, color: col,
                border: `2px solid ${bc}`, borderRadius: T.radius, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8
              }}>
              <span style={{ fontSize: 24 }}>{w.emoji || "🔤"}</span>
              <span style={{ fontSize: 18, fontWeight: 900 }}>{w.word}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//   공통 컴포넌트
// ══════════════════════════════════════════════════════════════════════════
function GameHeader({ onBack, title, progress, total, score, combo }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <button onClick={onBack} style={{
          background: T.bgSoft, border: "none", borderRadius: T.radiusSm,
          padding: "7px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", color: T.textMid
        }}>← 그만</button>
        <div style={{ flex: 1, fontSize: 15, fontWeight: 900, color: T.text }}>{title}</div>
        {combo > 0 && (
          <div style={{
            background: combo >= 3 ? T.orange : T.accent, color: "white",
            padding: "3px 12px", borderRadius: T.radiusFull, fontSize: 12, fontWeight: 900
          }}>
            🔥 {combo}
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ flex: 1, height: 8, background: T.border, borderRadius: 4, overflow: "hidden" }}>
          <div style={{
            width: `${(progress / total) * 100}%`, height: "100%",
            background: T.accent, transition: "width 0.3s", borderRadius: 4
          }} />
        </div>
        <div style={{ fontSize: 11, color: T.textMid, fontWeight: 700 }}>
          {progress}/{total}
          {typeof score === "number" && <span style={{ marginLeft: 6, color: T.green }}>· ⭐ {score}</span>}
        </div>
      </div>
    </div>
  );
}

function FinishScreen({ score, total, levelId, onBack, onExit }) {
  const stars = getStars(score, total);
  const ratio = total > 0 ? score / total : 0;
  let message, mainEmoji;
  if (ratio === 1.0) { message = "완벽해요! 정말 잘했어요!"; mainEmoji = "🏆"; }
  else if (ratio >= 0.8) { message = "아주 잘했어요!"; mainEmoji = "🌟"; }
  else if (ratio >= 0.5) { message = "잘했어요! 더 연습해봐요"; mainEmoji = "😊"; }
  else { message = "괜찮아요, 다시 도전해봐요!"; mainEmoji = "💪"; }

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
      <div style={{
        background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`,
        color: "white", borderRadius: T.radiusXl, padding: "40px 24px", marginTop: 40,
        boxShadow: T.shadowLg
      }}>
        <div style={{ fontSize: 96, marginBottom: 12 }}>{mainEmoji}</div>
        <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>{message}</div>
        <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 20 }}>
          {score} / {total} 맞췄어요
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 24 }}>
          {[1, 2, 3].map(i => (
            <span key={i} style={{
              fontSize: 60,
              opacity: stars >= i ? 1 : 0.3,
              filter: stars >= i ? "drop-shadow(0 0 12px rgba(255,255,255,0.8))" : "none",
              transition: `all 0.5s ${i * 0.2}s`
            }}>⭐</span>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button onClick={onBack} style={{
          flex: 1, padding: 14, background: T.card,
          color: T.text, border: `2px solid ${T.border}`, borderRadius: T.radius,
          fontSize: 13, fontWeight: 800, cursor: "pointer"
        }}>
          다시 도전
        </button>
        <button onClick={onExit} style={{
          flex: 1, padding: 14, background: T.accent,
          color: "white", border: "none", borderRadius: T.radius,
          fontSize: 13, fontWeight: 800, cursor: "pointer",
          boxShadow: T.shadowColor
        }}>
          홈으로
        </button>
      </div>
    </div>
  );
}
