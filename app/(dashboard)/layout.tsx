'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  Home,
  LayoutDashboard,
  ShoppingBag,
  Package,
  BarChart2,
  Banknote,
  Settings,
  HelpCircle,
  ChevronDown,
  Bell,
  Search,
  LogOut,
  LayoutGrid,
  Plus,
} from 'lucide-react';

/* ── nav structure ── */
interface NavChild { label: string; href: string; managerOnly?: boolean }
interface NavGroup {
  label: string;
  icon: React.ReactNode;
  managerOnly?: boolean;
  href?: string;          // leaf (no children)
  children?: NavChild[];
  defaultOpen?: boolean;
}

const NAV: NavGroup[] = [
  { label: 'Home', icon: <Home size={17} />, href: '/dashboard' },
  { label: 'Dashboard', icon: <LayoutDashboard size={17} />, href: '/dashboard', managerOnly: true },
  {
    label: 'Store', icon: <ShoppingBag size={17} />, defaultOpen: true,
    children: [
      { label: 'Product', href: '/products' },
      { label: 'Add Product', href: '/products/add', managerOnly: true },
    ],
  },
  {
    label: 'Analytic', icon: <BarChart2 size={17} />, managerOnly: true, defaultOpen: true,
    children: [
      { label: 'Traffic', href: '/analytics/traffic' },
      { label: 'Earning', href: '/analytics/earning' },
    ],
  },
  {
    label: 'Finances', icon: <Banknote size={17} />, managerOnly: true, defaultOpen: true,
    children: [
      { label: 'Payment', href: '/finances/payment' },
      { label: 'Payout', href: '/finances/payout' },
    ],
  },
  {
    label: 'Account Setting', icon: <Settings size={17} />, defaultOpen: true,
    children: [
      { label: 'My Profile', href: '/settings/profile' },
      { label: 'Security', href: '/settings/security' },
    ],
  },
  { label: 'Help And Support', icon: <HelpCircle size={17} />, href: '/help' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  // Track which groups are open
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NAV.filter((g) => g.defaultOpen && g.children).map((g) => [g.label, true]))
  );
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  const toggle = (label: string) => setOpen((p) => ({ ...p, [label]: !p[label] }));

  // Close avatar dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* route guard */
  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/login'); return; }
    if (user.role === 'STORE_KEEPER' && pathname === '/dashboard') router.replace('/products');
  }, [user, loading, pathname, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#E9EEF4]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  const isManager = user.role === 'MANAGER';

  /* active helper */
  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <div className="min-h-screen flex flex-col bg-[#E9EEF4]">
      <div className="flex flex-1">
        {/* ──────────── SIDEBAR ──────────── */}
        <aside className="sticky top-0 flex w-52 shrink-0 flex-col bg-[#E9EEF4] h-screen overflow-y-auto">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center gap-2.5 px-5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500">
              <Package size={15} className="text-white" />
            </div>
            <span className="text-base font-extrabold tracking-tight text-slate-800">Bitstore</span>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 pb-6 pt-2 space-y-0.5">
            {NAV.map((group) => {
              /* hide manager-only groups for store-keepers */
              if (group.managerOnly && !isManager) return null;

              /* ── Leaf (no children) ── */
              if (!group.children) {
                const active = group.href ? isActive(group.href) : false;
                return (
                  <Link
                    key={group.label}
                    href={group.href ?? '#'}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                      }`}
                  >
                    <span className={active ? 'text-blue-600' : 'text-slate-400'}>{group.icon}</span>
                    {group.label}
                  </Link>
                );
              }

              /* ── Group with children ── */
              const isOpen = open[group.label];
              const anyChildActive = group.children.some(
                (c) => (!c.managerOnly || isManager) && isActive(c.href)
              );

              return (
                <div key={group.label}>
                  {/* Group header */}
                  <button
                    onClick={() => toggle(group.label)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${anyChildActive
                      ? 'text-slate-800'
                      : 'text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    <span className={anyChildActive ? 'text-blue-600' : 'text-slate-400'}>
                      {group.icon}
                    </span>
                    <span className="flex-1 text-left">{group.label}</span>
                    <ChevronDown
                      size={14}
                      className={`shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}
                    />
                  </button>

                  {/* Children */}
                  {isOpen && (
                    <div className="ml-5 mt-0.5 mb-1 border-l-2 border-blue-300 pl-3 space-y-0.5">
                      {group.children.map((child) => {
                        if (child.managerOnly && !isManager) return null;
                        const active = isActive(child.href);
                        return (
                          <Link
                            key={child.label}
                            href={child.href}
                            className={`flex items-center rounded-lg px-3 py-1.5 text-sm transition-colors ${active
                              ? 'bg-white font-semibold text-slate-800 shadow-sm'
                              : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                              }`}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

        </aside>

        {/* ──────────── MAIN AREA ──────────── */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 bg-[#E9EEF4] px-6">
            {/* Search */}
            <div className="relative flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  placeholder="Search"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <button className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition shrink-0">
                Search
              </button>
            </div>

            <div className="ml-auto flex items-center gap-3">
              {/* Admin dropdown */}
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 cursor-pointer hover:bg-slate-50">
                Admin
                <ChevronDown size={14} className="text-slate-400" />
              </div>

              {/* Grid icon */}
              <button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-white/60">
                <LayoutGrid size={18} />
              </button>

              {/* Bell */}
              <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-white/60">
                <Bell size={18} />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
              </button>

              {/* Avatar + logout dropdown */}
              <div className="relative" ref={avatarRef}>
                <button
                  onClick={() => setAvatarOpen((v) => !v)}
                  className="flex h-9 w-9 items-center justify-center rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.email.split('@')[0])}&background=random&color=fff&size=128&bold=true`}
                    alt="avatar"
                    className="h-full w-full object-cover rounded-full"
                  />
                </button>

                {avatarOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-lg z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-800 truncate">{user.email}</p>
                      <p className="text-xs text-slate-400">{user.role === 'MANAGER' ? 'Manager' : 'Store Keeper'}</p>
                    </div>
                    <button
                      onClick={() => { setAvatarOpen(false); logout(); }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={15} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-6 bg-[#E9EEF4]">
            {children}
          </main>
        </div>
      </div>

      {/* ──────────── FOOTER ──────────── */}
      <footer className="w-full bg-white border-t border-gray-200">
        {/* Main footer content */}
        <div className="px-16 pt-10 pb-8">
          <div className="flex gap-16">
            {/* Left column — Brand + socials + subscribe */}
            <div className="max-w-xs shrink-0">
              {/* Logo */}
              <div className="flex items-center gap-2.5 mb-4">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <rect x="4" y="4" width="20" height="20" rx="3" stroke="#F59E0B" strokeWidth="2.5" transform="rotate(45 14 14)" fill="none" />
                  <circle cx="14" cy="14" r="3" fill="#F59E0B" />
                </svg>
                <span className="text-xl font-bold text-gray-900">Opion</span>
              </div>
              {/* Description */}
              <p className="text-sm text-gray-500 leading-relaxed mb-5">
                Ease of shopping is our main focus. With powerful search features and customizable filters, you can easily find the products you are looking for.
              </p>
              {/* Social icons */}
              <div className="flex items-center gap-3 mb-6">
                {/* Facebook */}
                <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-white hover:bg-gray-700 transition">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>
                </a>
                {/* Instagram */}
                <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-white hover:bg-gray-700 transition">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" /></svg>
                </a>
                {/* LinkedIn */}
                <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-white hover:bg-gray-700 transition">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>
                </a>
              </div>
              {/* Subscribe */}
              <p className="text-sm font-semibold text-gray-900 mb-2.5">Subscribe to Newlestter</p>
              <div className="relative">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-1/2 -translate-y-1/2">
                  <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 4L12 13 2 4" />
                </svg>
                <input
                  type="email"
                  placeholder="Enter Your Email Here"
                  className="w-full rounded-full bg-gray-100 py-2.5 pl-10 pr-4 text-sm text-gray-400 placeholder:text-gray-400 outline-none border-none"
                />
              </div>
            </div>

            {/* Link columns */}
            <div className="flex flex-1 justify-between">
              {/* Column 1 */}
              <div>
                <p className="text-sm font-bold text-gray-900 mb-4">Get Started</p>
                <ul className="space-y-2.5">
                  <li><a href="#" className="text-sm text-gray-500 hover:text-gray-700">Service</a></li>
                  <li><a href="#" className="text-sm text-gray-500 hover:text-gray-700">Contact Us</a></li>
                  <li><a href="#" className="text-sm text-gray-500 hover:text-gray-700">Affiliate Program</a></li>
                  <li><a href="#" className="text-sm text-gray-500 hover:text-gray-700">About Us</a></li>
                </ul>
              </div>
              {/* Column 2 */}
              <div>
                <p className="text-sm font-bold text-gray-900 mb-4">Get Started</p>
                <ul className="space-y-2.5">
                  <li><a href="#" className="text-sm text-gray-500 hover:text-gray-700">Dashboard</a></li>
                  <li><a href="#" className="text-sm text-gray-500 hover:text-gray-700">Platform</a></li>
                  <li><a href="#" className="text-sm text-gray-500 hover:text-gray-700">Workout Libary</a></li>
                  <li><a href="#" className="text-sm text-gray-500 hover:text-gray-700">App Design</a></li>
                </ul>
              </div>
              {/* Column 3 */}
              <div>
                <p className="text-sm font-bold text-gray-900 mb-4">Get Started</p>
                <ul className="space-y-2.5">
                  <li><a href="#" className="text-sm text-gray-500 hover:text-gray-700">About Us</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-200 px-16 py-5 flex items-center justify-between">
          <span className="text-sm text-gray-400">2024 MaxFit</span>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Twitter</span>
            <span className="text-gray-300">—</span>
            <span>Instagram</span>
            <span className="text-gray-300">—</span>
            <span>Facebook</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
