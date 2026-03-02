'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client/react';
import {
  BarChart, Bar, LineChart, Line, ReferenceLine,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Plus, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { GET_DASHBOARD_STATS } from '@/lib/graphql/dashboard';
import type { DashboardStats } from '@/lib/types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { Bar as ChartBar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTooltip, Legend);

interface DashboardStatsData { dashboardStats: DashboardStats }

const OVERVIEW_MAX = 6000;

/* ── Custom bar for the Overview chart ──────────────────────────────
   In recharts, within a custom shape:
     y      = distance from the TOP of the plot area to the top of this bar
     height = height of the bar (the blue part)
   So the grey-fade region spans from y=0 (chart top) down to y (bar top).
   Using objectBoundingBox gradient on that rect means the gradient always
   runs transparent→opaque from chart-top to bar-top, looking identical
   in density at every absolute height across all columns.
─────────────────────────────────────────────────────────────────── */
function OverviewBarShape(props: any) {
  const { x, y, width, height, index } = props;
  const id = `ogf${index}`;
  const greyH = y; // pixels from plot-area top to the top of the blue bar
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#CBD5E1" stopOpacity={0} />
          <stop offset="100%" stopColor="#CBD5E1" stopOpacity={0.5} />
        </linearGradient>
      </defs>
      {/* Grey fade: from chart top → where blue bar begins */}
      {greyH > 2 && (
        <rect x={x} y={0} width={width} height={greyH} fill={`url(#${id})`} />
      )}
      {/* Blue bar */}
      <rect x={x} y={y} width={width} height={height} fill="#60A5FA" />
    </g>
  );
}

const yellowDotData = [
  { v: 65 }, { v: 72 }, { v: 68 }, { v: 80 }, { v: 75 }, { v: 88 }, { v: 82 },
];
const miniLine2 = [
  { a: 30, b: 50 }, { a: 45, b: 35 }, { a: 28, b: 60 }, { a: 55, b: 40 },
  { a: 40, b: 70 }, { a: 70, b: 45 }, { a: 50, b: 65 },
];
const subBarData = [
  { v: 60 }, { v: 85 }, { v: 45 }, { v: 95 }, { v: 70 },
  { v: 88 }, { v: 55 }, { v: 78 }, { v: 65 }, { v: 82 },
];
const topProducts = Array(7).fill({ email: 'Youremail@email.com', amount: '$100' });
const paymentRows = Array(8).fill({ status: 'Succses', email: 'Youremail@email.com', amount: '$100' });

const weeklyFallback = [
  { day: 'Monday', revenue: 300, expenses: 210 },
  { day: 'Tuesday', revenue: 290, expenses: 170 },
  { day: 'Wednesday', revenue: 470, expenses: 270 },
  { day: 'Thursday', revenue: 520, expenses: 360 },
  { day: 'Friday', revenue: 340, expenses: 200 },
  { day: 'Saturday', revenue: 380, expenses: 270 },
  { day: 'Sunday', revenue: 400, expenses: 315 },
];
const earningChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { stacked: true, grid: { display: false }, ticks: { color: '#6b7280', font: { size: 11 } }, border: { display: false } },
    y: {
      stacked: true, beginAtZero: true, max: 550,
      ticks: { stepSize: 100, color: '#6b7280', font: { size: 11 } },
      // @ts-ignore
      grid: { color: 'rgba(0,0,0,0.06)', borderDash: [5, 5] },
      border: { display: false },
    },
  },
} as const;

