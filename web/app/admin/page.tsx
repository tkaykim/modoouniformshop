"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Inquiry = {
  id: string;
  created_at: string;
  status: string;
  name: string | null;
  contact: string | null;
  inquiry_kind: string | null;
  quantity: number | null;
};

export default function AdminPage() {
  const [session, setSession] = useState<import('@supabase/supabase-js').Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signUp() {
    setError(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
  }

  async function signIn() {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("inquiries")
        .select("id, created_at, status, name, contact, inquiry_kind, quantity")
        .order("created_at", { ascending: false });
      if (error) setError(error.message);
      else setInquiries((data as Inquiry[]) || []);
      setLoading(false);
    })();
  }, [session]);

  if (!session) {
    return (
      <main className="max-w-md mx-auto p-6 space-y-4">
        <h1 className="text-xl font-semibold">Admin Login / Signup</h1>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <input
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex gap-2">
          <button className="px-3 py-2 border rounded" onClick={signIn}>로그인</button>
          <button className="px-3 py-2 border rounded" onClick={signUp}>회원가입</button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">상담 신청 내역</h1>
        <button className="px-3 py-2 border rounded text-sm" onClick={signOut}>로그아웃</button>
      </div>
      {loading ? (
        <div className="text-sm text-gray-500">불러오는 중…</div>
      ) : (
        <div className="overflow-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">날짜</th>
                <th className="px-3 py-2 text-left">상태</th>
                <th className="px-3 py-2 text-left">이름</th>
                <th className="px-3 py-2 text-left">연락처</th>
                <th className="px-3 py-2 text-left">종류</th>
                <th className="px-3 py-2 text-left">수량</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((q) => (
                <tr key={q.id} className="border-t">
                  <td className="px-3 py-2">{new Date(q.created_at).toLocaleString("ko-KR")}</td>
                  <td className="px-3 py-2">{q.status}</td>
                  <td className="px-3 py-2">{q.name || "-"}</td>
                  <td className="px-3 py-2">{q.contact || "-"}</td>
                  <td className="px-3 py-2">{q.inquiry_kind || "-"}</td>
                  <td className="px-3 py-2">{q.quantity ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

