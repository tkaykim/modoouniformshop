const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const USE_LOCAL_API = process.env.NEXT_PUBLIC_USE_LOCAL_API === "true";

export type UpsertStepPayload = {
  session_id: string;
  step: number;
  payload: Record<string, unknown>;
  utm?: Record<string, unknown>;
};

export async function upsertInquiryStep(data: UpsertStepPayload) {
  console.info("[api] upsertInquiryStep:request", { data, USE_LOCAL_API });
  const endpoint = USE_LOCAL_API
    ? "/api/upsert-inquiry-step"
    : `${SUPABASE_URL}/functions/v1/upsert_inquiry_step`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (!USE_LOCAL_API) {
    headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
  }
  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  console.info("[api] upsertInquiryStep:response", { status: res.status });
  if (!res.ok) {
    throw new Error(`upsert_inquiry_step failed: ${res.status}`);
  }
  return (await res.json()) as { inquiryId: string; last_step_completed: number };
}

export async function finalizeInquiry(sessionId: string) {
  console.info("[api] finalizeInquiry:request", { sessionId, USE_LOCAL_API });
  const endpoint = USE_LOCAL_API
    ? "/api/finalize-inquiry"
    : `${SUPABASE_URL}/functions/v1/finalize_inquiry`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (!USE_LOCAL_API) {
    headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
  }
  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ session_id: sessionId }),
  });
  console.info("[api] finalizeInquiry:response", { status: res.status });
  if (!res.ok) {
    throw new Error(`finalize_inquiry failed: ${res.status}`);
  }
  return (await res.json()) as { inquiryId: string; status: string };
}

export type GoogleAppsScriptPayload = {
  groupName?: string;
  name: string;
  contact: string;
  product?: string;
  quantity?: string;
  date?: string;
  extra?: string;
};

export async function sendToGoogleAppsScript(data: GoogleAppsScriptPayload) {
  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby7tgQIdGfqPdhhxS2VJBaOz80e34QxrHtak9118QDE1Zb4um1IhxbnKehM62NUzxq6/exec";
  
  try {
    console.info("[api] sendToGoogleAppsScript:request", { data });
    
    // FormData 방식으로 전송 (Google Apps Script doPost 호환)
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      body: formData,
    });
    
    console.info("[api] sendToGoogleAppsScript:response", { status: res.status });
    
    if (!res.ok) {
      throw new Error(`Google Apps Script failed: ${res.status}`);
    }
    
    const result = await res.json();
    console.info("[api] sendToGoogleAppsScript:success", { result });
    return result;
  } catch (error) {
    console.error("[api] sendToGoogleAppsScript:error", error);
    // 에러가 발생해도 메인 플로우는 차단하지 않음
    throw error;
  }
}

