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

