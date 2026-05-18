// ══════════════════════════════════════════════════════════════════════════
// Angela's English Academy — Supabase 클라이언트 v2
//
// localStorage 키와 Supabase 테이블 간의 매핑을 자동으로 처리합니다.
// 모든 데이터 작업이 Supabase 우선, localStorage는 백업으로 동작합니다.
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

// ──────────────────────────────────────────────────────────────────────────
// 연결 테스트
// ──────────────────────────────────────────────────────────────────────────
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
// 데이터 매핑 정의
// localStorage 키별로 어떻게 Supabase와 주고받을지 정의합니다.
// ══════════════════════════════════════════════════════════════════════════

// students: { "민준": {...}, "서연": {...} } 형태 (객체)
// 행 단위로 students 테이블에 저장
const studentsAdapter = {
  // Supabase → 앱 (행 배열 → 객체)
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
  // 앱 → Supabase (객체 → 행 배열)
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

    // 현재 DB에 있는 학생 목록 가져와서 삭제할 학생 찾기
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

// question_banks: { "id1": {...}, "id2": {...} } 형태 (객체, id 키)
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

// exams: [{ id, ...}, ...] 형태 (배열)
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

// assignments: [{ id, studentName, ...}] 형태 (배열)
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

// groups/notices/goals/schedules: [{...}, ...] 배열, data 컬럼에 통째로 저장
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

// attendance: { "key1": {...}, "key2": {...} } 객체, key 컬럼 사용
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

// settings: 단일 키-값 (비밀번호, 다크모드 등 작은 값들)
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
// 매핑 테이블: localStorage 키 → Supabase 어댑터
// 이 매핑에 정의되지 않은 키는 localStorage만 사용합니다 (안전 폴백)
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

// 어댑터 가져오기 (없으면 null)
export function getAdapter(key) {
  return STORAGE_ADAPTERS[key] || null;
}