function EarningChart({ totalEarnings, weeklyData }: { totalEarnings: number; weeklyData?: { day: string; revenue: number; expenses: number }[] }) {
  const wd = weeklyData?.length ? weeklyData : weeklyFallback;
  const maxVal = 550;
  const chartData = {
    labels: wd.map((d) => d.day.slice(0, 2)),
    datasets: [
      { label: 'Revenue', data: wd.map((d) => d.revenue), backgroundColor: 'rgba(34,197,94,0.3)', borderRadius: 10, barThickness: 20, stack: 'a' },
      { label: 'Expenses', data: wd.map((d) => d.expenses), backgroundColor: '#16a34a', borderRadius: 10, barThickness: 20, stack: 'b' },
      {
        label: 'FadeA',
        data: wd.map((d) => Math.max(0, maxVal - d.revenue)),
        backgroundColor: (ctx: any) => {
          const chart = ctx.chart;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return 'rgba(209,213,219,0.2)';
          const g = c.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          g.addColorStop(0, 'rgba(209,213,219,0.4)');
          g.addColorStop(1, 'rgba(209,213,219,0.02)');
          return g;
        },
        borderRadius: 10, barThickness: 20, stack: 'a',
      },
      {
        label: 'FadeB',
        data: wd.map((d) => Math.max(0, maxVal - d.expenses)),
        backgroundColor: (ctx: any) => {
          const chart = ctx.chart;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return 'rgba(209,213,219,0.2)';
          const g = c.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          g.addColorStop(0, 'rgba(209,213,219,0.4)');
          g.addColorStop(1, 'rgba(209,213,219,0.02)');
          return g;
        },
        borderRadius: 10, barThickness: 20, stack: 'b',
      },
    ],
  };
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-gray-800">Total Earning</p>
      <p className="mt-0.5 text-2xl font-bold text-gray-900">$ {totalEarnings.toLocaleString()}.00</p>
      <p className="text-xs text-green-500 font-bold mb-1">trend title <span className="bg-green-100 text-green-600 rounded px-1 ml-1">70.5%</span></p>
      <span className="text-xs border border-gray-200 rounded-full px-2.5 py-0.5 text-gray-500 cursor-pointer mb-2 inline-block">This Week ▾</span>
      <div style={{ height: 200 }}>
        <ChartBar data={chartData} options={earningChartOptions} />
      </div>
    </div>
  );
}

