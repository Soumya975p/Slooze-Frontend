'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from '@apollo/client/react';
import { UploadCloud, X, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { GET_PRODUCT, UPDATE_PRODUCT_MUTATION } from '@/lib/graphql/products';
import type { Product } from '@/lib/types';

interface GetProductData { product: Product }

const CATEGORIES = ['Energy', 'Metals', 'Agriculture', 'Other'];
const SUBCATEGORIES: Record<string, string[]> = {
  Energy: ['Crude Oil', 'Natural Gas', 'Coal'],
  Metals: ['Gold', 'Silver', 'Copper', 'Platinum', 'Aluminium'],
  Agriculture: ['Wheat', 'Corn', 'Soybeans'],
  Other: ['General'],
};

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [toast, setToast] = useState('');

  const [form, setForm] = useState({
    name: '', sku: '', stock: '', price: '', discount: '', purchase: '',
    description: '', category: '', subcategory: '', tags: [] as string[], tagInput: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && user?.role !== 'MANAGER') router.replace('/products');
  }, [user, authLoading, router]);

  const { data: productData, loading: fetching } = useQuery<GetProductData>(GET_PRODUCT, {
    variables: { id },
    skip: !id,
  });

  // Pre-fill form when product is loaded
  useEffect(() => {
    if (!productData?.product) return;
    const p = productData.product;
    setForm((f) => ({
      ...f,
      name: p.name,
      sku: p.sku,
      stock: String(p.stock),
      price: String(p.price),
      discount: p.discount != null ? String(p.discount) : '',
      purchase: p.purchase != null ? String(p.purchase) : '',
    }));
  }, [productData]);

  const [updateProduct, { loading }] = useMutation(UPDATE_PRODUCT_MUTATION, {
    onCompleted: () => {
      setToast('Product updated successfully!');
      setTimeout(() => router.push('/products'), 1500);
    },
    onError: (err) => setToast(`Error: ${err.message}`),
  });

  const set = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.sku.trim()) e.sku = 'SKU is required';
    if (!form.stock || isNaN(Number(form.stock))) e.stock = 'Valid stock required';
    if (!form.price || isNaN(Number(form.price))) e.price = 'Valid price required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await updateProduct({
      variables: {
        id,
        input: {
          name: form.name,
          sku: form.sku,
          stock: parseInt(form.stock),
          price: parseFloat(form.price),
          discount: form.discount ? parseFloat(form.discount) : undefined,
          purchase: form.purchase ? parseFloat(form.purchase) : undefined,
        },
      },
    });
  };

  const addTag = () => {
    const t = form.tagInput.trim();
    if (t && !form.tags.includes(t)) setForm((f) => ({ ...f, tags: [...f.tags, t], tagInput: '' }));
  };
  const removeTag = (t: string) => setForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }));

  const Field = ({ label, field, type = 'text', placeholder = '' }: { label: string; field: string; type?: string; placeholder?: string }) => (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      <input
        type={type}
        value={form[field as keyof typeof form] as string}
        onChange={(e) => set(field, e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-purple-200 dark:bg-slate-700 dark:text-white ${errors[field] ? 'border-red-400' : 'border-slate-200 dark:border-slate-600'}`}
      />
      {errors[field] && <p className="mt-1 text-xs text-red-500">{errors[field]}</p>}
    </div>
  );

  if (authLoading || fetching) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed right-6 top-6 z-50 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg ${toast.startsWith('Error') ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Edit Product</h1>
          <p className="flex items-center gap-1 text-xs text-slate-400">
            <Link href="/products" className="hover:text-purple-500">Products</Link>
            <ChevronRight size={12} /> Edit
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/products" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
            Cancel
          </Link>
          <button
            form="edit-product-form"
            type="submit"
            disabled={loading}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
          >
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      <form id="edit-product-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="space-y-5 xl:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h2 className="mb-4 font-semibold text-slate-800 dark:text-white">General Information</h2>
              <div className="space-y-4">
                <Field label="Product Name" field="name" placeholder="e.g. Crude Oil Barrels" />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                  <textarea
                    rows={5}
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    placeholder="Describe the product…"
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => { set('category', e.target.value); set('subcategory', ''); }}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Sub-category</label>
                    <select
                      value={form.subcategory}
                      onChange={(e) => set('subcategory', e.target.value)}
                      disabled={!form.category}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    >
                      <option value="">Select sub-category</option>
                      {(SUBCATEGORIES[form.category] ?? []).map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Keywords / Tags</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.tagInput}
                      onChange={(e) => set('tagInput', e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Press Enter to add tag"
                      className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    />
                    <button type="button" onClick={addTag} className="rounded-lg bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700">Add</button>
                  </div>
                  {form.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {form.tags.map((t) => (
                        <span key={t} className="flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-200">
                          {t}
                          <button type="button" onClick={() => removeTag(t)}><X size={11} /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="SKU" field="sku" placeholder="e.g. CRUD-OIL-001" />
                  <Field label="Stock" field="stock" type="number" placeholder="e.g. 100" />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h2 className="mb-4 font-semibold text-slate-800 dark:text-white">Pricing</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Price ($)" field="price" type="number" placeholder="0.00" />
                <Field label="Discount (%)" field="discount" type="number" placeholder="0" />
                <Field label="Purchase Price ($)" field="purchase" type="number" placeholder="0.00" />
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h2 className="mb-4 font-semibold text-slate-800 dark:text-white">Featured Product</h2>
              <div className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center hover:border-purple-400 dark:border-slate-600 dark:bg-slate-700/50">
                <UploadCloud size={32} className="text-slate-400" />
                <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">Drop your image here</p>
                <p className="text-xs text-slate-400">PNG, JPG up to 5MB</p>
                <button type="button" className="mt-4 rounded-lg border border-slate-300 px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-500 dark:text-slate-300">Browse File</button>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h2 className="mb-4 font-semibold text-slate-800 dark:text-white">Thumbnail Product</h2>
              <div className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-purple-400 dark:border-slate-600 dark:bg-slate-700/50">
                <UploadCloud size={24} className="text-slate-400" />
                <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-300">Drop thumbnail here</p>
                <button type="button" className="mt-3 rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-500 dark:text-slate-300">Browse</button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
