"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, LayoutGrid, PackageSearch, Star, Images, Menu, X, Home, ListTodo, Users, Shield } from "lucide-react";
import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type NavItem = { href: string; label: string; icon: any };
type NavSection = { title?: string; items: NavItem[] };

export default function AdminLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [displayName, setDisplayName] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [authChecked, setAuthChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        setHasSession(Boolean(user));
        if (!user) return;
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, role")
          .eq("id", user.id)
          .maybeSingle();
        if (!isMounted) return;
        const name = (profile as any)?.display_name || user.user_metadata?.name || user.email || "사용자";
        setDisplayName(name as string);
        const primaryRole = (profile as any)?.role || (user.app_metadata?.role as string) || "general";
        setRole(primaryRole);
      } catch (_) {
        // ignore
      } finally {
        if (isMounted) setAuthChecked(true);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // allowed roles derived from DB enum user_role in current_schema.sql: defaults to 'agent'
  const allowedRoles = new Set(["agent", "manager", "admin", "designer", "factory"]);
  const isAdmin = role === "admin";
  const canRenderFrame = hasSession && allowedRoles.has(role);
  const sections: NavSection[] = useMemo(() => {
    const s: NavSection[] = [
      { title: "개요", items: [ { href: "/admin/overview", label: "대시보드", icon: Home } ] },
      { title: "업무", items: [
        { href: "/admin/tasks", label: "할일 관리", icon: ListTodo },
        { href: "/admin", label: "문의 관리", icon: ClipboardList },
        { href: "/admin/orders", label: "주문 관리", icon: LayoutGrid },
      ]},
      { title: "콘텐츠", items: [
        { href: "/admin/products", label: "상품 관리", icon: PackageSearch },
        { href: "/admin/cases", label: "제작 사례 관리", icon: Images },
        { href: "/admin/reviews", label: "리뷰 관리", icon: Star },
      ]},
      { title: "사용자", items: [
        { href: "/admin/users", label: "회원 관리", icon: Users },
      ]},
    ];
    if (isAdmin) s.push({ title: "관리자", items: [ { href: "/admin/managers", label: "매니저 관리", icon: Shield } ] });
    return s;
  }, [isAdmin]);

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname?.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Auth gate */}
      {!authChecked && (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-sm text-gray-500">확인 중…</div>
        </div>
      )}
      {authChecked && hasSession && !canRenderFrame && (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center bg-white border rounded-2xl p-6 shadow-sm">
            <div className="text-xl font-semibold mb-2">접근 권한이 없습니다</div>
            <div className="text-sm text-gray-600 mb-4">이 페이지는 관리자·매니저·에이전트·디자이너·공장 전용입니다.</div>
            <a href="/" className="inline-block px-4 py-2 rounded-full border bg-white hover:bg-gray-50">홈으로</a>
          </div>
        </div>
      )}
      {authChecked && canRenderFrame && (
        <>
      {/* Mobile header */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur">
        <div className="flex items-center gap-3">
          <img src="https://cdn-saas-web-203-48.cdn-nhncommerce.com/everyuniform97_godomall_com/data/skin/front/singgreen_250227/img/banner/e07326a36c6c3442e0a2b31e353d4b89_16547.png" alt="모두의 유니폼" className="h-7 w-auto" />
          <div className="flex flex-col">
            <div className="font-semibold tracking-tight">Admin</div>
            {displayName && (
              <div className="text-xs text-gray-500">{displayName} · {role === "admin" ? "관리자" : role === "manager" ? "매니저" : role === "agent" ? "에이전트" : role === "designer" ? "디자이너" : role === "factory" ? "공장" : "사용자"}</div>
            )}
          </div>
        </div>
        <button onClick={()=> setMobileOpen(true)} className="p-2 rounded-md bg-white">
          <Menu size={18} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={()=> setMobileOpen(false)} />
          <aside className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl flex flex-col">
            <div className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="https://cdn-saas-web-203-48.cdn-nhncommerce.com/everyuniform97_godomall_com/data/skin/front/singgreen_250227/img/banner/e07326a36c6c3442e0a2b31e353d4b89_16547.png" alt="모두의 유니폼" className="h-7 w-auto" />
                <div className="flex flex-col">
                  <div className="font-semibold tracking-tight">Admin</div>
                  {displayName && (
                    <div className="text-xs text-gray-500">{displayName} · {role === "admin" ? "관리자" : role === "manager" ? "매니저" : role === "agent" ? "에이전트" : role === "designer" ? "디자이너" : role === "factory" ? "공장" : "사용자"}</div>
                  )}
                </div>
              </div>
              <button onClick={()=> setMobileOpen(false)} className="p-2 rounded-md bg-white"><X size={18} /></button>
            </div>
            <nav className="p-3 space-y-2 overflow-auto">
              {sections.map((sec, i) => (
                <div key={`msec-${i}`}>
                  {sec.title && <div className="px-3 py-1 text-xs text-gray-500">{sec.title}</div>}
                  <div className="space-y-1">
                    {sec.items.map(({ href, label, icon: Icon }) => {
                      const active = isActive(href);
                      return (
                        <Link key={href} href={href} onClick={()=> setMobileOpen(false)} className={`group flex items-center gap-3 px-3 py-3 rounded-xl text-base transition ${active ? 'bg-[#0052cc] text-white shadow-sm' : 'bg-white hover:bg-gray-50'}`}>
                          <Icon size={20} className={active ? 'text-white' : 'text-[#0052cc]'} />
                          <span className={`font-medium ${active ? 'text-white' : 'text-gray-900'}`}>{label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Desktop top header (logo outside sidebar) */}
      <div className="hidden md:flex sticky top-0 z-40 items-center justify-between px-4 py-3 bg-white/90 backdrop-blur">
        <div className="flex items-center gap-3">
          <img src="https://cdn-saas-web-203-48.cdn-nhncommerce.com/everyuniform97_godomall_com/data/skin/front/singgreen_250227/img/banner/e07326a36c6c3442e0a2b31e353d4b89_16547.png" alt="모두의 유니폼" className="h-7 w-auto" />
          <div className="font-semibold tracking-tight text-base">Admin</div>
        </div>
        {displayName && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{displayName} · {role === "admin" ? "관리자" : role === "manager" ? "매니저" : role === "agent" ? "에이전트" : role === "designer" ? "디자이너" : role === "factory" ? "공장" : "사용자"}</span>
            <button onClick={()=> supabase.auth.signOut()} className="px-3 py-1.5 rounded-full bg-white hover:bg-gray-50 text-gray-700">로그아웃</button>
          </div>
        )}
      </div>

      <div className="flex">
        {/* Sidebar – PC 고정 폭, 섹션 기반 재배치 */}
        <aside className="hidden md:flex w-72 lg:w-80 xl:w-80 flex-col bg-white/90 backdrop-blur sticky top-[56px] h-[calc(100vh-56px)]">
          <nav className="p-3 space-y-3 overflow-auto">
            {sections.map((sec, i) => (
              <div key={`dsec-${i}`}>
                {sec.title && <div className="px-2 py-1 text-xs text-gray-500">{sec.title}</div>}
                <div className="mt-1 space-y-1">
                  {sec.items.map(({ href, label, icon: Icon }) => {
                    const active = isActive(href);
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={`flex items-center gap-3 px-3 h-11 rounded-xl text-base transition ${active ? 'bg-[#0052cc] text-white shadow-sm' : 'bg-white hover:bg-gray-50'}`}
                      >
                        <Icon size={20} className={active ? 'text-white' : 'text-[#0052cc]'} />
                        <span className={`font-medium ${active ? 'text-white' : 'text-gray-900'}`}>{label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
        </>
      )}
      {authChecked && !hasSession && (
        <main className="flex-1 min-w-0">
          {children}
        </main>
      )}
    </div>
  );
}