function StatCard({ title, value, loading }: { title: string; value: string; loading: boolean }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <span className="text-sm text-gray-500">{title}</span>
        <LayoutGrid size={14} className="text-gray-300 mt-0.5" />
      </div>
      {loading ? (
        <div className="h-8 w-36 animate-pulse rounded-lg bg-gray-100" />
      ) : (
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      )}
      <p className="text-xs text-green-500 font-medium">trend title <span className="opacity-50"></span> 75.5%</p>
    </div>
  );
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function FilterBar({ showAddEdit = false, startIdx, endIdx, onRangeChange }: {
  showAddEdit?: boolean;
  startIdx?: number;
  endIdx?: number;
  onRangeChange?: (s: number, e: number) => void;
}) {
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const sIdx = startIdx ?? 7;
  const eIdx = endIdx ?? 11;
  const rangeLabel = `${MONTH_SHORT[sIdx]} 20th - ${MONTH_SHORT[eIdx]} 4th`;
  return (
    <div className="flex flex-1 items-center gap-2 flex-wrap">
      <span className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium cursor-pointer bg-white border border-gray-200 text-gray-600 hover:bg-gray-50">Years ▾</span>
      <span className="relative flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium cursor-pointer bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
        onClick={() => setShowStart(!showStart)}>
        {rangeLabel} ▾
        {showStart && (
          <div className="absolute top-8 left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-48 overflow-y-auto w-28">
            {MONTH_NAMES.map((m, i) => i < 12 && (
              <button key={m} className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-green-50 ${i === sIdx ? 'bg-green-100 font-bold' : ''}`}
                onClick={(e) => { e.stopPropagation(); onRangeChange?.(i, eIdx); setShowStart(false); }}>{m}</button>
            ))}
          </div>
        )}
      </span>
      <span className="text-xs text-gray-400 font-medium">compared to</span>
      <span className="relative flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium cursor-pointer bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
        onClick={() => setShowEnd(!showEnd)}>
        Previous ▾
        {showEnd && (
          <div className="absolute top-8 left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-48 overflow-y-auto w-28">
            {MONTH_NAMES.map((m, i) => i < 12 && (
              <button key={m} className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-green-50 ${i === eIdx ? 'bg-green-100 font-bold' : ''}`}
                onClick={(e) => { e.stopPropagation(); onRangeChange?.(sIdx, i); setShowEnd(false); }}>{m}</button>
            ))}
          </div>
        )}
      </span>
      <span className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium cursor-pointer bg-white border border-gray-200 text-gray-600 hover:bg-gray-50">2024 ▾</span>
      {showAddEdit && (
        <div className="ml-auto flex gap-2 shrink-0">
          <button className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">+ Add</button>
          <button className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">⚙ Edit</button>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [statsRange, setStatsRange] = useState({ start: 7, end: 11 }); // Aug-Dec default

  useEffect(() => {
    if (!authLoading && user?.role === 'STORE_KEEPER') router.replace('/products');
  }, [user, authLoading, router]);

  const { data, loading } = useQuery<DashboardStatsData>(GET_DASHBOARD_STATS, {
    skip: !user || user.role !== 'MANAGER',
  });
  const stats = data?.dashboardStats;

  /* ---- Dynamic chart data from API ---- */
  const overviewData = useMemo(() => {
    const fallback = [
      { month: 'Jan', fg: 1400 }, { month: 'Feb', fg: 4200 },
      { month: 'Mar', fg: 800 }, { month: 'Apr', fg: 4800 },
      { month: 'May', fg: 3000 }, { month: 'Jun', fg: 3400 },
      { month: 'Jul', fg: 4800 }, { month: 'Aug', fg: 3000 },
      { month: 'Sep', fg: 600 }, { month: 'Oct', fg: 3200 },
      { month: 'Nov', fg: 1600 }, { month: 'Dec', fg: 3200 },
    ];
    const src = stats?.monthlySalesData?.length
      ? stats.monthlySalesData.map((m) => ({ month: m.month.slice(0, 3), fg: m.value }))
      : fallback;
    return src;
  }, [stats]);

  const earningLineData = useMemo(() => {
    if (!stats?.monthlySalesData?.length) {
      return [
        { month: 'Jan', a: 55, b: 45 }, { month: 'Feb', a: 35, b: 40 },
        { month: 'Mar', a: 15, b: 35 }, { month: 'Apr', a: 88, b: 38 },
        { month: 'May', a: 50, b: 30 }, { month: 'Jun', a: 45, b: 28 },
        { month: 'Jul', a: 42, b: 25 }, { month: 'Aug', a: 55, b: 22 },
        { month: 'Sep', a: 60, b: 48 }, { month: 'Oct', a: 50, b: 30 },
        { month: 'Nov', a: 52, b: 38 }, { month: 'Dec', a: 58, b: 45 },
      ];
    }
    return stats.monthlySalesData.map((m) => ({
      month: m.month.slice(0, 3),
      a: m.value / 50,
      b: (m.value / 50) * 0.6,
    }));
  }, [stats]);

  const greenBarData = useMemo(() => {
    if (!stats?.monthlySalesData?.length) {
      return [40, 70, 50, 90, 60, 85, 55, 75, 65, 80].map((v) => ({ v, rest: 100 - v }));
    }
    const max = Math.max(...stats.monthlySalesData.map((m) => m.value));
    return stats.monthlySalesData.map((m) => {
      const v = Math.round((m.value / max) * 100);
      return { v, rest: 100 - v };
    });
  }, [stats]);

  const recentSales = stats?.recentSales ?? [];

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* PAGE TITLE */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <Link
          href="/products/add"
          className="flex items-center gap-1.5 rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-green-600 transition"
        >
          <Plus size={15} />
          Add New Product
        </Link>
      </div>

      {/* TOP 4 STAT CARDS */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard title="Total Earning" value={`$${(stats?.totalEarnings ?? 112893).toLocaleString()}.00`} loading={loading} />
        <StatCard title="Views" value={`+${(stats?.totalRevenue ?? 112893).toLocaleString()}`} loading={loading} />
        <StatCard title="Total Sales" value={`+${(stats?.totalSales ?? 112893).toLocaleString()}`} loading={loading} />
        <StatCard title="Subscriptions" value={`${(stats?.subscriptions ?? 112893).toLocaleString()}`} loading={loading} />
      </div>

      {/* OVERVIEW + RECENT SALES */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="col-span-3 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-800">Overview</h2>
          {/* Wrapper: custom HTML Y-axis labels + recharts chart side by side */}
          <div className="relative flex" style={{ height: 280 }}>
            {/* ── Custom Y-axis labels ── */}
            <div className="relative shrink-0" style={{ width: 46 }}>
              {([
                { label: '$6000', pct: 3.6 },
                { label: '$4500', pct: 25.4 },
                { label: '$3000', pct: 47.3 },
                { label: '$1500', pct: 69.2 },
                { label: '$0',    pct: 91.1 },
              ] as { label: string; pct: number }[]).map(({ label, pct }) => (
                <span
                  key={label}
                  style={{
                    position: 'absolute',
                    top: `${pct}%`,
                    right: 4,
                    transform: 'translateY(-50%)',
                    fontSize: 11,
                    color: '#6b7280',
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </span>
              ))}
            </div>

            {/* ── Bar chart (no YAxis) ── */}
            <div className="flex-1 min-w-0">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={overviewData}
                  barCategoryGap="12%"
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis domain={[0, OVERVIEW_MAX]} ticks={[0, 1500, 3000, 4500, 6000]} hide />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.1)', fontSize: 12 }}
                    formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="fg" name="Revenue" shape={<OverviewBarShape />} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-span-2 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800">Recent Sales</h2>
          <p className="mb-4 text-xs text-gray-400">You made {stats?.totalSales ?? 0} sales this month</p>
          <div className="space-y-4">
            {recentSales.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-500">
                  {s.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 leading-tight">{s.name}</p>
                  <p className="text-xs text-gray-400 truncate">{s.email}</p>
                </div>
                <span className="text-sm font-semibold text-gray-800 shrink-0">+${typeof s.amount === 'number' ? s.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : s.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* STATS SECTION 1  2x2 chart cards */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-gray-800 shrink-0">Stats</h2>
          <FilterBar showAddEdit />
        </div>
        <div className="grid grid-cols-2 gap-4">

          {/* Total Earning — dual-line chart */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-gray-800">Total Earning</p>
            <p className="mt-0.5 text-2xl font-bold text-gray-900">$ {(stats?.totalEarnings ?? 112893).toLocaleString()}.00</p>
            <p className="text-xs text-green-500 font-medium mb-1">trend title <span className="bg-green-100 text-green-600 rounded px-1 ml-1">70.5%</span></p>
            <span className="text-xs border border-gray-200 rounded-full px-2.5 py-0.5 text-gray-500 cursor-pointer mb-3 inline-block">This Week ▾</span>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={earningLineData}>
                <CartesianGrid strokeDasharray="0" stroke="#f3f4f6" vertical={true} horizontal={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} domain={[0, 100]} ticks={[0]} width={20} />
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.1)', fontSize: 12 }} />
                <Line type="monotone" dataKey="a" stroke="#22C55E" strokeWidth={2.5}
                  dot={{ r: 5, fill: '#ffffff', stroke: '#22C55E', strokeWidth: 2 }} name="Revenue" />
                <Line type="monotone" dataKey="b" stroke="#A7F3D0" strokeWidth={2}
                  dot={{ r: 4, fill: '#ffffff', stroke: '#A7F3D0', strokeWidth: 2 }} name="Expenses" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* green vertical bar */}
          <div className="rounded-2xl bg-white pt-5 px-5 pb-0 shadow-sm flex flex-col">
            <p className="text-sm font-bold text-gray-800">Total Earning</p>
            <p className="mt-0.5 text-2xl font-bold text-gray-900">$ {(stats?.totalEarnings ?? 112893).toLocaleString()}.00</p>
            <p className="text-xs text-green-500 font-bold mb-2">trend title <span className="bg-green-100 text-green-600 rounded px-1 ml-1">70.5%</span></p>
            <div className="mt-auto">
              <ResponsiveContainer width="100%" height={110}>
              <BarChart data={greenBarData} barCategoryGap="20%" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="greenGrayFade" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#D1D5DB" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#D1D5DB" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <YAxis hide domain={[0, 100]} />
                <Bar dataKey="v" stackId="b" fill="#22C55E" />
                <Bar dataKey="rest" stackId="b" fill="url(#greenGrayFade)" />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </div>          {/* teal+green grouped bars (weekly) — Chart.js component */}
          <EarningChart
            totalEarnings={stats?.totalEarnings ?? 112893}
            weeklyData={stats?.weeklyOverviewData}
          />

          {/* yellow dot line */}
          <div className="rounded-2xl bg-white pt-5 px-5 pb-0 shadow-sm flex flex-col">
            <p className="text-sm font-bold text-gray-800">Subscriptions</p>
            <p className="mt-0.5 text-2xl font-bold text-gray-900">+ {(stats?.subscriptions ?? 112893).toLocaleString()}</p>
            <p className="text-xs text-green-500 font-bold mb-2">trend title <span className="bg-green-100 text-green-600 rounded px-1 ml-1">70.5%</span></p>
            <div className="mt-auto">
              <ResponsiveContainer width="100%" height={110}>
              <LineChart data={yellowDotData}>
                <Line type="monotone" dataKey="v" stroke="#F59E0B" strokeWidth={2}
                  dot={{ r: 5, fill: '#F59E0B', strokeWidth: 2, stroke: '#FFFFFF' }} />
              </LineChart>
            </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* STATS SECTION 2  3 mini sparkline cards */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-gray-800 shrink-0">Stats</h2>
          <FilterBar showAddEdit startIdx={statsRange.start} endIdx={statsRange.end}
            onRangeChange={(s, e) => setStatsRange({ start: Math.min(s, e), end: Math.max(s, e) })} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { title: 'Total Earning', value: `+${(stats?.totalEarnings ?? 112893).toLocaleString()}`, c1: '#22C55E', field: 'total' as const },
            { title: 'Total Sales', value: `+${(stats?.totalSales ?? 112893).toLocaleString()}`, c1: '#A855F7', field: 'sales' as const },
            { title: 'Total Views', value: `+${(stats?.totalRevenue ?? 112893).toLocaleString()}`, c1: '#F59E0B', field: 'views' as const },
          ].map((item) => {
            const monthly = stats?.monthlySalesData ?? [];
            const sliced = monthly.slice(statsRange.start, statsRange.end + 1);
            const prevStart = Math.max(0, statsRange.start - sliced.length);
            const prevSliced = monthly.slice(prevStart, statsRange.start);
            // More data points for angular, spiky lines like the reference
            const fallbacks: Record<string, number[][]> = {
              total: [[30, 25, 40, 28, 55, 35, 50, 40, 70, 65, 50, 72], [50, 40, 35, 55, 60, 40, 70, 55, 45, 60, 65, 55]],
              sales: [[25, 30, 40, 20, 35, 45, 50, 30, 20, 55, 50, 60], [35, 25, 30, 50, 45, 55, 40, 50, 48, 35, 40, 35]],
              views: [[40, 38, 35, 42, 50, 45, 55, 52, 48, 50, 52, 55], [30, 35, 45, 40, 50, 42, 35, 40, 48, 42, 45, 48]],
            };
            const fb = fallbacks[item.field] ?? fallbacks.total;
            // Always use 12 data points for consistent look
            const scaledData = Array.from({ length: 12 }, (_, i) => {
              const currentVal = sliced[i]?.value ?? fb[0][i % fb[0].length];
              const prevVal = prevSliced[i]?.value ?? fb[1][i % fb[1].length];
              return { x: i, a: currentVal, b: prevVal };
            });
            // Shift so minimum is near 0
            const allVals = scaledData.flatMap((d) => [d.a, d.b]);
            const minVal = Math.min(...allVals);
            const finalData = scaledData.map((d) => ({ x: d.x, a: d.a - minVal, b: d.b - minVal }));
            const startLabel = `${MONTH_SHORT[statsRange.start]} 20th`;
            const endLabel = `${MONTH_SHORT[statsRange.end]} 20th`;
            return (
              <div key={item.title} className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-sm font-bold text-gray-800">{item.title}</p>
                <p className="mt-0.5 text-2xl font-bold text-gray-900">{item.value}</p>
                <p className="text-xs text-green-500 font-bold mb-3">trend title <span className="bg-green-100 text-green-600 rounded px-1 ml-1">70.5%</span></p>
                <ResponsiveContainer width="100%" height={90}>
                  <LineChart data={finalData} margin={{ left: 0, right: 0, top: 5, bottom: 0 }}>
                    <YAxis domain={[0, 'auto']} hide />
                    <XAxis dataKey="x" hide />
                    <ReferenceLine y={0} stroke="#9ca3af" strokeWidth={1} />
                    <Line type="linear" dataKey="a" stroke={item.c1} strokeWidth={2} dot={false} />
                    <Line type="linear" dataKey="b" stroke="#9ca3af" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex items-center mt-1">
                  <span className="text-[10px] text-gray-400 mr-2">0</span>
                  <span className="text-[10px] text-gray-400">{startLabel}</span>
                  <span className="flex-1" />
                  <span className="text-[10px] text-gray-400">{endLabel}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM 3-COLUMN */}
      <div className="grid grid-cols-3 gap-4">

        {/* Subscriptions Performers */}
        <div className="flex flex-col rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-800">Subscriptions Performers</p>
          <p className="text-xs text-gray-400 mb-4">Follower This Years</p>
          <div className="flex-1" />
          <div className="flex items-end justify-center gap-2">
            <p className="text-5xl font-black text-gray-900">+500</p>
            <span className="text-gray-900 text-xl mb-1">▲</span>
          </div>
          <div className="flex-1" />
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={subBarData} barCategoryGap="15%">
              <Bar dataKey="v" fill="#F59E0B" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <button className="mt-3 w-full rounded-lg bg-green-500 py-2.5 text-sm font-semibold text-white hover:bg-green-600 transition">
            Get Started
          </button>
        </div>

        {/* Top Sales Product */}
        <div className="rounded-2xl bg-white p-5 shadow-sm flex flex-col">
          <p className="text-sm font-bold text-gray-800">Top Sales Product</p>
          <p className="text-xs text-gray-400 mb-4">Manage your payments.</p>
          <div className="border border-gray-100 rounded-lg overflow-hidden flex-1 flex flex-col">
            <div className="grid grid-cols-[auto_1fr_auto] px-4 py-2 bg-gray-50/50 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-400">Product</span>
              <span className="text-xs font-medium text-gray-400 text-center"></span>
              <span className="text-xs font-medium text-gray-400 text-right">Amount</span>
            </div>
            <div className="flex-1">
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-200 last:border-b-0">
                  <div className="h-8 w-8 rounded bg-linear-to-br from-gray-600 to-gray-800 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-600 truncate">{p.email}</p>
                    <p className="text-[10px] text-gray-500">02/10/2034</p>
                  </div>
                  <span className="text-xs font-bold text-gray-800">{p.amount}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button className="rounded border border-green-500 px-3 py-1 text-xs font-medium text-green-600 hover:bg-green-50">Previous</button>
            <button className="rounded bg-green-500 px-3 py-1 text-xs font-semibold text-white hover:bg-green-600">Next</button>
          </div>
        </div>

        {/* Payment History */}
        <div className="rounded-2xl bg-white p-5 shadow-sm flex flex-col">
          <p className="text-base font-bold text-gray-800">Payment History</p>
          <p className="text-xs text-gray-400 mb-4">Manage your payments.</p>
          <div className="border border-gray-100 rounded-lg overflow-hidden flex-1 flex flex-col">
            <div className="grid grid-cols-[auto_1fr_auto] px-4 py-2 bg-gray-50/50 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-400 w-20">Status</span>
              <span className="text-xs font-medium text-gray-400 text-center">Email</span>
              <span className="text-xs font-medium text-gray-400 text-right">Amount</span>
            </div>
            <div className="flex-1">
              {paymentRows.map((p, i) => (
                <div key={i} className="grid grid-cols-[auto_1fr_auto] items-center px-4 py-3 border-b border-gray-200 last:border-b-0">
                  <div className="flex items-center gap-2 w-20">
                    <div className="h-4 w-4 rounded-sm border-[1.5px] border-green-600 shrink-0" />
                    <span className="text-xs font-bold text-gray-800">{p.status}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-600 truncate text-center">{p.email}</span>
                  <span className="text-xs font-bold text-gray-800 text-right">{p.amount}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button className="rounded border border-green-500 px-3 py-1 text-xs font-medium text-green-600 hover:bg-green-50">Previous</button>
            <button className="rounded bg-green-500 px-3 py-1 text-xs font-semibold text-white hover:bg-green-600">Next</button>
          </div>
        </div>

      </div>
    </div>
  );
}
