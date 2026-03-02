'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@apollo/client/react';
import { Image as ImageIcon, Plus, ChevronDown, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { CREATE_PRODUCT_MUTATION, GET_PRODUCTS } from '@/lib/graphql/products';

interface FormState {
  name: string;
  sku: string;
  stock: string;
  price: string;
  discount: string;
  purchase: string;
  description: string;
  category: string;
  tagKeyword: string;
  discountCategory: string;
}

const CATEGORIES = ['Energy', 'Metals', 'Agriculture', 'Tech Products', 'Other'];

export default function AddProductPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [toast, setToast] = useState('');
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [thumbnailImage, setThumbnailImage] = useState<string | null>(null);
  const previewInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>({
    name: '', sku: '', stock: '', price: '', discount: '', purchase: '',
    description: '', category: '', tagKeyword: '', discountCategory: '',
  });

  useEffect(() => {
    if (!authLoading && user?.role !== 'MANAGER') router.replace('/products');
  }, [user, authLoading, router]);

  const [createProduct, { loading }] = useMutation(CREATE_PRODUCT_MUTATION, {
    refetchQueries: [{ query: GET_PRODUCTS }],
    awaitRefetchQueries: true,
    onCompleted: (data: any) => {
      // Save thumbnail to localStorage if one was selected
      const productId = data?.createProduct?.id;
      if (productId && thumbnailImage) {
        try {
          const thumbs = JSON.parse(localStorage.getItem('product_thumbnails') || '{}');
          thumbs[productId] = thumbnailImage;
          localStorage.setItem('product_thumbnails', JSON.stringify(thumbs));
        } catch { /* ignore storage errors */ }
      }
      setToast('Product created successfully!');
      setTimeout(() => router.push('/products'), 1500);
    },
    onError: (err) => setToast(`Error: ${err.message}`),
  });

  const set = (field: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validate = () => {
    const e: Partial<FormState> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.price || isNaN(Number(form.price))) e.price = 'Valid price required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await createProduct({
      variables: {
        input: {
          name: form.name,
          sku: form.sku || `SKU-${Date.now()}`,
          stock: parseInt(form.stock) || 0,
          price: parseFloat(form.price),
          discount: form.discount ? parseFloat(form.discount) : undefined,
          purchase: form.purchase ? parseFloat(form.purchase) : undefined,
        },
      },
    });
  };

  const handleDiscard = () => {
    setForm({
      name: '', sku: '', stock: '', price: '', discount: '', purchase: '',
      description: '', category: '', tagKeyword: '', discountCategory: '',
    });
    setErrors({});
    setPreviewImage(null);
    setThumbnailImage(null);
  };

  const handleImageSelect = (file: File, type: 'preview' | 'thumbnail') => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (type === 'preview') setPreviewImage(result);
      else setThumbnailImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent, type: 'preview' | 'thumbnail') => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageSelect(file, type);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  if (authLoading) return null;

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed right-6 top-6 z-50 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg transition ${toast.startsWith('Error') ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast}
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Add Product</h1>
        <Link
          href="/products/add"
          className="flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-600 transition"
        >
          <Plus size={15} />
          Add New Product
        </Link>
      </div>

      {/* Sub-header: Add New Product + action buttons */}
      <div className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800">Add New Product</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDiscard}
            className="rounded-lg border border-red-400 px-4 py-1.5 text-sm font-medium text-red-500 hover:bg-red-50 transition"
          >
            Discard Change
          </button>
          <button
            form="product-form"
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-500 px-5 py-1.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-60 transition"
          >
            {loading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* Form */}
      <form id="product-form" onSubmit={handleSubmit}>
        <div className="flex gap-5">
          {/* LEFT COLUMN */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* General Information */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-gray-800 mb-4">Generar Information</h3>

              {/* Product Name */}
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-gray-600">Product Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="Product Name"
                  className={`w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-sm text-gray-600 placeholder-gray-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
              </div>

              {/* Product Category */}
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-gray-600">Product Category</label>
                <div className="relative">
                  <select
                    value={form.category}
                    onChange={(e) => set('category', e.target.value)}
                    className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Product Category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Descriptions */}
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-gray-600">Descriptions</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Description"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600 placeholder-gray-400 outline-none resize-y transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Tag Keyword */}
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-gray-600">Tag Keywoder</label>
                <textarea
                  rows={3}
                  value={form.tagKeyword}
                  onChange={(e) => set('tagKeyword', e.target.value)}
                  placeholder="Tag Keywoder"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600 placeholder-gray-400 outline-none resize-y transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Pricing section */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-gray-800 mb-4">Pricing</h3>

              {/* Price */}
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-gray-600">Proce</label>
                <input
                  type="text"
                  value={form.price}
                  onChange={(e) => set('price', e.target.value)}
                  placeholder="Procing"
                  className={`w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-sm text-gray-600 placeholder-gray-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${errors.price ? 'border-red-400' : 'border-gray-200'}`}
                />
                {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}
              </div>

              {/* Discount + Discount Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-600">Discount</label>
                  <input
                    type="text"
                    value={form.discount}
                    onChange={(e) => set('discount', e.target.value)}
                    placeholder="Discount"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600 placeholder-gray-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-600">Discount Category</label>
                  <div className="relative">
                    <select
                      value={form.discountCategory}
                      onChange={(e) => set('discountCategory', e.target.value)}
                      className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Discount Category</option>
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Image uploads */}
          <div className="w-72 shrink-0 space-y-6">
            {/* Hidden file inputs */}
            <input
              ref={previewInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageSelect(file, 'preview');
              }}
            />
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageSelect(file, 'thumbnail');
              }}
            />

            {/* Previews Product */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h3 className="text-base font-bold text-gray-800">Previews Product</h3>
              <p className="text-xs text-gray-400 mb-3">Drag And Your Image Here</p>
              {previewImage ? (
                <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
                  <img src={previewImage} alt="Preview" className="w-full h-44 object-cover" />
                  <button
                    type="button"
                    onClick={() => setPreviewImage(null)}
                    className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => previewInputRef.current?.click()}
                  onDrop={(e) => handleDrop(e, 'preview')}
                  onDragOver={handleDragOver}
                  className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-12 text-center transition hover:border-blue-400"
                >
                  <ImageIcon size={36} className="text-gray-300" />
                  <p className="mt-3 text-sm text-gray-400">Drag and drop here</p>
                </div>
              )}
            </div>

            {/* Thumbnail Product */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h3 className="text-base font-bold text-gray-800">Thumnail Product</h3>
              <p className="text-xs text-gray-400 mb-3">Drag And Your Image Here</p>
              {thumbnailImage ? (
                <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
                  <img src={thumbnailImage} alt="Thumbnail" className="w-full h-44 object-cover" />
                  <button
                    type="button"
                    onClick={() => setThumbnailImage(null)}
                    className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => thumbnailInputRef.current?.click()}
                  onDrop={(e) => handleDrop(e, 'thumbnail')}
                  onDragOver={handleDragOver}
                  className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-12 text-center transition hover:border-blue-400"
                >
                  <ImageIcon size={36} className="text-gray-300" />
                  <p className="mt-3 text-sm text-gray-400">Drag and drop here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
