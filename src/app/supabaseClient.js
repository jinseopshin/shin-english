// ══════════════════════════════════════════════════════════════════════════
// Angela's English Academy — Supabase 클라이언트 v3 (데이터 보호 강화)
//
// v3 변경 사항 (2026-05-19):
// - 안전장치 추가: 빈 데이터로 save 시도되면 거부 (시크릿 모드 사고 방지)
// - 학생/시험/문제은행 등 핵심 데이터의 대량 삭제 방지
// - 콘솔에 명확한 경고 메시지
// ══════════════════════════════════════════════════════════════════════════

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (typeof window !== "undefined" && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn(
    "⚠️ Supabase 환경변수가 설정되지 않았어요!\n" +
    "Vercel의 Environment Variables에 다음 두 개를 추가해주세요:\n" +
    "  - NEXT_PUBLIC_SUPABASE_URL\n" +
    "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    })
  : null;

export const isSupabaseReady = () => supabase !== null;

export async function testConnection() {
  if (!supabase) {
    return { ok: false, message: "Supabase 클라이언트가 초기화되지 않았어요" };
  }
  try {
    const { error } = await supabase.from("students").select("name").limit(1);
    if (error) throw error;
    return { ok: true, message: "✅ Supabase 연결 성공!" };
  } catch (e) {
    return { ok: false, message: `❌ 연결 실패: ${e.message}` };
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  🛡️ v3 안전장치: 빈 데이터 save 거부
//
//  로컬에 데이터가 비어있는데 DB엔 threshold개 이상 있을 때 save를 거부합니다.
//  시크릿 모드, 캐시 초기화, 다른 PC에서 처음 로그인 같은 상황에서
//  의도치 않게 모든 데이터가 삭제되는 사고를 막아줍니다.
//
//  threshold = DB에 N개 이상 있을 때만 안전장치 동작
//  (1~2개만 있을 땐 진섭님이 의도적으로 삭제했을 수 있으니 허용)
// ══════════════════════════════════════════════════════════════════════════
async function isUnsafeEmptyOverwrite(tableName, newRowCount, threshold = 3) {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select("*", { count: "exact", head: true });
    if (error) return false;
    
    const dbCount = count || 0;
    if (newRowCount === 0 && dbCount >= threshold) {
      console.warn(
        `🛡️ [안전장치] ${tableName} 테이블에 ${dbCount}개 row가 있는데 ` +
        `빈 데이터로 save 시도됨 — 거부합니다. 새로고침 후 다시 시도하세요.`
      );
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ══════════════════════════════════════════════════════════════════════════
// 데이터 매핑 정의
// ══════════════════════════════════════════════════════════════════════════

const studentsAdapter = {
  async fetch() {
    const { data, error } = await supabase.from("students").select("*");
    if (error) throw error;
    const obj = {};
    (data || []).forEach(row => {
      obj[row.name] = {
        name: row.name,
        grade: row.grade,
        avatar: row.avatar,
        memo: row.memo,
        joinDate: row.join_date,
        points: row.points || 0,
        records: row.records || [],
        wordHomework: row.word_homework || null,
        customExam: row.custom_exam || null,
      };
    });
    return obj;
  },
  async save(value) {
    const rows = Object.values(value || {}).map(s => ({
      name: s.name,
      grade: s.grade || "초등5",
      avatar: s.avatar || "🦊",
      memo: s.memo || "",
      join_date: s.joinDate || new Date().toISOString().slice(0, 10),
      points: s.points || 0,
      records: s.records || [],
      word_homework: s.wordHomework || null,
      custom_exam: s.customExam || null,
      updated_at: new Date().toISOString(),
    }));

    // 🛡️ v3 안전장치
    if (await isUnsafeEmptyOverwrite("students", rows.length)) return false;

    const { data: existing } = await supabase.from("students").select("name");
    const currentNames = new Set(rows.map(r => r.name));
    const toDelete = (existing || []).filter(e => !currentNames.has(e.name)).map(e => e.name);

    if (toDelete.length > 0) {
      await supabase.from("students").delete().in("name", toDelete);
    }
    if (rows.length > 0) {
      const { error } = await supabase.from("students").upsert(rows, { onConflict: "name" });
      if (error) throw error;
    }
    return true;
  }
};

const banksAdapter = {
  async fetch() {
    const { data, error } = await supabase.from("question_banks").select("*");
    if (error) throw error;
    const obj = {};
    (data || []).forEach(row => {
      obj[row.id] = {
        id: row.id,
        title: row.title,
        grade: row.grade,
        tag: row.tag,
        questions: row.questions || [],
      };
    });
    return obj;
  },
  async save(value) {
    const rows = Object.values(value || {}).map(b => ({
      id: b.id,
      title: b.title || "제목 없음",
      grade: b.grade || "초등5",
      tag: b.tag || "어휘",
      questions: b.questions || [],
      updated_at: new Date().toISOString(),
    }));

    if (await isUnsafeEmptyOverwrite("question_banks", rows.length)) return false;

    const { data: existing } = await supabase.from("question_banks").select("id");
    const currentIds = new Set(rows.map(r => r.id));
    const toDelete = (existing || []).filter(e => !currentIds.has(e.id)).map(e => e.id);

    if (toDelete.length > 0) {
      await supabase.from("question_banks").delete().in("id", toDelete);
    }
    if (rows.length > 0) {
      const { error } = await supabase.from("question_banks").upsert(rows, { onConflict: "id" });
      if (error) throw error;
    }
    return true;
  }
};

const examsAdapter = {
  async fetch() {
    const { data, error } = await supabase.from("exams").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(row => ({
      id: row.id,
      title: row.title,
      grade: row.grade,
      timeLimit: row.time_limit,
      questions: row.questions || [],
      setIds: row.set_ids || [],
      createdAt: row.created_at?.slice(0, 10),
    }));
  },
  async save(value) {
    const arr = Array.isArray(value) ? value : [];
    const rows = arr.map(e => ({
      id: e.id,
      title: e.title || "제목 없음",
      grade: e.grade || null,
      time_limit: e.timeLimit || null,
      questions: e.questions || [],
      set_ids: e.setIds || [],
    }));

    if (await isUnsafeEmptyOverwrite("exams", rows.length)) return false;

    const { data: existing } = await supabase.from("exams").select("id");
    const currentIds = new Set(rows.map(r => r.id));
    const toDelete = (existing || []).filter(e => !currentIds.has(e.id)).map(e => e.id);

    if (toDelete.length > 0) {
      await supabase.from("exams").delete().in("id", toDelete);
    }
    if (rows.length > 0) {
      const { error } = await supabase.from("exams").upsert(rows, { onConflict: "id" });
      if (error) throw error;
    }
    return true;
  }
};

const assignmentsAdapter = {
  async fetch() {
    const { data, error } = await supabase.from("assignments").select("*");
    if (error) throw error;
    return (data || []).map(row => ({
      id: row.id,
      studentName: row.student_name,
      bankId: row.bank_id,
      bankTitle: row.bank_title,
      assignedAt: row.assigned_at,
      dueDate: row.due_date,
      status: row.status,
    }));
  },
  async save(value) {
    const arr = Array.isArray(value) ? value : [];
    const rows = arr.map(a => ({
      id: a.id,
      student_name: a.studentName,
      bank_id: a.bankId,
      bank_title: a.bankTitle,
      assigned_at: a.assignedAt || new Date().toISOString(),
      due_date: a.dueDate || null,
      status: a.status || "pending",
    }));

    if (await isUnsafeEmptyOverwrite("assignments", rows.length)) return false;

    const { data: existing } = await supabase.from("assignments").select("id");
    const currentIds = new Set(rows.map(r => r.id));
    const toDelete = (existing || []).filter(e => !currentIds.has(e.id)).map(e => e.id);

    if (toDelete.length > 0) {
      await supabase.from("assignments").delete().in("id", toDelete);
    }
    if (rows.length > 0) {
      const { error } = await supabase.from("assignments").upsert(rows, { onConflict: "id" });
      if (error) throw error;
    }
    return true;
  }
};

const makeJsonListAdapter = (tableName) => ({
  async fetch() {
    const { data, error } = await supabase.from(tableName).select("*");
    if (error) throw error;
    return (data || []).map(row => ({ ...row.data, id: row.id }));
  },
  async save(value) {
    const arr = Array.isArray(value) ? value : [];
    const rows = arr.map(item => ({
      id: item.id || Math.random().toString(36).slice(2, 9),
      data: item,
      updated_at: new Date().toISOString(),
    }));

    if (await isUnsafeEmptyOverwrite(tableName, rows.length)) return false;

    const { data: existing } = await supabase.from(tableName).select("id");
    const currentIds = new Set(rows.map(r => r.id));
    const toDelete = (existing || []).filter(e => !currentIds.has(e.id)).map(e => e.id);

    if (toDelete.length > 0) {
      await supabase.from(tableName).delete().in("id", toDelete);
    }
    if (rows.length > 0) {
      const { error } = await supabase.from(tableName).upsert(rows, { onConflict: "id" });
      if (error) throw error;
    }
    return true;
  }
});

const attendanceAdapter = {
  async fetch() {
    const { data, error } = await supabase.from("attendance").select("*");
    if (error) throw error;
    const obj = {};
    (data || []).forEach(row => {
      obj[row.key] = row.data;
    });
    return obj;
  },
  async save(value) {
    const rows = Object.entries(value || {}).map(([key, val]) => ({
      key,
      data: val,
      updated_at: new Date().toISOString(),
    }));

    // 🛡️ 출석 기록은 더 보수적으로 (5개 이상이면 안전장치 발동)
    if (await isUnsafeEmptyOverwrite("attendance", rows.length, 5)) return false;

    const { data: existing } = await supabase.from("attendance").select("key");
    const currentKeys = new Set(rows.map(r => r.key));
    const toDelete = (existing || []).filter(e => !currentKeys.has(e.key)).map(e => e.key);

    if (toDelete.length > 0) {
      await supabase.from("attendance").delete().in("key", toDelete);
    }
    if (rows.length > 0) {
      const { error } = await supabase.from("attendance").upsert(rows, { onConflict: "key" });
      if (error) throw error;
    }
    return true;
  }
};

// settings: 단일 키-값 (안전장치 불필요 — upsert만 사용)
const settingsAdapter = (settingKey) => ({
  async fetch() {
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", settingKey)
      .maybeSingle();
    if (error) throw error;
    return data?.value;
  },
  async save(value) {
    const { error } = await supabase
      .from("settings")
      .upsert({ key: settingKey, value, updated_at: new Date().toISOString() });
    if (error) throw error;
    return true;
  }
});

// ══════════════════════════════════════════════════════════════════════════
// 매핑 테이블
// ══════════════════════════════════════════════════════════════════════════
export const STORAGE_ADAPTERS = {
  angela_students: studentsAdapter,
  angela_bank: banksAdapter,
  angela_exams: examsAdapter,
  angela_assignments: assignmentsAdapter,
  angela_groups: makeJsonListAdapter("groups"),
  angela_notices: makeJsonListAdapter("notices"),
  angela_goals: makeJsonListAdapter("goals"),
  angela_schedules: makeJsonListAdapter("schedules"),
  angela_attendance: attendanceAdapter,
  angela_pw: settingsAdapter("pw"),
  angela_dark: settingsAdapter("dark"),
};

export function getAdapter(key) {
  return STORAGE_ADAPTERS[key] || null;
}
