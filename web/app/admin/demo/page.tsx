"use client";
import { useMemo, useState, Fragment } from "react";
import { format, subDays } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend, RadarChart, PolarGrid, PolarAngleAxis, Radar, RadialBarChart, RadialBar
} from 'recharts';

type Profile = { id: string; name: string; role: "admin" | "agent" };
type Inquiry = {
  id: string; created_at: string; status: "new"|"in_progress"|"answered"|"closed";
  name?: string; contact?: string; inquiry_kind?: string; quantity?: number|null;
  assignee?: string|null; source?: string|null; admin_notes?: string|null;
};
type Review = { id: string; title: string; rating: number; author_name?: string|null; view_count?: number; content: string; images?: string[] };
type SalesRecord = { id: string; date: string; group_name: string; channel: string; owner: string; amount: number };
type ExpenseRecord = { id: string; date: string; category: '광고비'|'영업비'|'원가-발주'|'원가-인쇄'|'배송'|'기타'; amount: number };
type WorkItemStatus = 'counsel'|'progress'|'design'|'purchase'|'production'|'shipping';
type WorkItem = {
  id: string;
  orderNo: string;
  title: string; // 간단 요약(그룹/학교명 등)
  customer: string;
  amount: number;
  due: string; // yyyy-MM-dd
  channel: string;
  memo?: string;
  status: WorkItemStatus;
  assigneeId?: string; // agent/admin id
  notes?: { id: string; authorId: string; text: string; created_at: string; pinned?: boolean }[];
};

type FieldSalesStatus = 'plan'|'visited'|'proceed'|'hold'|'rejected'|'pending';
type FieldSalesItem = {
  id: string;
  bizName: string;
  category: string; // 업종/카테고리
  address: string;
  visitPlanned: string; // yyyy-MM-dd
  outcome?: '보류'|'거절'|'진행'|'대기';
  visited?: boolean;
  memo?: string;
  status: FieldSalesStatus;
  assigneeId?: string;
  notes?: { id: string; authorId: string; text: string; created_at: string; pinned?: boolean }[];
};

type MarketingStatus = 'plan'|'shoot'|'edit'|'upload';
type MarketingItem = {
  id: string;
  category: string; // 콘텐츠 카테고리
  format: string; // 영상형식
  topic: string; // 주제
  reference?: string; // 레퍼런스 링크/설명
  editState?: string; // 편집 상태
  uploadState?: string; // 업로드 상태
  uploadLink?: string; // 링크
  status: MarketingStatus;
  assigneeId?: string;
  notes?: { id: string; authorId: string; text: string; created_at: string; pinned?: boolean }[];
};

const profiles: Profile[] = [
  { id: "u1", name: "김현준", role: "admin" },
  { id: "u2", name: "이수빈", role: "agent" },
  { id: "u3", name: "박도윤", role: "agent" },
];

const inquiriesSeed: Inquiry[] = [
  { id: "q1", created_at: new Date().toISOString(), status: "new", name: "홍길동", contact: "010-1234-5678", inquiry_kind: "단체복", quantity: 30, assignee: "u2", source: "카카오톡채널" },
  { id: "q2", created_at: new Date(Date.now()-3600_000*3).toISOString(), status: "in_progress", name: "강나래", contact: "", inquiry_kind: "커스텀 소량 굿즈", quantity: 10, assignee: null, source: "외부영업" },
  { id: "q3", created_at: new Date(Date.now()-3600_000*6).toISOString(), status: "new", name: "이서연", contact: "naver@ex.com", inquiry_kind: "단체복", quantity: 15, assignee: "u3", source: "네이버 스마트스토어" },
  { id: "q4", created_at: new Date(Date.now()-3600_000*24).toISOString(), status: "answered", name: "김도훈", contact: "", inquiry_kind: "단체복", quantity: 40, assignee: "u2", source: "지인" },
];

const reviewsSeed: Review[] = [
  { id: "r1", title: "만족스러운 퀄리티", rating: 5, author_name: "익명", view_count: 123, content: "원단이 좋아요. 배송도 빨랐습니다.", images: [] },
  { id: "r2", title: "납기 준수 최고", rating: 4, author_name: "박**", view_count: 56, content: "급했는데 일정 잘 맞춰주셨어요.", images: [] },
  { id: "r3", title: "친절한 상담", rating: 5, author_name: "이**", view_count: 78, content: "상담 과정이 친절했습니다.", images: [] },
];

