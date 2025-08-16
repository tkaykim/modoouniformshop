"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Row = { id: string; email: string | null; display_name: string | null; role: string | null; can_access?: string[] };

export default function ManagersPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: me } = await supabase.auth.getUser();
      const uid = me.data.user?.id;
      if (!uid) return setError('로그인이 필요합니다');
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', uid).single();
      const admin = prof?.role === 'admin';
      setIsAdmin(admin);
      if (!admin) return;
      const { data } = await supabase.rpc('list_users_admin');
      const list: Row[] = (Array.isArray(data) ? data : []).map((u: any) => ({ id: u.id, email: u.email, display_name: u.display_name, role: u.role || 'manager', can_access: u.can_access || [] }));
      setRows(list);
    })();
  }, []);

  if (!isAdmin) {
    return (
      <main className="max-w-xl mx-auto p-6">
        <h1 className="text-xl font-semibold mb-2">매니저 관리</h1>
        <div className="text-sm text-gray-600">접근 권한이 없습니다. 관리자 계정으로 로그인하세요.</div>
      </main>
    );
  }

  return (
    <main className="w-full max-w-[1000px] mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">매니저 관리</h1>
      </div>
      {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
      <div className="overflow-auto rounded-xl shadow-sm bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50/80">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700">이메일</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">이름</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">권한</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">접근 탭</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td className="px-4 py-3">{r.email || '-'}</td>
                <td className="px-4 py-3">{r.display_name || '-'}</td>
                <td className="px-4 py-3">{r.role || 'manager'}</td>
                <td className="px-4 py-3 text-gray-600">{(r.can_access || []).join(', ') || '전체'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={4}>표시할 매니저가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}


