"use client";
import { useEffect, useMemo, useState, Fragment } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ClipboardList, LayoutGrid, PackageSearch, Star, Images, ArrowRight } from "lucide-react";

type Inquiry = {
  id: string;
  created_at: string;
  status: string;
  name: string | null;
  contact: string | null;
  inquiry_kind: string | null;
  quantity: number | null;
  assignee: string | null;
  admin_notes?: string | null;
  source?: string | null;
};

type Profile = { id: string; display_name: string | null; role?: string | null };

export default function AdminPage() {
  const [session, setSession] = useState<import('@supabase/supabase-js').Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Inquiry | null>(null);
  const [editForm, setEditForm] = useState<Partial<Inquiry>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const kindOptions = useMemo(() => {
    const base = new Set<string>(['단체복', '커스텀 소량 굿즈']);
    for (const k of inquiries) {
      if (k.inquiry_kind && !base.has(k.inquiry_kind)) base.add(k.inquiry_kind);
    }
    return Array.from(base);
  }, [inquiries]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const [manualOpen, setManualOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);

  // Dashboard metrics
  const stats = useMemo(() => {
    const total = inquiries.length;
    const newCount = inquiries.filter(i => i.status === 'new').length;
    const unassigned = inquiries.filter(i => !i.assignee).length;
    const myPending = inquiries.filter(i => i.assignee === currentUserId && (i.status === 'new' || i.status === 'in_progress')).length;
    return { total, newCount, unassigned, myPending };
  }, [inquiries, currentUserId]);

  const agentCounts = useMemo(() => {
    const byId: Record<string, { name: string; total: number; pending: number }>= {};
    for (const p of profiles) {
      byId[p.id] = { name: p.display_name || p.id.slice(0,6), total: 0, pending: 0 };
    }
    for (const i of inquiries) {
      if (!i.assignee) continue;
      if (!byId[i.assignee]) byId[i.assignee] = { name: i.assignee.slice(0,6), total: 0, pending: 0 };
      byId[i.assignee].total += 1;
      if (i.status === 'new' || i.status === 'in_progress') byId[i.assignee].pending += 1;
    }
    return Object.entries(byId).map(([id, v]) => ({ id, ...v })).sort((a,b)=> b.pending - a.pending);
  }, [inquiries, profiles]);

  const needReply = useMemo(() => (
    inquiries
      .filter(i => i.status === 'new')
      .sort((a,b)=> (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
      .slice(0, 8)
  ), [inquiries]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signUp() {
    setError(null);
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/admin` : undefined;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    });
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
      const userResp = await supabase.auth.getUser();
      const uid = userResp.data.user?.id || null;
      setCurrentUserId(uid);
      // 서버에서 최신 데이터 획득 (auth.users + profiles 조인)
      let admin = false; let email = ""; let displayName = "";
      if (uid) {
        const { data: me } = await supabase.rpc('get_me');
        if (Array.isArray(me) && me[0]) {
          email = me[0].email || "";
          displayName = me[0].display_name || (email ? email.split('@')[0] : '');
          admin = me[0].role === 'admin';
        } else {
          // 폴백: auth만 사용
          email = userResp.data.user?.email || "";
          const { data: prof } = await supabase.from('profiles').select('id, display_name, role').eq('id', uid).single();
          displayName = prof?.display_name || (email ? email.split('@')[0] : '');
          admin = (prof?.role === 'admin');
        }
      }
      setCurrentUserEmail(email);
      setCurrentUserName(displayName);
      setIsAdmin(admin);

      let q = supabase
        .from("inquiries")
        .select("id, created_at, status, name, contact, inquiry_kind, quantity, assignee, admin_notes, source")
        .order("created_at", { ascending: false });
      if (!admin && uid) {
        // 매니저: 담당자 미지정 또는 본인 지정건만 조회
        q = q.or(`assignee.is.null,assignee.eq.${uid}`);
      }
      const { data, error } = await q;
      if (error) setError(error.message);
      else setInquiries((data as Inquiry[]) || []);

      // 전체관리자는 전체 회원 목록, 매니저는 본인만
      if (admin) {
        const { data: users } = await supabase.rpc('list_users_admin');
        setProfiles((Array.isArray(users) ? users : []).map((u: { id:string; display_name?:string|null; email?:string|null; role:'admin'|'agent' }) => ({ id: u.id, display_name: u.display_name || u.email?.split('@')[0] || '', role: u.role })));
      } else if (uid) {
        const { data: profSelf } = await supabase.from('profiles').select('id, display_name, role').eq('id', uid).single();
        setProfiles(profSelf ? [profSelf as unknown as Profile] : []);
      }
      setLoading(false);
    })();
  }, [session]);

  async function updateInquiry(id: string, fields: Partial<Inquiry>) {
    const { error } = await supabase.from('inquiries').update(fields).eq('id', id);
    if (error) setError(error.message);
  }

  async function deleteInquiry(id: string) {
    if (!confirm('삭제하시겠습니까?')) return;
    setError(null);
    // Optimistic UI
    setInquiries(prev => prev.filter(q => q.id !== id));
    const { error } = await supabase.from('inquiries').delete().eq('id', id);
    if (error) {
      // rollback
      setInquiries(prev => prev);
      setError(error.message);
      alert(`삭제 실패: ${error.message}`);
    }
  }

  async function bulkDelete() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`${ids.length}건을 삭제하시겠습니까?`)) return;
    setError(null);
    // Chunk deletions to avoid URL length limits in REST query (id=in.(...))
    const CHUNK_SIZE = 8; // keep URL short to avoid REST length limits
    try {
      for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
        const chunk = ids.slice(i, i + CHUNK_SIZE);
        const { error } = await supabase.from('inquiries').delete().in('id', chunk);
        if (error) throw error;
      }
      setInquiries(prev => prev.filter(q => !selectedIds.has(q.id)));
      setSelectedIds(new Set());
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      alert(`선택 삭제 실패: ${msg}`);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function openEdit(q: Inquiry) {
    setEditing(q);
    setEditForm({
      name: q.name ?? '',
      contact: q.contact ?? '',
      inquiry_kind: q.inquiry_kind ?? '',
      quantity: q.quantity ?? null,
      status: q.status,
      assignee: q.assignee,
      admin_notes: q.admin_notes ?? ''
    });
  }

  async function saveEdit() {
    if (!editing) return;
    const { error } = await supabase.from('inquiries').update(editForm).eq('id', editing.id);
    if (error) { setError(error.message); return; }
    setInquiries(prev => prev.map(x => x.id === editing.id ? { ...x, ...editForm } as Inquiry : x));
    setEditing(null);
  }

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
    <main className="w-full max-w-[1400px] mx-auto p-6 lg:p-8">
      <div className="mb-6 rounded-xl px-4 py-3 bg-white shadow-sm text-sm">
        <div className="flex flex-col gap-0.5">
          <div><span className="text-gray-500">이름</span>: {currentUserName || '-'}</div>
          <div><span className="text-gray-500">이메일</span>: {currentUserEmail || '-'}</div>
          <div><span className="text-gray-500">역할</span>: {isAdmin ? '전체관리자' : '에이전트'}</div>
        </div>
      </div>

      {/* Brand header widgets */}
      <section className="mb-6 rounded-2xl p-5" style={{ background: '#0052cc' }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-white">
          <div className="rounded-xl bg-white/10 p-4">
            <div className="text-xs opacity-80">총 문의</div>
            <div className="text-2xl font-semibold">{stats.total}</div>
          </div>
          <div className="rounded-xl bg-white/10 p-4">
            <div className="text-xs opacity-80">미답변</div>
            <div className="text-2xl font-semibold">{stats.newCount}</div>
          </div>
          <div className="rounded-xl bg-white/10 p-4">
            <div className="text-xs opacity-80">담당자 미지정</div>
            <div className="text-2xl font-semibold">{stats.unassigned}</div>
          </div>
          <div className="rounded-xl bg-white/10 p-4">
            <div className="text-xs opacity-80">내 대기중</div>
            <div className="text-2xl font-semibold">{stats.myPending}</div>
          </div>
        </div>
      </section>

      {/* 관리 허브는 개요(대시보드)로 이동됨 */}

      {/* Agent performance pills */}
      {agentCounts.length > 0 && (
        <section className="mb-6">
          <div className="flex flex-wrap gap-2">
            {agentCounts.map(a => (
              <div key={a.id} className="px-3 py-2 rounded-full shadow-sm bg-white text-sm">
                <span className="font-medium mr-2" style={{ color: '#0052cc' }}>{a.name}</span>
                <span className="text-gray-600">총 {a.total}건</span>
                <span className="mx-1 text-gray-300">|</span>
                <span className="text-gray-600">대기 {a.pending}건</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Need action list */}
      {needReply.length > 0 && (
        <section className="mb-6 rounded-2xl bg-white shadow-sm">
          <div className="px-4 py-3 flex items-center justify-between">
            <h3 className="font-semibold">지금 답변해야 할 문의</h3>
            <span className="text-xs text-gray-500">최근 {needReply.length}건</span>
          </div>
          <ul className="divide-y">
            {needReply.map(n => (
              <li key={n.id} className="px-4 py-3 text-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: '#0052cc' }} />
                  <div>
                    <div className="font-medium">{n.name || '익명'} <span className="text-gray-400">· {n.inquiry_kind || '-'}</span></div>
                    <div className="text-gray-500 text-xs">{new Date(n.created_at).toLocaleString('ko-KR')}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-600">{n.contact || '-'}</div>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">역할: {isAdmin ? '전체관리자' : '에이전트'}</div>
        {isAdmin && (
          <button onClick={bulkDelete} className="px-4 py-2 rounded-full text-sm bg-white hover:bg-gray-50 shadow-sm">선택 삭제</button>
        )}
      </div>
      <h2 className="text-xl font-semibold mb-3">상담 신청 내역</h2>
      {/* 수동 등록 카드 */}
      <div className="mb-6 p-4 rounded-xl bg-white text-sm shadow-sm">
        <div className="flex items-center justify-between">
          <div className="font-semibold">상담 내역 직접 생성</div>
          <button className="px-2 py-1 rounded-full text-xs bg-white hover:bg-gray-50 shadow-sm" onClick={()=> setManualOpen(v=> !v)}>{manualOpen ? '접기' : '펼치기'}</button>
        </div>
        {manualOpen && (
          <div className="mt-3">
            <ManualCreate onCreated={(row)=> setInquiries((prev)=> [{
              id: crypto.randomUUID(),
              created_at: new Date().toISOString(),
              status: 'new',
              name: row.name || '-',
              contact: row.contact || '',
              inquiry_kind: row.inquiry_kind || '-',
              quantity: row.quantity ?? null,
              assignee: row.assignee || null,
              source: row.source || '-',
              admin_notes: ''
            } as Inquiry, ...prev])} profiles={profiles} kinds={kindOptions} />
          </div>
        )}
      </div>
      {loading ? (
        <div className="text-sm text-gray-500">불러오는 중…</div>
      ) : (
        <div className="overflow-auto rounded-xl shadow-sm bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">
                  {isAdmin && (
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={inquiries.length > 0 && selectedIds.size === inquiries.length}
                      onChange={(e)=> {
                        if (e.target.checked) {
                          setSelectedIds(new Set(inquiries.map((q)=> q.id)));
                        } else {
                          setSelectedIds(new Set());
                        }
                      }}
                    />
                  )}
                  날짜
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">상태</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">이름</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">연락처</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">종류</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">수량</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">담당자</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">구분</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">작업</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((q) => (
                <Fragment key={q.id}>
                  <tr className="align-top hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {isAdmin && (
                        <input type="checkbox" className="mr-2" checked={selectedIds.has(q.id)} onChange={()=> toggleSelect(q.id)} />
                      )}
                      <button className="mr-2 px-2 py-0.5 border rounded-full text-xs bg-white hover:bg-gray-50" onClick={()=> toggleExpand(q.id)}>{expandedIds.has(q.id) ? '접기' : '펼치기'}</button>
                      {new Date(q.created_at).toLocaleString("ko-KR")}
                    </td>
                    <td className="px-4 py-3">
          <select className="rounded px-2 py-1 bg-white shadow-sm" defaultValue={q.status || 'new'} onChange={(e)=> updateInquiry(q.id, { status: e.target.value as Inquiry['status'] })}>
                        <option value="new">미답변</option>
                        <option value="in_progress">진행중</option>
                        <option value="answered">답변완료</option>
                        <option value="closed">종료</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">{q.name || "-"}</td>
                    <td className="px-4 py-3">{q.contact || "-"}</td>
                    <td className="px-4 py-3">{q.inquiry_kind || "-"}</td>
                    <td className="px-4 py-3">{q.quantity ?? "-"}</td>
                    <td className="px-4 py-3">
          <select className="rounded px-2 py-1 bg-white shadow-sm" defaultValue={q.assignee || ''} onChange={(e)=> updateInquiry(q.id, { assignee: e.target.value || null })}>
                        <option value="">미지정</option>
                        {profiles.map((p)=> (
                          <option key={p.id} value={p.id}>{p.display_name || p.id.slice(0,6)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
          <select className="rounded px-2 py-1 bg-white shadow-sm" defaultValue={q.source || ''} onChange={(e)=> updateInquiry(q.id, { source: e.target.value || null })}>
                        <option value="">-</option>
                        <option>네이버 스마트스토어</option>
                        <option>카카오톡채널</option>
                        <option>카카오샵</option>
                        <option>외부영업</option>
                        <option>지인</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button className="px-3 py-1.5 border rounded-full bg-white hover:bg-gray-50 mr-2" onClick={(e)=> { e.preventDefault(); e.stopPropagation(); openEdit(q); }}>수정</button>
                      {isAdmin && (
                        <button className="px-3 py-1.5 border rounded-full bg-white hover:bg-gray-50" onClick={(e)=> { e.preventDefault(); e.stopPropagation(); deleteInquiry(q.id); }}>삭제</button>
                      )}
                    </td>
                  </tr>
                  {expandedIds.has(q.id) && (
                    <tr key={`${q.id}-detail`}>
                      <td className="px-4 py-3 bg-gray-50" colSpan={9}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div><span className="text-gray-500">이름</span>: {q.name || '-'}</div>
                          <div><span className="text-gray-500">연락처</span>: {q.contact || '-'}</div>
                          <div><span className="text-gray-500">종류</span>: {q.inquiry_kind || '-'}</div>
                          <div><span className="text-gray-500">수량</span>: {q.quantity ?? '-'}</div>
                          <div><span className="text-gray-500">구분</span>: {q.source || '-'}</div>
                          <div><span className="text-gray-500">담당자</span>: {profiles.find(p=> p.id === q.assignee)?.display_name || (q.assignee ? q.assignee.slice(0,6) : '미지정')}</div>
                          <div className="md:col-span-3"><span className="text-gray-500">메모</span>: {q.admin_notes || '-'}</div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 w-full max-w-lg space-y-2">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold">문의 수정</h3>
              <button className="px-2 py-1 border rounded" onClick={()=> setEditing(null)}>닫기</button>
            </div>
            <label className="block text-sm">이름</label>
            <input className="w-full border rounded px-2 py-1 text-sm" value={(editForm.name as string) ?? ''} onChange={(e)=> setEditForm(f=> ({...f, name: e.target.value}))} />
            <label className="block text-sm">연락처</label>
            <input className="w-full border rounded px-2 py-1 text-sm" value={(editForm.contact as string) ?? ''} onChange={(e)=> setEditForm(f=> ({...f, contact: e.target.value}))} />
            <label className="block text-sm">종류</label>
            <select className="w-full border rounded px-2 py-1 text-sm" value={(editForm.inquiry_kind as string) ?? ''} onChange={(e)=> setEditForm(f=> ({...f, inquiry_kind: e.target.value}))}>
              <option value="">-</option>
              {kindOptions.map((k)=> (
                <option key={String(k)} value={String(k)}>{String(k)}</option>
              ))}
            </select>
            <label className="block text-sm">수량</label>
            <input type="number" className="w-full border rounded px-2 py-1 text-sm" value={Number(editForm.quantity ?? 0)} onChange={(e)=> setEditForm(f=> ({...f, quantity: Number(e.target.value)}))} />
            <label className="block text-sm">상태</label>
            <select className="border rounded px-2 py-1" value={editForm.status as string} onChange={(e)=> setEditForm(f=> ({...f, status: e.target.value}))}>
              <option value="new">미답변</option>
              <option value="in_progress">진행중</option>
              <option value="answered">답변완료</option>
              <option value="closed">종료</option>
            </select>
            <label className="block text-sm">담당자</label>
            <select className="border rounded px-2 py-1" value={editForm.assignee ?? ''} onChange={(e)=> setEditForm(f=> ({...f, assignee: e.target.value || null}))}>
              <option value="">미지정</option>
              {profiles.map((p)=> (<option key={p.id} value={p.id}>{p.display_name || p.id.slice(0,6)}</option>))}
            </select>
            <label className="block text-sm">관리자 메모</label>
            <textarea className="w-full border rounded px-2 py-1 text-sm" rows={4} value={(editForm.admin_notes as string) ?? ''} onChange={(e)=> setEditForm(f=> ({...f, admin_notes: e.target.value}))} />
            <div className="flex justify-end gap-2 pt-2">
              <button className="px-3 py-2 border rounded" onClick={()=> setEditing(null)}>취소</button>
              <button className="px-3 py-2 border rounded bg-black text-white" onClick={saveEdit}>저장</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

type ManualRow = { name?: string; contact?: string; inquiry_kind?: string; quantity?: number; source?: string; assignee?: string|null };
function ManualCreate({ onCreated, profiles, kinds }: { onCreated: (row: ManualRow)=> void; profiles: Profile[]; kinds: string[] }) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [inquiryKind, setInquiryKind] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [source, setSource] = useState<string>('');
  const [assignee, setAssignee] = useState<string>('');
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true);
    const payload = {
      session_id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36),
      name: name || null,
      contact: contact || null,
      inquiry_kind: inquiryKind || null,
      quantity: quantity === '' ? null : Number(quantity),
      source: source || null,
      assignee: assignee || null,
      status: 'new'
    };
    const { data, error } = await supabase.from('inquiries').insert(payload).select('id, created_at, status, name, contact, inquiry_kind, quantity, assignee, admin_notes, source').single();
    setSaving(false);
    if (!error && data) {
      onCreated(data);
      setName(''); setContact(''); setInquiryKind(''); setQuantity(''); setSource(''); setAssignee('');
      alert('생성되었습니다.');
    } else {
      alert(error?.message || '오류');
    }
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-end">
      <div>
        <label className="block text-xs text-gray-500">이름</label>
        <input className="w-full border rounded px-2 py-1" value={name} onChange={(e)=> setName(e.target.value)} />
      </div>
      <div>
        <label className="block text-xs text-gray-500">연락처</label>
        <input className="w-full border rounded px-2 py-1" value={contact} onChange={(e)=> setContact(e.target.value)} />
      </div>
      <div>
        <label className="block text-xs text-gray-500">종류</label>
        <select className="w-full border rounded px-2 py-1" value={inquiryKind} onChange={(e)=> setInquiryKind(e.target.value)}>
          <option value="">-</option>
          {kinds.map((k)=> (<option key={k} value={k}>{k}</option>))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500">수량</label>
        <input type="number" className="w-full border rounded px-2 py-1" value={quantity} onChange={(e)=> setQuantity(e.target.value === '' ? '' : Number(e.target.value))} />
      </div>
      <div>
        <label className="block text-xs text-gray-500">구분</label>
        <select className="w-full border rounded px-2 py-1" value={source} onChange={(e)=> setSource(e.target.value)}>
          <option value="">-</option>
          <option>네이버 스마트스토어</option>
          <option>카카오톡채널</option>
          <option>카카오샵</option>
          <option>외부영업</option>
          <option>지인</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500">담당자</label>
        <select className="w-full border rounded px-2 py-1" value={assignee} onChange={(e)=> setAssignee(e.target.value)}>
          <option value="">미지정</option>
          {profiles.map((p)=> (<option key={p.id} value={p.id}>{p.display_name || p.id.slice(0,6)}</option>))}
        </select>
      </div>
      <div className="md:col-span-2">
        <button disabled={saving} onClick={save} className="px-3 py-2 border rounded">생성</button>
      </div>
    </div>
  );
}