export default function DemoAdminPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>(inquiriesSeed);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [reviews] = useState<Review[]>(reviewsSeed);
  const [manualOpen, setManualOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview'|'sales'|'finance'|'goals'|'operations'|'tasks'|'channels'|'manager'|'admin'>('overview');
  const [period, setPeriod] = useState<'7d'|'30d'|'90d'>('30d');
  
  const [detailModal, setDetailModal] = useState<null | { kind: 'work'|'field'|'marketing'; item: WorkItem | FieldSalesItem | MarketingItem }>(null);
  const [taskAssigneeFilter, setTaskAssigneeFilter] = useState<string>('');
  const [taskQuery, setTaskQuery] = useState<string>('');
  const [workItems, setWorkItems] = useState<WorkItem[]>(() => {
    const today = new Date();
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return [
      { id:'w1', orderNo:'ORD-2025-0001', title:'A중학교 체육복', customer:'A중학교', amount: 3200000, due: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate()+3)), channel:'카카오', status:'counsel', memo:'사이즈 표 수집 중', assigneeId:'u2', notes:[{id:'n1', authorId:'u2', text:'초기 상담 완료', created_at:new Date().toISOString()}] },
      { id:'w2', orderNo:'ORD-2025-0002', title:'B기업 단체티', customer:'B기업', amount: 5500000, due: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate()+7)), channel:'네이버', status:'progress', memo:'수량 확정 대기', assigneeId:'u3' },
      { id:'w3', orderNo:'ORD-2025-0003', title:'C병원 조끼', customer:'C병원', amount: 1800000, due: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate()+10)), channel:'외부영업', status:'design', memo:'로고 위치 시안 전달' },
      { id:'w4', orderNo:'ORD-2025-0004', title:'D동호회 야구복', customer:'D동호회', amount: 2700000, due: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate()+12)), channel:'지인', status:'purchase', memo:'원단 발주 완료' },
      { id:'w5', orderNo:'ORD-2025-0005', title:'E고등학교 반티', customer:'E고등학교', amount: 4200000, due: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate()+5)), channel:'카카오', status:'production', memo:'전사 인쇄 진행중' },
      { id:'w6', orderNo:'ORD-2025-0006', title:'F기업 후드', customer:'F기업', amount: 3600000, due: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate()+2)), channel:'네이버', status:'shipping', memo:'송장 발행 예정' },
    ];
  });
  const [dragId, setDragId] = useState<string | null>(null);
  const [fieldItems, setFieldItems] = useState<FieldSalesItem[]>(() => {
    const today = new Date();
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return [
      { id:'fs1', bizName:'한빛중학교', category:'교육', address:'서울 강남구 ...', visitPlanned: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate()+2)), status:'plan', memo:'체육복 리뉴얼 제안', assigneeId:'u2', notes:[{id:'n2', authorId:'u2', text:'방문 일정 협의 중', created_at:new Date().toISOString()}] },
      { id:'fs2', bizName:'미소요양병원', category:'의료', address:'경기 성남시 ...', visitPlanned: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate()+4)), status:'plan' },
      { id:'fs3', bizName:'백두물류', category:'물류', address:'인천 남동구 ...', visitPlanned: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate()-1)), visited:true, outcome:'진행', status:'proceed' },
      { id:'fs4', bizName:'참좋은치킨', category:'외식', address:'수원 장안구 ...', visitPlanned: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate()-2)), visited:true, outcome:'보류', status:'hold' },
    ];
  });
  const [marketingItems, setMarketingItems] = useState<MarketingItem[]>(() => ([
    { id:'m1', category:'브랜드', format:'Shorts', topic:'제작 현장 비하인드', reference:'유튜브 A 채널 스타일', status:'plan' },
    { id:'m2', category:'노하우', format:'Reels', topic:'단체복 사이즈 가이드', reference:'블로그 글 요약', status:'shoot' },
    { id:'m3', category:'고객사례', format:'YouTube', topic:'학교 납품 브이로그', editState:'컷편집 70%', status:'edit' },
    { id:'m4', category:'프로모션', format:'Shorts', topic:'봄맞이 단체복 할인', uploadState:'예약 업로드', uploadLink:'https://example.com', status:'upload' },
  ]));
  const [salesData] = useState<SalesRecord[]>(() => {
    const owners = ['김매니저','이매니저','최매니저'];
    const channels = ['카카오','네이버','외부영업','지인'];
    const arr: SalesRecord[] = [];
    const days = 90;
    for (let i=0;i<days;i++) {
      const d = new Date(); d.setDate(d.getDate()-i);
      const num = Math.floor(2+Math.random()*5);
      for (let j=0;j<num;j++) {
        arr.push({
          id: `s${i}-${j}`,
          date: d.toISOString(),
          group_name: `그룹 ${(i%12)+1}`,
          channel: channels[(i+j)%channels.length],
          owner: owners[(i+2*j)%owners.length],
          amount: Math.round(50 + Math.random()*200)*10000,
        });
      }
    }
    return arr;
  });
  const [expenseData] = useState<ExpenseRecord[]>(() => {
    const cats: ExpenseRecord['category'][] = ['광고비','영업비','원가-발주','원가-인쇄','배송','기타'];
    const arr: ExpenseRecord[] = [];
    const days = 90;
    for (let i=0;i<days;i++) {
      const d = new Date(); d.setDate(d.getDate()-i);
      for (const c of cats) {
        const base = c.includes('원가') ? 120 : c==='광고비' ? 60 : 30;
        if (Math.random() < 0.6) continue;
        arr.push({ id:`e${i}-${c}`, date:d.toISOString(), category:c, amount: Math.round((base + Math.random()*80))*10000 });
      }
    }
    return arr;
  });

  const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const fromDate = useMemo(()=> subDays(new Date(), periodDays-1), [periodDays]);
  const filteredSales = useMemo(() => salesData.filter(s => new Date(s.date) >= fromDate), [salesData, fromDate]);
  const filteredExpenses = useMemo(() => expenseData.filter(e => new Date(e.date) >= fromDate), [expenseData, fromDate]);

  const stats = useMemo(() => {
    const total = inquiries.length;
    const newCount = inquiries.filter(i => i.status === "new").length;
    const unassigned = inquiries.filter(i => !i.assignee).length;
    const myPending = inquiries.filter(i => i.assignee === "u1" && (i.status === 'new' || i.status === 'in_progress')).length;
    return { total, newCount, unassigned, myPending };
  }, [inquiries]);

  const agentCounts = useMemo(() => {
    const byId: Record<string, { name: string; total: number; pending: number }> = {};
    for (const p of profiles) byId[p.id] = { name: p.name, total: 0, pending: 0 };
    for (const i of inquiries) {
      if (!i.assignee) continue;
      byId[i.assignee].total += 1;
      if (i.status === 'new' || i.status === 'in_progress') byId[i.assignee].pending += 1;
    }
    return Object.entries(byId).map(([id, v]) => ({ id, ...v })).sort((a,b)=> b.pending - a.pending);
  }, [inquiries]);

  const needReply = useMemo(() => (
    inquiries.filter(i => i.status === 'new').slice(0,8)
  ), [inquiries]);

  const toggleExpand = (id: string) => setExpandedIds(prev=>{ const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });

  return (
    <main className="w-full p-0 lg:p-0">
      {/* Left Sidebar + Content */}
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col bg-white/80 backdrop-blur" style={{ borderRight:'1px solid #EEF2F6' }}>
          <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom:'1px solid #EEF2F6' }}>
            <div className="w-8 h-8 rounded-full" style={{ background:'#0052cc' }} />
            <div className="font-semibold">모두의 유니폼</div>
          </div>
          <nav className="px-2 py-4 space-y-1 text-sm">
            {[
              {k:'overview',t:'개요'},
              {k:'sales',t:'판매'},
              {k:'finance',t:'재무/회계'},
              {k:'goals',t:'목표/성과'},
              {k:'operations',t:'업무'},
              {k:'tasks',t:'할 일'},
              {k:'channels',t:'채널 인사이트'},
              {k:'manager',t:'매니저 센터'},
              {k:'admin',t:'Admin'},
            ].map(it=> (
              <button
                key={it.k}
                onClick={()=> setActiveTab(it.k as typeof activeTab)}
                className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${activeTab===it.k? 'text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                style={activeTab===it.k? { background:'linear-gradient(135deg,#0052cc,#00c2ff)' } : {}}
              >
                {it.t}
              </button>
            ))}
          </nav>
          <div className="mt-auto px-4 py-3 text-xs text-gray-500" style={{ borderTop:'1px solid #EEF2F6' }}>Demo UI</div>
        </aside>
        {/* Content */}
        <div className="flex-1 min-w-0" style={{ background:'#f8f9fb' }}>

      {/* Global Filter Bar (dummy) */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-3 bg-white/70 backdrop-blur sticky top-0 z-20" style={{ borderBottom:'1px solid #EEF2F6' }}>
          <div className="flex flex-wrap items-center gap-2 text-sm">
          <div className="flex items-end gap-2">
            <label className="text-xs text-gray-500">기간</label>
            <div className="flex rounded-lg border overflow-hidden">
              {[
                {k:'7d',t:'최근 7일'},
                {k:'30d',t:'최근 30일'},
                {k:'90d',t:'최근 90일'},
              ].map(it=> (
                <button key={it.k} onClick={()=> setPeriod(it.k as typeof period)} className={`px-3 py-2 text-sm ${period===it.k? 'text-white' : 'bg-white hover:bg-gray-50'}`} style={period===it.k? { background:'#0052cc' } : {}}>{it.t}</button>
              ))}
            </div>
          </div>
            <Select label="보기" options={["전체","담당자별","채널별"]} />
            <Select label="비교" options={["전주 대비","전월 대비","전년 동기"]} />
          <button className="ml-auto px-3 py-2 rounded-full text-sm border bg-white hover:bg-gray-50">Demo 모드</button>
        </div>
      </div>

      {activeTab==='overview' && (
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-6 space-y-6">
          <section className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg,#0052cc,#00c2ff)' }}>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-white">
              <Widget title="주간 매출(더미)" value={'₩ 8,430,000'} />
              <Widget title="월간 매출(더미)" value={'₩ 23,150,000'} />
              <Widget title="월간 순이익(더미)" value={'₩ 10,560,000'} />
              <Widget title="채널 인입 비중(Top)" value={'카카오 40%'} />
              <Widget title="할 일 진행률(더미)" value={'64%'} />
              <Widget title="지출 변화(더미)" value={'-12% MoM'} />
            </div>
          </section>

           <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card title="매출/지출/순이익 (dummy line)" span={2}>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={Array.from({length:12},(_,i)=> ({
                    m: `${i+1}월`, rev: [12,10,14,16,13,17,20,19,21,23,22,24][i],
                    exp: [8,7,9,10,9,11,12,13,12,13,12,14][i], prof: [4,3,5,6,4,6,8,6,9,10,10,10][i]
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="m" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="rev" name="매출" stroke="#0052cc" strokeWidth={2} />
                    <Line type="monotone" dataKey="exp" name="지출" stroke="#ef4444" strokeWidth={2} />
                    <Line type="monotone" dataKey="prof" name="순이익" stroke="#12b76a" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card title="P&L 워터폴(요약) → 상세는 재무/회계 탭">
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    {name:'매출', v:2400}, {name:'원가-발주', v:-900}, {name:'원가-인쇄', v:-350}, {name:'영업비', v:-250}, {name:'광고비', v:-300}, {name:'배송/기타', v:-200}, {name:'순이익', v:400}
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="v" name="흐름" fill="#93c5fd" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card title="채널 인입 비중">
              <div className="w-full h-64 flex items-center">
                <ResponsiveContainer width="50%" height="100%">
                  <PieChart>
                    <Pie data={[
                      {name:'카카오', value:40, color:'#0052cc'},
                      {name:'네이버', value:25, color:'#00c2ff'},
                      {name:'외부영업', value:20, color:'#12b76a'},
                      {name:'지인', value:15, color:'#f79009'},
                    ]} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                      {[ '#0052cc','#00c2ff','#12b76a','#f79009' ].map((c,i)=> (<Cell key={i} fill={c}/>))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-xs text-gray-600 ml-4">
                  {['카카오','네이버','외부영업','지인'].map((t,i)=> (
                    <div key={i} className="flex items-center gap-2 mb-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background:['#0052cc','#00c2ff','#12b76a','#f79009'][i] }} />{t}</div>
                  ))}
                </div>
              </div>
            </Card>
          </section>

           <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card title="담당자/채널 리그(더미)" span={2}>
              <League rows={[
                {name:'김매니저', metric:'+18%'},
                {name:'네이버 스마트스토어', metric:'+12%'},
                {name:'카카오톡채널', metric:'+9%'}
              ]} />
            </Card>
            <Card title="P&L(카테고리 분해)">
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    {name:'원가-발주', v:900}, {name:'원가-인쇄', v:350}, {name:'영업비', v:250}, {name:'광고비', v:300}, {name:'배송', v:120}, {name:'기타', v:80}
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="v" name="비용" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card title="퍼널 미니뷰(더미)">
              <div className="text-sm space-y-2">
                {[['New',1200,'#e5e7eb'],['Contacted',800,'#93c5fd'],['Quoted',420,'#60a5fa'],['Won',210,'#12b76a'],['Lost',120,'#ef4444']].map(([k,v,c],i)=> (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-24 text-gray-600">{k as string}</div>
                    <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden"><div className="h-3" style={{ width:`${(v as number)/12}%`, background:c as string }} /></div>
                    <div className="w-12 text-right">{v as number}</div>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        </div>
      )}

      {activeTab==='admin' && (
        <section className="max-w-[1400px] mx-auto px-6 lg:px-8 py-6 space-y-6">
          <Card title="계정 생성(데모 레이아웃)">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <Input label="이메일" placeholder="manager@example.com" />
              <Input label="이름" placeholder="김매니저" />
              <Select label="역할" options={["agent","admin"]} />
              <div className="md:col-span-3"><button className="px-3 py-2 rounded-full text-sm" style={{ background:'#0052cc', color:'#fff' }}>계정 생성</button></div>
            </div>
          </Card>
          <Card title="탭 접근 권한 설정(데모 레이아웃)">
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="px-3 py-2">사용자</th>
                    {['개요','판매','재무/회계','목표/성과','업무','할 일','채널','매니저','Admin'].map((t,i)=> (
                      <th key={i} className="px-3 py-2">{t}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[{id:'u2',name:'이수빈'},{id:'u3',name:'박도윤'},{id:'u1',name:'김현준(admin)'}].map(u=> (
                    <tr key={u.id} className="border-t">
                      <td className="px-3 py-2">{u.name}</td>
                      {Array.from({length:9}).map((_,i)=> (
                        <td key={i} className="px-3 py-2"><input type="checkbox" defaultChecked={i<6} /></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      )}

       {activeTab==='sales' && (
         <section className="max-w-[1400px] mx-auto px-6 lg:px-8 py-6 space-y-6">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <Card title={`월별 목표 달성률(부서별) · ${period==='7d'?'7일':period==='30d'?'30일':'90일'}`} span={2}>
               <div className="w-full h-72">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={[
                     {dept:'영업1', target:100, done:76},
                     {dept:'영업2', target:100, done:112},
                     {dept:'영업3', target:100, done:96},
                   ]}>
                     <CartesianGrid strokeDasharray="3 3" />
                     <XAxis dataKey="dept" />
                     <YAxis />
                     <Tooltip />
                     <Legend />
                     <Bar dataKey="target" name="목표(%)" fill="#e5e7eb" />
                     <Bar dataKey="done" name="달성(%)" fill="#0052cc" />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
             </Card>
             <Card title="순이익 목표 달성률">
               <div className="w-full h-72 flex items-center justify-center">
                 <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart innerRadius="60%" outerRadius="100%" data={[{name:'달성', value:83, fill:'#12b76a'}]} startAngle={90} endAngle={-270}>
                      <RadialBar background dataKey="value" />
                     <Tooltip />
                   </RadialBarChart>
                 </ResponsiveContainer>
               </div>
               <div className="text-center text-3xl font-semibold" style={{ color:'#12b76a' }}>83%</div>
             </Card>
           </div>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <Card title={`지역별 목표/실적/완료율 · ${period==='7d'?'7일':'30/90일 요약'}`}>
               <div className="w-full h-72">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={[
                     {name:'수도권', mTarget:900, mDone:680, rate: 75},
                     {name:'영남', mTarget:600, mDone:540, rate: 90},
                     {name:'호남', mTarget:400, mDone:260, rate: 65},
                     {name:'충청', mTarget:300, mDone:210, rate: 70},
                   ]}>
                     <CartesianGrid strokeDasharray="3 3" />
                     <XAxis dataKey="name" />
                     <YAxis yAxisId="left" />
                     <YAxis yAxisId="right" orientation="right" />
                     <Tooltip />
                     <Legend />
                     <Bar yAxisId="left" dataKey="mTarget" name="월 목표" fill="#c7d2fe" />
                     <Bar yAxisId="left" dataKey="mDone" name="월 실적" fill="#60a5fa" />
                     <Line yAxisId="right" type="monotone" dataKey="rate" name="완료율(%)" stroke="#22c55e" />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
             </Card>
             <Card title="업종별 매출 구성">
               <div className="w-full h-72">
                 <ResponsiveContainer width="100%" height="100%">
                   <RadarChart data={[
                     {k:'학교', v:120}, {k:'기업', v:150}, {k:'동호회', v:80}, {k:'병원', v:60}, {k:'기타', v:40}
                   ]}>
                     <PolarGrid />
                     <PolarAngleAxis dataKey="k" />
                     <Radar dataKey="v" name="매출" stroke="#00c2ff" fill="#00c2ff" fillOpacity={0.3} />
                   </RadarChart>
                 </ResponsiveContainer>
               </div>
             </Card>
           </div>
         </section>
       )}

       {activeTab==='finance' && (
         <section className="max-w-[1400px] mx-auto px-6 lg:px-8 py-6 space-y-6">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <Card title="지출 입력(더미)">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                 <Input label="날짜" placeholder={format(new Date(), 'yyyy-MM-dd')} />
                 <Select label="분류" options={["광고비","영업비","원가-발주","원가-인쇄","배송","기타"]} />
                 <Input label="금액" placeholder="₩ 1,000,000" />
                 <Input label="메모" placeholder="" />
                 <div className="md:col-span-2"><button className="px-3 py-2 rounded-full text-sm" style={{ background:'#0052cc', color:'#fff' }}>추가</button></div>
               </div>
             </Card>
             <Card title={`카테고리별 지출 비중 · ${period==='7d'?'7일':'30/90일'}`}>
               <div className="w-full h-72">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={(()=>{
                       const byCat: Record<string, number> = {};
                       for (const e of filteredExpenses) byCat[e.category] = (byCat[e.category]||0)+e.amount;
                       const total = Object.values(byCat).reduce((a,b)=>a+b,0)||1;
                       return Object.entries(byCat).map(([name,value],i)=> ({ name, value: Math.round(value/total*100), c:['#93c5fd','#60a5fa','#34d399','#fbbf24','#f87171','#a78bfa'][i%6] }));
                     })()} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                       {['#93c5fd','#60a5fa','#34d399','#fbbf24','#f87171','#a78bfa'].map((c,i)=> (<Cell key={i} fill={c}/>))}
                     </Pie>
                     <Tooltip />
                   </PieChart>
                 </ResponsiveContainer>
               </div>
             </Card>
             <Card title="마진율(더미)">
               <div className="text-4xl font-semibold" style={{ color:'#12b76a' }}>36.2%</div>
               <div className="text-xs text-gray-500 mt-1">전월 대비 +2.1pp</div>
             </Card>
           </div>
           <Card title="월별 지출(카테고리 스택)" span={2}>
             <div className="w-full h-80">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={Array.from({length:12},(_,i)=> ({
                   m:`${i+1}월`, ad:[12,14,10,8,16,20,15,18,10,12,13,14][i], ops:[8,7,9,10,9,12,12,10,9,8,9,10][i], cogsPo:[20,23,21,19,18,22,24,20,19,18,20,21][i], cogsPrint:[9,8,10,11,9,10,12,11,10,9,8,9][i], ship:[6,7,5,6,7,6,8,7,6,5,6,7][i], misc:[4,3,2,3,3,2,4,3,2,3,3,2][i]
                 }))}>
                   <CartesianGrid strokeDasharray="3 3" />
                   <XAxis dataKey="m" />
                   <YAxis />
                   <Tooltip />
                   <Legend />
                   <Bar dataKey="cogsPo" stackId="a" name="원가-발주" fill="#93c5fd" />
                   <Bar dataKey="cogsPrint" stackId="a" name="원가-인쇄" fill="#60a5fa" />
                   <Bar dataKey="ops" stackId="a" name="영업비" fill="#34d399" />
                   <Bar dataKey="ad" stackId="a" name="광고비" fill="#fbbf24" />
                   <Bar dataKey="ship" stackId="a" name="배송" fill="#f87171" />
                   <Bar dataKey="misc" stackId="a" name="기타" fill="#a78bfa" />
                 </BarChart>
               </ResponsiveContainer>
             </div>
           </Card>
         </section>
       )}
       {activeTab==='operations' && (
      <>
      <section className="max-w-[1400px] mx-auto px-6 lg:px-8 py-6">
          <div className="flex flex-wrap gap-2">
          {agentCounts.map(a => (
              <div key={a.id} className="px-3 py-2 rounded-full text-sm" style={{ background:'#F1F5FB', color:'#0F172A' }}>
              <span className="font-medium mr-2" style={{ color: '#0052cc' }}>{a.name}</span>
              <span className="text-gray-600">총 {a.total}건</span>
              <span className="mx-1 text-gray-300">|</span>
              <span className="text-gray-600">대기 {a.pending}건</span>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-[1400px] mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border rounded-xl bg-white shadow-sm">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h3 className="font-semibold">문의</h3>
            <button className="px-3 py-2 rounded-full text-sm border bg-white hover:bg-gray-50">CSV 내보내기</button>
          </div>
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">날짜</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">상태</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">이름</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">종류</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">담당</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">구분</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map(q => (
                <Fragment key={q.id}>
                  <tr className="border-t hover:bg-gray-50 align-top">
                    <td className="px-4 py-3">
                      <button className="mr-2 px-2 py-0.5 border rounded-full text-xs bg-white hover:bg-gray-50" onClick={()=> toggleExpand(q.id)}>{expandedIds.has(q.id) ? '접기' : '펼치기'}</button>
                      {new Date(q.created_at).toLocaleString('ko-KR')}
                    </td>
                    <td className="px-4 py-3">{statusBadge(q.status)}</td>
                    <td className="px-4 py-3">{q.name || '-'}</td>
                    <td className="px-4 py-3">{q.inquiry_kind || '-'}</td>
                    <td className="px-4 py-3">{profiles.find(p=> p.id===q.assignee)?.name || '미지정'}</td>
                    <td className="px-4 py-3">{q.source || '-'}</td>
                  </tr>
                  {expandedIds.has(q.id) && (
                    <tr>
                      <td className="px-4 py-3 bg-gray-50" colSpan={6}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div><span className="text-gray-500">연락처</span>: {q.contact || '-'}</div>
                          <div><span className="text-gray-500">수량</span>: {q.quantity ?? '-'}</div>
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
        <div className="border rounded-xl bg-white shadow-sm">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h3 className="font-semibold">지금 답변해야 할 문의</h3>
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
        </div>
      </section>
      </>
      )}

       {activeTab==='goals' && (
         <section className="max-w-[1400px] mx-auto px-6 lg:px-8 py-6 space-y-6">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <Card title="목표 설정(더미)">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                 <Input label="기간" placeholder="2025-01 ~ 2025-03" />
                 <Input label="매출 목표" placeholder="₩ 300,000,000" />
                 <Input label="순익 목표" placeholder="₩ 120,000,000" />
                 <Select label="대상" options={["전체","영업1","영업2","영업3"]} />
                 <div className="md:col-span-2"><button className="px-3 py-2 rounded-full text-sm" style={{ background:'#0052cc', color:'#fff' }}>적용</button></div>
               </div>
             </Card>
             <Card title="목표 대비 달성률">
               <div className="w-full h-72 flex items-center justify-center">
                 <ResponsiveContainer width="100%" height="100%">
                   <RadialBarChart innerRadius="60%" outerRadius="100%" data={[{name:'달성', value:75, fill:'#12b76a'}]} startAngle={90} endAngle={-270}>
                     <RadialBar background dataKey="value" />
                     <Tooltip />
                   </RadialBarChart>
                 </ResponsiveContainer>
               </div>
               <div className="text-center text-3xl font-semibold" style={{ color:'#12b76a' }}>75%</div>
             </Card>
             <Card title="전환 퍼널(더미)">
               <div className="text-sm space-y-2">
                 {[['New',1200],['Contacted',800],['Quoted',420],['Won',210]].map(([k,v],i)=> (
                   <div key={i} className="flex items-center gap-3">
                     <div className="w-24 text-gray-600">{k as string}</div>
                     <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden"><div className="h-3" style={{ width:`${(v as number)/12}%`, background:'#60a5fa' }} /></div>
                     <div className="w-12 text-right">{v as number}</div>
                   </div>
                 ))}
               </div>
             </Card>
           </div>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <Card title="개인/팀 리그(더미)">
               <League rows={[
                 {name:'영업1', metric:'92.3%'},
                 {name:'영업2', metric:'88.1%'},
                 {name:'영업3', metric:'79.4%'}
               ]} />
             </Card>
             <Card title="추세(목표/실적/예측)">
               <div className="w-full h-72">
                 <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={Array.from({length:12},(_,i)=> ({
                     m:`${i+1}월`, target:[50,60,70,80,90,100,110,120,130,140,150,160][i], actual:[45,58,65,84,88,95,108,112,120,136,142,155][i]
                   }))}>
                     <CartesianGrid strokeDasharray="3 3" />
                     <XAxis dataKey="m" />
                     <YAxis />
                     <Tooltip />
                     <Legend />
                     <Line type="monotone" dataKey="target" name="목표" stroke="#9ca3af" />
                     <Line type="monotone" dataKey="actual" name="실적" stroke="#0052cc" />
                   </LineChart>
                 </ResponsiveContainer>
               </div>
             </Card>
           </div>
         </section>
       )}

       {activeTab==='channels' && (
      <section className="max-w-[1400px] mx-auto px-6 lg:px-8 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold" style={{ color: '#0052cc' }}>채널/오디언스 & 매출/비용 인사이트(더미)</h3>
          <button className="px-3 py-2 rounded-full text-sm border bg-white hover:bg-gray-50">공개 페이지 열기</button>
        </div>

        {/* Audience KPI 6종 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiTile label="자사몰 방문자" value="12,341" tone="#E8F1FF" />
          <KpiTile label="블로그 이웃" value="1,982" tone="#F0F9FF" />
          <KpiTile label="인스타 팔로워" value="8,754" tone="#F3FDF6" />
          <KpiTile label="유튜브 구독자" value="5,102" tone="#F8F3FF" />
          <KpiTile label="스마트스토어 좋아요" value="3,440" tone="#FFF7ED" />
          <KpiTile label="카카오 채널 친구" value="9,221" tone="#F1F5FB" />
        </div>

        {/* Revenue vs Expense */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="채널별 매출 비교(최근 6개월)">
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Array.from({length:6},(_,i)=>({
                  m:`${i+1}월`, mall:[52,58,61,65,71,75][i], smart:[40,46,49,55,60,66][i], cash:[14,12,16,13,18,15][i]
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="m" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="mall" name="자사몰" fill="#60a5fa" />
                  <Bar dataKey="smart" name="네이버 스마트스토어" fill="#34d399" />
                  <Bar dataKey="cash" name="현금" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card title="비용 분해(최근 6개월 합계)">
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  {name:'발주비용', v:320},
                  {name:'제조비용', v:260},
                  {name:'운송비용', v:120},
                  {name:'광고비용', v:180},
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="v" name="금액(더미)" fill="#93c5fd" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* 콘텐츠 섹션 유지 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-2xl p-3 bg-white hover:bg-gray-50" style={{ border:'1px solid #EEF2F6', boxShadow:'0 1px 2px rgba(16,24,40,0.04)'}}>
            <div className="font-medium mb-2">채널 KPI(최근 30일 예시)</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Widget title="도달(더미)" value={'73,518'} />
              <Widget title="클릭(더미)" value={'21,312'} />
              <Widget title="반송(더미)" value={'7,816'} />
              <Widget title="컴플레인(더미)" value={'5,010'} />
            </div>
          </div>
          <div className="rounded-2xl p-3 bg-white hover:bg-gray-50" style={{ border:'1px solid #EEF2F6', boxShadow:'0 1px 2px rgba(16,24,40,0.04)'}}>
            <div className="font-medium mb-2">콘텐츠 Top 6(더미)</div>
            <ul className="text-sm divide-y">
              {Array.from({length:6}).map((_,i)=> (
                <li key={i} className="py-2 flex items-center justify-between"><span>콘텐츠 {i+1}</span><span className="text-gray-500">조회 {1000 - i*80}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      )}

      {activeTab==='tasks' && (
        <section className="max-w-[1400px] mx-auto px-6 lg:px-8 py-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card title="진척 링(더미)">
              <div className="w-full h-56 flex items-center justify-center">
                <ResponsiveContainer width="60%" height="100%">
                  <RadialBarChart innerRadius="60%" outerRadius="100%" data={[{name:'완료', value:62, fill:'#0052cc'}]} startAngle={90} endAngle={-270}>
                    <RadialBar background dataKey="value" />
                    <Tooltip />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="text-3xl font-semibold ml-6">62%</div>
              </div>
            </Card>
            <Card title="이번 주 우선 작업(더미)">
              <ul className="text-sm divide-y">
                {['견적 발송','제작 승인 확인','입금 확인','출고 스케줄링','리뷰 회신'].map((t,i)=> (
                  <li key={i} className="py-2 flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full" style={{ background:'#0052cc' }} />{t}</li>
                ))}
              </ul>
            </Card>
            <Card title="Streak(더미)">
              <div className="text-4xl font-semibold">7</div>
              <div className="text-xs text-gray-500">연속 완료일</div>
            </Card>
          </div>
          <Card title="진행 보드(드래그 데모)">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-gray-500">담당자 필터</span>
              <select className="border rounded px-2 py-1 bg-white" value={taskAssigneeFilter} onChange={(e)=> setTaskAssigneeFilter(e.target.value)}>
                <option value="">전체</option>
                {profiles.map(p=> (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
              <input className="border rounded px-2 py-1 bg-white" placeholder="검색(제목/고객/주제)" value={taskQuery} onChange={(e)=> setTaskQuery(e.target.value)} />
            </div>
            <Kanban
              columns={[
                { key:'counsel', title:'상담' },
                { key:'progress', title:'진행' },
                { key:'design', title:'디자인' },
                { key:'purchase', title:'발주' },
                { key:'production', title:'제작' },
                { key:'shipping', title:'배송' },
              ] as {key: WorkItemStatus; title: string;}[]}
              items={workItems.filter(w=> (!taskAssigneeFilter || w.assigneeId===taskAssigneeFilter) && (!taskQuery || (w.title+w.customer+w.channel).includes(taskQuery)))}
              onMove={(id, to)=> setWorkItems(prev=> prev.map(w=> w.id===id? { ...w, status: to }: w))}
              onOpenDetail={(item)=> setDetailModal({ kind:'work', item })}
            />
          </Card>
          <Card title="외부영업 보드(드래그 데모)">
            <FieldKanban
              columns={[
                { key:'plan', title:'계획' },
                { key:'visited', title:'방문완료' },
                { key:'proceed', title:'진행' },
                { key:'hold', title:'보류' },
                { key:'rejected', title:'거절' },
                { key:'pending', title:'대기' },
              ] as {key: FieldSalesStatus; title: string;}[]}
              items={fieldItems.filter(w=> (!taskAssigneeFilter || w.assigneeId===taskAssigneeFilter) && (!taskQuery || (w.bizName+w.category+w.address).includes(taskQuery)))}
              onMove={(id, to)=> setFieldItems(prev=> prev.map(w=> w.id===id? { ...w, status: to }: w))}
              onOpenDetail={(item)=> setDetailModal({ kind:'field', item })}
            />
          </Card>
          <Card title="온라인 홍보 보드(드래그 데모)">
            <MarketingKanban
              columns={[
                { key:'plan', title:'계획' },
                { key:'shoot', title:'촬영' },
                { key:'edit', title:'편집' },
                { key:'upload', title:'업로드' },
              ] as {key: MarketingStatus; title: string;}[]}
              items={marketingItems.filter(w=> (!taskAssigneeFilter || w.assigneeId===taskAssigneeFilter) && (!taskQuery || (w.topic+w.category+w.format).includes(taskQuery)))}
              onMove={(id, to)=> setMarketingItems(prev=> prev.map(w=> w.id===id? { ...w, status: to }: w))}
              onOpenDetail={(item)=> setDetailModal({ kind:'marketing', item })}
            />
          </Card>
          {detailModal && (
            <TodoDetailModal data={detailModal} onClose={()=> setDetailModal(null)} />
          )}
        </section>
      )}

      {activeTab==='operations' && (
      <section className="max-w-[1400px] mx-auto px-6 lg:px-8 border rounded-xl bg-white shadow-sm p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">상담 내역 직접 생성(샘플)</h3>
          <button className="px-2 py-1 border rounded-full text-xs bg-white hover:bg-gray-50" onClick={()=> setManualOpen(v=>!v)}>{manualOpen? '접기':'펼치기'}</button>
        </div>
        {manualOpen && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 items-end text-sm">
            <Input label="이름" placeholder="홍길동" />
            <Input label="연락처" placeholder="010-0000-0000" />
            <Select label="종류" options={["-", "단체복", "커스텀 소량 굿즈"]} />
            <Input label="수량" type="number" placeholder="30" />
            <Select label="구분" options={["-", "네이버 스마트스토어", "카카오톡채널", "카카오샵", "외부영업", "지인"]} />
            <Select label="담당자" options={["미지정", ...profiles.map(p=>p.name)]} />
            <div className="md:col-span-2">
              <button className="px-4 py-2 rounded-full text-sm" style={{ background: '#0052cc', color: 'white' }}>생성</button>
            </div>
          </div>
        )}
      </section>
      )}
        </div>
      </div>
    </main>
  );
}

function Widget({ title, value }: { title: string; value: number|string }) {
  return (
    <div className="rounded-xl p-4" style={{ background:'rgba(255,255,255,0.14)', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.2)'}}>
      <div className="text-xs opacity-90">{title}</div>
      <div className="text-3xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function KpiTile({ label, value, tone }: { label: string; value: string; tone: string }){
  return (
    <div className="rounded-2xl p-4" style={{ background: tone, border:'1px solid #EEF2F6' }}>
      <div className="text-xs text-gray-600">{label}</div>
      <div className="text-2xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function TodoDetailModal({ data, onClose }: { data: { kind:'work'|'field'|'marketing'; item: WorkItem | FieldSalesItem | MarketingItem }; onClose: ()=>void }){
  const { kind, item } = data;
  const [note, setNote] = useState<string>('');
  const [assignee, setAssignee] = useState<string>(item.assigneeId || '');
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl rounded-2xl bg-white" style={{ border:'1px solid #EEF2F6', boxShadow:'0 8px 30px rgba(0,0,0,0.12)' }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom:'1px solid #EEF2F6' }}>
          <div className="font-semibold">상세 보기 · {kind}</div>
          <button className="text-sm px-3 py-1 rounded-full border" onClick={onClose}>닫기</button>
        </div>
        <div className="p-5 text-sm space-y-3">
          {kind==='work' && (item as WorkItem) && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-gray-400">주문번호</span> · {(item as WorkItem).orderNo}</div>
                <div><span className="text-gray-400">마감</span> · {(item as WorkItem).due}</div>
                <div><span className="text-gray-400">고객</span> · {(item as WorkItem).customer}</div>
                <div><span className="text-gray-400">채널</span> · {(item as WorkItem).channel}</div>
                <div className="col-span-2"><span className="text-gray-400">금액</span> · ₩ {(item as WorkItem).amount?.toLocaleString?.() || (item as WorkItem).amount}</div>
              </div>
              <div>
                <div className="text-gray-400">메모</div>
                <div className="mt-1 p-3 rounded-xl bg-gray-50">{(item as WorkItem).memo || '-'}</div>
              </div>
            </>
          )}
          {kind==='field' && (item as FieldSalesItem) && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-gray-400">상호</span> · {(item as FieldSalesItem).bizName}</div>
                <div><span className="text-gray-400">카테고리</span> · {(item as FieldSalesItem).category}</div>
                <div className="col-span-2"><span className="text-gray-400">주소</span> · {(item as FieldSalesItem).address}</div>
                <div><span className="text-gray-400">예정일</span> · {(item as FieldSalesItem).visitPlanned}</div>
                <div><span className="text-gray-400">결과</span> · {(item as FieldSalesItem).outcome || '-'}</div>
              </div>
              <div>
                <div className="text-gray-400">메모</div>
                <div className="mt-1 p-3 rounded-xl bg-gray-50">{(item as FieldSalesItem).memo || '-'}</div>
              </div>
            </>
          )}
          {kind==='marketing' && (item as MarketingItem) && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-gray-400">주제</span> · {(item as MarketingItem).topic}</div>
                <div><span className="text-gray-400">형식</span> · {(item as MarketingItem).format}</div>
                <div><span className="text-gray-400">카테고리</span> · {(item as MarketingItem).category}</div>
                <div className="col-span-2"><span className="text-gray-400">레퍼런스</span> · {(item as MarketingItem).reference || '-'}</div>
                <div><span className="text-gray-400">편집</span> · {(item as MarketingItem).editState || '-'}</div>
                <div><span className="text-gray-400">업로드</span> · {(item as MarketingItem).uploadState || '-'}</div>
                <div className="col-span-2"><span className="text-gray-400">링크</span> · {(item as MarketingItem).uploadLink ? <a href={(item as MarketingItem).uploadLink!} className="underline text-blue-600" target="_blank">열기</a> : '-'}</div>
              </div>
              <NotesPanel notes={item.notes || []} onAdd={(text)=> {/* demo only */ (item.notes ||= []).push({ id:`n${Date.now()}`, authorId:'u1', text, created_at:new Date().toISOString(), pinned:false}); }} onTogglePin={(id)=> { const n=(item.notes||[]).find((x:any)=> x.id===id); if(n){ n.pinned = !n.pinned; } }} />
            </>
          )}
          <div className="flex items-center gap-2">
            <span className="text-gray-400">담당자</span>
            <select className="border rounded px-2 py-1 bg-white" value={assignee} onChange={(e)=> setAssignee(e.target.value)}>
              <option value="">미지정</option>
              {profiles.map(p=> (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
            <button className="ml-auto text-xs px-3 py-1 rounded-full" style={{ background:'#0052cc', color:'#fff' }}>임시 저장</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotesPanel({ notes, onAdd, onTogglePin }: { notes: {id:string; authorId:string; text:string; created_at:string; pinned?:boolean}[]; onAdd:(t:string)=>void; onTogglePin?:(id:string)=>void }){
  const [text, setText] = useState('');
  const authorName = (id:string)=> profiles.find(p=> p.id===id)?.name || '익명';
  const sorted = [...(notes||[])].sort((a,b)=> (b.pinned?1:0) - (a.pinned?1:0) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return (
    <div className="mt-2">
      <div className="text-gray-400">업무 기록</div>
      <div className="mt-1 space-y-2 max-h-56 overflow-auto bg-gray-50 rounded-xl p-2">
        {sorted.length===0 && <div className="text-xs text-gray-500 px-1 py-1">기록이 없습니다</div>}
        {sorted.map(n=> (
          <div key={n.id} className="text-xs bg-white rounded-lg border p-2 relative">
            <div className="text-gray-700 whitespace-pre-wrap pr-16">{n.text}</div>
            <div className="absolute top-2 right-2 flex items-center gap-2">
              <span className="text-[11px] text-gray-400">{authorName(n.authorId)}</span>
              {onTogglePin && (
                <button className="text-[11px] px-1 py-0.5 rounded border" onClick={()=> onTogglePin(n.id)}>{n.pinned? '핀 해제':'핀 고정'}</button>
              )}
            </div>
            <div className="mt-1 text-[11px] text-gray-500">{new Date(n.created_at).toLocaleString('ko-KR')}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input className="flex-1 border rounded px-2 py-2 text-sm" placeholder="메모를 입력..." value={text} onChange={(e)=> setText(e.target.value)} />
        <button className="text-xs px-3 py-2 rounded-full" style={{ background:'#0052cc', color:'#fff' }} onClick={()=> { if(text.trim()) { onAdd(text.trim()); setText(''); } }}>추가</button>
      </div>
    </div>
  );
}

function labelStatus(s: Inquiry["status"]) {
  switch (s) {
    case 'new': return '미답변';
    case 'in_progress': return '진행중';
    case 'answered': return '답변완료';
    case 'closed': return '종료';
    default: return s;
  }
}

function statusBadge(s: Inquiry["status"]) {
  const map: Record<string,{bg:string;color:string;label:string}> = {
    new: { bg:'#f1f5f9', color:'#0f172a', label:'미답변' },
    in_progress: { bg:'#e0ecff', color:'#1e40af', label:'진행중' },
    answered: { bg:'#dcfce7', color:'#065f46', label:'답변완료' },
    closed: { bg:'#f3f4f6', color:'#334155', label:'종료' },
  };
  const t = map[s] || map['new'];
  return <span className="px-2 py-1 rounded-full text-xs" style={{ background:t.bg, color:t.color }}>{t.label}</span>;
}

function Input({ label, ...rest }: any) {
  return (
    <div>
      <label className="block text-xs text-gray-500">{label}</label>
      <input className="w-full border rounded px-2 py-2" {...rest} />
    </div>
  );
}
function Select({ label, options = [] as string[] }: { label: string; options: string[] }) {
  return (
    <div>
      <label className="block text-xs text-gray-500">{label}</label>
      <select className="w-full border rounded px-2 py-2 bg-white">
        {options.map((o,i)=> (<option key={i}>{o}</option>))}
      </select>
    </div>
  );
}

function Card({ title, span, children }: { title: string; span?: number; children: React.ReactNode }) {
  return (
    <div className={`${span===2? 'lg:col-span-2':''} rounded-2xl p-4`} style={{ background:'#ffffff', boxShadow:'0 1px 2px rgba(16,24,40,0.04), 0 1px 1px rgba(16,24,40,0.04)', border:'1px solid #EEF2F6' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function SimpleLineChart({ series }: { series: { labels: string[]; lines: { name: string; color: string; data: number[] }[] } }) {
  // Normalize data to fit 0..100
  const max = Math.max(...series.lines.flatMap(l=> l.data));
  const points = (arr:number[]) => arr.map((v,i)=> `${(i/(arr.length-1))*100},${100-(v/max)*100}`).join(' ');
  return (
    <div className="w-full h-56">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        <rect x="0" y="0" width="100" height="100" fill="#f8fafc" />
        {series.lines.map((l,idx)=> (
          <polyline key={idx} fill="none" stroke={l.color} strokeWidth="1.5" points={points(l.data)} />
        ))}
      </svg>
      <div className="flex gap-3 mt-2 text-xs text-gray-600">
        {series.lines.map(l=> (<div key={l.name} className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background:l.color }} />{l.name}</div>))}
      </div>
    </div>
  );
}

function DonutChart({ parts }:{ parts:{label:string; value:number; color:string}[] }){
  const total = parts.reduce((a,b)=> a+b.value, 0);
  let acc = 0;
  const segs = parts.map(p=> {
    const start = acc/total*100; acc += p.value; const end = acc/total*100; return { start, end, color:p.color };
  });
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 42 42" className="w-28 h-28 -rotate-90">
        <circle cx="21" cy="21" r="15.915" fill="#f1f5f9" />
        {segs.map((s,i)=> (
          <circle key={i} cx="21" cy="21" r="15.915" fill="transparent" stroke={s.color} strokeWidth="6" strokeDasharray={`${s.end-s.start} ${100-(s.end-s.start)}`} strokeDashoffset={`${25 - s.start}`} />
        ))}
        <circle cx="21" cy="21" r="10" fill="white" />
      </svg>
      <div className="text-xs text-gray-600">
        {parts.map(p=> (
          <div key={p.label} className="flex items-center gap-2 mb-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background:p.color }} />{p.label} ({p.value}%)</div>
        ))}
      </div>
    </div>
  );
}

function Waterfall({ steps }: { steps:{label:string; value:number; color:string}[] }){
  const max = Math.max(1, ...steps.map(s=> Math.abs(s.value)));
  return (
    <div className="w-full h-56 flex items-end gap-2">
      {steps.map((s,i)=> (
        <div key={i} className="flex-1 flex flex-col items-center">
          <div className="w-full" style={{ height:`${Math.abs(s.value)/max*90}%`, background: s.value>=0? '#e0ecff':'#fee2e2', border:`1px solid ${s.color}` }} />
          <div className="text-xs mt-1 text-gray-600 truncate w-full text-center">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function League({ rows }:{ rows:{name:string; metric:string}[] }){
  return (
    <div className="text-sm">
      {rows.map((r,i)=> (
        <div key={i} className="flex items-center justify-between py-1 border-b last:border-b-0">
          <div className="flex items-center gap-2"><span className="text-gray-400">{i+1}</span> {r.name}</div>
          <div className="font-medium" style={{ color:'#0052cc' }}>{r.metric}</div>
        </div>
      ))}
    </div>
  );
}

function Kanban({ columns, items, onMove, onOpenDetail }: { columns: { key: WorkItemStatus; title: string }[]; items: WorkItem[]; onMove: (id: string, to: WorkItemStatus) => void; onOpenDetail: (item: WorkItem)=> void }){
  const grouped = useMemo(() => {
    const map: Record<WorkItemStatus, WorkItem[]> = { counsel:[], progress:[], design:[], purchase:[], production:[], shipping:[] };
    for (const it of items) map[it.status].push(it);
    return map;
  }, [items]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 text-sm">
      {columns.map(col => (
        <div key={col.key} className="rounded-2xl bg-white" style={{ border:'1px solid #EEF2F6' }}
             onDragOver={(e)=> e.preventDefault()}
             onDrop={(e)=> { const id = e.dataTransfer.getData('text/plain'); onMove(id, col.key); }}>
          <div className="px-3 py-2" style={{ borderBottom:'1px solid #EEF2F6' }}>
            <div className="font-medium">{col.title}</div>
          </div>
          <div className="p-3 space-y-2 min-h-40">
            {grouped[col.key].map(card => (
              <KanbanCard key={card.id} item={card} onOpenDetail={()=> onOpenDetail(card)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AssigneeSelect({ value, onChange }:{ value?: string; onChange:(v:string)=>void }){
  const options = [{ id:'', name:'미지정' }, ...profiles];
  return (
    <select className="border rounded px-2 py-1 text-xs bg-white" value={value || ''} onChange={(e)=> onChange(e.target.value)}>
      {options.map(o=> (<option key={o.id} value={o.id}>{o.name || o.id || '미지정'}</option>))}
    </select>
  );
}

function KanbanCard({ item, onOpenDetail }: { item: WorkItem; onOpenDetail: ()=>void }){
  const [open, setOpen] = useState(false);
  return (
    <div draggable onDragStart={(e)=> e.dataTransfer.setData('text/plain', item.id)} className="rounded-xl bg-white hover:bg-gray-50 transition-colors" style={{ border:'1px solid #EEF2F6' }}>
      <div className="px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 truncate font-medium text-gray-800">{item.title}</div>
          <button className="text-[12px] leading-none px-0.5" onClick={()=> setOpen(v=>!v)} title={open? '접기':'펼치기'}>
            {open? '▲' : '▼'}
          </button>
        </div>
        <div className="mt-0.5 text-[11px] text-gray-500">마감기한 : {item.due}</div>
      </div>
      {open ? (
        <div className="px-3 pb-2 text-xs text-gray-600">
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-gray-400">주문번호</span> · {item.orderNo}</div>
            <div><span className="text-gray-400">금액</span> · ₩ {item.amount.toLocaleString()}</div>
            <div className="col-span-2"><span className="text-gray-400">메모</span> · {item.memo || '-'}</div>
          </div>
          <div className="mt-2 text-right">
            <button className="text-[12px] text-blue-600 underline" onClick={onOpenDetail}>상세보기</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FieldKanban({ columns, items, onMove, onOpenDetail }: { columns: { key: FieldSalesStatus; title: string }[]; items: FieldSalesItem[]; onMove: (id: string, to: FieldSalesStatus) => void; onOpenDetail: (item: FieldSalesItem)=> void }){
  const grouped = useMemo(() => {
    const map: Record<FieldSalesStatus, FieldSalesItem[]> = { plan:[], visited:[], proceed:[], hold:[], rejected:[], pending:[] };
    for (const it of items) map[it.status].push(it);
    return map;
  }, [items]);
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 text-sm">
      {columns.map(col => (
        <div key={col.key} className="rounded-2xl bg-white" style={{ border:'1px solid #EEF2F6' }} onDragOver={(e)=> e.preventDefault()} onDrop={(e)=> { const id = e.dataTransfer.getData('text/plain'); onMove(id, col.key); }}>
          <div className="px-3 py-2" style={{ borderBottom:'1px solid #EEF2F6' }}>
            <div className="font-medium">{col.title}</div>
          </div>
          <div className="p-3 space-y-2 min-h-40">
            {grouped[col.key].map(card => (
              <FieldCard key={card.id} item={card} onOpenDetail={()=> onOpenDetail(card)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FieldCard({ item, onOpenDetail }: { item: FieldSalesItem; onOpenDetail: ()=>void }){
  const [open, setOpen] = useState(false);
  return (
    <div draggable onDragStart={(e)=> e.dataTransfer.setData('text/plain', item.id)} className="rounded-xl bg-white hover:bg-gray-50 transition-colors" style={{ border:'1px solid #EEF2F6' }}>
      <div className="px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 truncate font-medium text-gray-800">{item.bizName}</div>
          <button className="text-[12px] leading-none px-0.5" onClick={()=> setOpen(v=>!v)} title={open? '접기':'펼치기'}>
            {open? '▲' : '▼'}
          </button>
        </div>
        <div className="mt-0.5 text-[11px] text-gray-500">마감기한 : {item.visitPlanned}</div>
      </div>
      {open ? (
        <div className="px-3 pb-2 text-xs text-gray-600">
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-gray-400">방문</span> · {item.visited? 'Y':'N'}</div>
            <div><span className="text-gray-400">결과</span> · {item.outcome || '-'}</div>
            <div className="col-span-2"><span className="text-gray-400">메모</span> · {item.memo || '-'}</div>
          </div>
          <div className="mt-2 text-right">
            <button className="text-[12px] text-blue-600 underline" onClick={onOpenDetail}>상세보기</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MarketingKanban({ columns, items, onMove, onOpenDetail }: { columns: { key: MarketingStatus; title: string }[]; items: MarketingItem[]; onMove: (id: string, to: MarketingStatus) => void; onOpenDetail: (item: MarketingItem)=> void }){
  const grouped = useMemo(() => {
    const map: Record<MarketingStatus, MarketingItem[]> = { plan:[], shoot:[], edit:[], upload:[] };
    for (const it of items) map[it.status].push(it);
    return map;
  }, [items]);
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
      {columns.map(col => (
        <div key={col.key} className="rounded-2xl bg-white" style={{ border:'1px solid #EEF2F6' }} onDragOver={(e)=> e.preventDefault()} onDrop={(e)=> { const id = e.dataTransfer.getData('text/plain'); onMove(id, col.key); }}>
          <div className="px-3 py-2" style={{ borderBottom:'1px solid #EEF2F6' }}>
            <div className="font-medium">{col.title}</div>
          </div>
          <div className="p-3 space-y-2 min-h-40">
            {grouped[col.key].map(card => (
              <MarketingCard key={card.id} item={card} onOpenDetail={()=> onOpenDetail(card)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MarketingCard({ item, onOpenDetail }: { item: MarketingItem; onOpenDetail: ()=>void }){
  const [open, setOpen] = useState(false);
  return (
    <div draggable onDragStart={(e)=> e.dataTransfer.setData('text/plain', item.id)} className="rounded-xl bg-white hover:bg-gray-50 transition-colors" style={{ border:'1px solid #EEF2F6' }}>
      <div className="px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 truncate font-medium text-gray-800">{item.topic}</div>
          <button className="text-[12px] leading-none px-0.5" onClick={()=> setOpen(v=>!v)} title={open? '접기':'펼치기'}>
            {open? '▲' : '▼'}
          </button>
        </div>
        <div className="mt-0.5 text-[11px] text-gray-500">마감기한 : -</div>
      </div>
      {open ? (
        <div className="px-3 pb-2 text-xs text-gray-600">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2"><span className="text-gray-400">레퍼런스</span> · {item.reference || '-'}</div>
            <div><span className="text-gray-400">편집</span> · {item.editState || '-'}</div>
            <div><span className="text-gray-400">업로드</span> · {item.uploadState || '-'}</div>
            <div className="col-span-2"><span className="text-gray-400">링크</span> · {item.uploadLink ? <a href={item.uploadLink} className="underline text-blue-600" target="_blank">열기</a> : '-'}</div>
          </div>
          <div className="mt-2 text-right">
            <button className="text-[12px] text-blue-600 underline" onClick={onOpenDetail}>상세보기</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

