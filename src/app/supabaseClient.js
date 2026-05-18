// ══════════════════════════════════════════════════════════════════════════
// Angela's English Academy — Supabase 클라이언트
//
// 이 파일은 앱이 Supabase 데이터베이스와 통신하기 위한 통로입니다.
// 환경변수(NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)에서
// 접속 정보를 자동으로 읽어옵니다.
// ══════════════════════════════════════════════════════════════════════════

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 환경변수가 설정되지 않은 경우 경고 (개발 중 실수 방지)
if (typeof window !== "undefined" && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn(
    "⚠️ Supabase 환경변수가 설정되지 않았어요!\n" +
    "Vercel의 Environment Variables에 다음 두 개를 추가해주세요:\n" +
    "  - NEXT_PUBLIC_SUPABASE_URL\n" +
    "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

// Supabase 클라이언트 — 앱 전역에서 단 하나만 만들어 재사용
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // 우리는 자체 로그인을 쓰니까 Supabase 인증은 끄기
      },
    })
  : null;

// Supabase 사용 가능 여부 (다른 코드에서 체크용)
export const isSupabaseReady = () => supabase !== null;

// ──────────────────────────────────────────────────────────────────────────
// 헬퍼 함수들: 자주 쓰는 작업을 한 줄로 호출 가능
// ──────────────────────────────────────────────────────────────────────────

// 단일 키-값 설정 (settings 테이블)
export async function getSetting(key, fallback = null) {
  if (!supabase) return fallback;
  try {
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error) throw error;
    return data?.value ?? fallback;
  } catch (e) {
    console.warn(`getSetting(${key}) 실패:`, e.message);
    return fallback;
  }
}

export async function setSetting(key, value) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from("settings")
      .upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn(`setSetting(${key}) 실패:`, e.message);
    return false;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// 연결 테스트 함수 — 처음 설정한 후 동작 확인용
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
