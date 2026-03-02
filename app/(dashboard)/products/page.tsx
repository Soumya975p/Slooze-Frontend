'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Plus, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Filter, Download, ArrowUpDown,
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/lib/auth-context';
import { GET_PRODUCTS, DELETE_PRODUCT_MUTATION } from '@/lib/graphql/products';
import type { Product } from '@/lib/types';

interface GetProductsData { products: Product[] }

type SortKey = 'name' | 'stock' | 'price' | 'purchase';

const SPARK = [30, 45, 28, 60, 40, 80, 55];
const sparkData = SPARK.map((v) => ({ v }));

/* Mini sparkline data for Total Views card */
const viewsSparkData = [
  { a: 30, b: 50 }, { a: 45, b: 35 }, { a: 28, b: 60 }, { a: 55, b: 40 },
  { a: 40, b: 70 }, { a: 70, b: 45 }, { a: 50, b: 65 },
];

export default function ProductsPage() {
  const { user } = useAuth();
  const isManager = user?.role === 'MANAGER';

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'published' | 'draft'>('published');
  const [showFilter, setShowFilter] = useState(false);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem('product_thumbnails');
      if (stored) setThumbs(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const pageSize = 15;

  const { data, loading, refetch } = useQuery<GetProductsData>(GET_PRODUCTS, {
    variables: { search: search || undefined },
  });

  const [deleteProduct, { loading: deleting }] = useMutation(DELETE_PRODUCT_MUTATION, {
    onCompleted: () => refetch(),
  });

  const products = [...(data?.products ?? [])].reverse();

  const sorted = useMemo(() => {
    return [...products].sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === 'asc' ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });
  }, [products, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  const toggleAll = () => {
    if (selected.size === paginated.length) setSelected(new Set());
    else setSelected(new Set(paginated.map((p) => p.id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await deleteProduct({ variables: { id } });
    setSelected((s) => { const n = new Set(s); n.delete(id); return n; });
  };

  const SortIcon = ({ col }: { col: SortKey }) => (
    <ArrowUpDown size={14} className={sortKey === col ? 'text-gray-700' : 'text-gray-400'} />
  );

  const SkeletonRow = () => (
    <tr>
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 w-full animate-pulse rounded bg-slate-200" />
        </td>
      ))}
    </tr>
  );

  /* Generate visible page numbers for pagination */
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Product</h1>
        {isManager && (
          <Link
            href="/products/add"
            className="flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-600 transition"
          >
            <Plus size={15} />
            Add New Product
          </Link>
        )}
      </div>

      {/* Tabs + Filters + Total Views card layout */}
      <div className="flex gap-4">
        {/* Left: Table section */}
        <div className="flex-1 min-w-0">
          {/* Tabs and filter row */}
          <div className="flex items-center justify-between mb-4">
            {/* Published / Draft tabs */}
            <div className="flex gap-0">
              <button
                onClick={() => { setActiveTab('published'); setPage(1); }}
                className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'published'
                  ? 'border-gray-800 text-gray-800'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
              >
                Published
              </button>
              <button
                onClick={() => { setActiveTab('draft'); setPage(1); }}
                className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'draft'
                  ? 'border-gray-800 text-gray-800'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
              >
                Darft
              </button>
            </div>

            {/* Filter + Download buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilter(!showFilter)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                Filter
                <ChevronDown size={14} className="text-gray-400" />
              </button>
              <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition">
                Download
                <ChevronDown size={14} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-400">
                  <th className="w-10 px-4 py-3"></th>
                  <th className="px-4 py-3">
                    <span
                      className="flex items-center gap-1 cursor-pointer select-none"
                      onClick={() => toggleSort('name')}
                    >
                      Product Name <SortIcon col="name" />
                    </span>
                  </th>
                  <th className="px-4 py-3">
                    <span
                      className="flex items-center gap-1 cursor-pointer select-none"
                      onClick={() => toggleSort('stock')}
                    >
                      Views <SortIcon col="stock" />
                    </span>
                  </th>
                  <th className="px-4 py-3">
                    <span
                      className="flex items-center gap-1 cursor-pointer select-none"
                      onClick={() => toggleSort('price')}
                    >
                      Pricing <SortIcon col="price" />
                    </span>
                  </th>
                  <th className="px-4 py-3">
                    <span
                      className="flex items-center gap-1 cursor-pointer select-none"
                      onClick={() => toggleSort('purchase')}
                    >
                      Revenue <SortIcon col="purchase" />
                    </span>
                  </th>
                  <th className="px-4 py-3">
                    <span className="flex items-center gap-1">
                      Manage <SortIcon col="name" />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading
                  ? [...Array(8)].map((_, i) => <SkeletonRow key={i} />)
                  : paginated.length === 0
                    ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-400">
                          No products found.
                        </td>
                      </tr>
                    )
                    : paginated.map((product) => (
                      <tr key={product.id} className="transition-colors hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(product.id)}
                            onChange={() => toggleOne(product.id)}
                            className="h-4 w-4 rounded border-gray-300 accent-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg shrink-0 flex items-center justify-center overflow-hidden bg-blue-100">
                              {thumbs[product.id] ? (
                                <img src={thumbs[product.id]} alt={product.name} className="h-8 w-8 object-cover" />
                              ) : (
                                <span className="text-xs font-bold text-blue-500">{product.name.charAt(0)}</span>
                              )}
                            </div>
                            <span className="font-medium text-gray-800">{product.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {(product.stock * 1000).toLocaleString(undefined, { minimumFractionDigits: 3 })}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          ${product.price.toLocaleString(undefined, { minimumFractionDigits: 3 })}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          ${((product.purchase ?? product.price) * 1000).toLocaleString(undefined, { minimumFractionDigits: 3 })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isManager ? (
                              <>
                                <Link
                                  href={`/products/${product.id}/edit`}
                                  className="rounded-lg bg-gray-100 px-4 py-1.5 text-sm text-gray-500 hover:bg-gray-200 transition-colors"
                                >
                                  Edit
                                </Link>
                                <button
                                  onClick={() => handleDelete(product.id)}
                                  disabled={deleting}
                                  className="rounded-lg bg-gray-100 px-4 py-1.5 text-sm text-gray-500 hover:bg-gray-200 transition-colors disabled:opacity-40"
                                >
                                  Delete
                                </button>
                              </>
                            ) : (
                              <span className="rounded-lg bg-gray-100 px-4 py-1.5 text-sm text-gray-500">View</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-1 mt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-white hover:text-gray-600 disabled:opacity-30 transition"
            >
              <ChevronLeft size={16} />
            </button>
            {getPageNumbers().map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${page === p
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-white hover:text-gray-800'
                  }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-white hover:text-gray-600 disabled:opacity-30 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Right: Total Views card */}
        <div className="w-56 shrink-0">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs text-gray-500">Total Views</p>
            <p className="mt-1 text-xl font-bold text-gray-900">+ 112,893</p>
            <p className="text-xs text-green-500 font-medium mt-1">
              trend title{' '}
              <span className="bg-green-100 text-green-600 rounded px-1 ml-1 inline-flex items-center gap-0.5">
                <span className="inline-block h-1.5 w-1.5 rounded-sm bg-green-500" />
                <span className="inline-block h-1.5 w-1.5 rounded-sm bg-blue-500" />
              </span>
            </p>
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={60}>
                <LineChart data={viewsSparkData}>
                  <Line type="monotone" dataKey="a" stroke="#22C55E" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="b" stroke="#F59E0B" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-2 flex justify-between text-xs text-gray-400">
                <span>Nov 20th</span>
                <span>Dec 20th</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
