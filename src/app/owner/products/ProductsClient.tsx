'use client'

import { useState } from 'react'
import { Package, Plus, AlertTriangle, X, Search } from 'lucide-react'

type Category = { id: string; name: string }
type Supplier = { id: string; name: string }
type Product = {
  id: string
  name: string
  description: string | null
  sku: string | null
  costPrice: number
  sellPrice: number
  stock: number
  minStock: number
  category: Category | null
  supplier: Supplier | null
}

type Props = {
  products: Product[]
  categories: Category[]
  suppliers: Supplier[]
}

export default function ProductsClient({ products: initial, categories, suppliers }: Props) {
  const [products, setProducts] = useState(initial)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [form, setForm] = useState({
    name: '', description: '', sku: '', categoryId: '', supplierId: '',
    costPrice: '', sellPrice: '', stock: '0', minStock: '1',
  })

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku?.toLowerCase().includes(search.toLowerCase()) ?? false)
    const matchCat = !filterCat || p.category?.id === filterCat
    return matchSearch && matchCat
  })

  const lowStockCount = products.filter(p => p.stock <= p.minStock).length

  function openAdd() {
    setForm({ name: '', description: '', sku: '', categoryId: '', supplierId: '', costPrice: '', sellPrice: '', stock: '0', minStock: '1' })
    setEditProduct(null)
    setShowAdd(true)
  }

  function openEdit(p: Product) {
    setForm({
      name: p.name,
      description: p.description ?? '',
      sku: p.sku ?? '',
      categoryId: p.category?.id ?? '',
      supplierId: p.supplier?.id ?? '',
      costPrice: String(p.costPrice),
      sellPrice: String(p.sellPrice),
      stock: String(p.stock),
      minStock: String(p.minStock),
    })
    setEditProduct(p)
    setShowAdd(true)
  }

  async function handleSave() {
    if (!form.name || !form.costPrice || !form.sellPrice) return
    setSaving(true)
    try {
      const body = {
        name: form.name,
        description: form.description || null,
        sku: form.sku || null,
        categoryId: form.categoryId || null,
        supplierId: form.supplierId || null,
        costPrice: parseFloat(form.costPrice),
        sellPrice: parseFloat(form.sellPrice),
        stock: parseInt(form.stock) || 0,
        minStock: parseInt(form.minStock) || 1,
      }

      if (editProduct) {
        const res = await fetch(`/api/v1/products/${editProduct.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        })
        const updated = await res.json()
        setProducts(prev => prev.map(p => p.id === editProduct.id ? { ...p, ...updated } : p))
      } else {
        const res = await fetch('/api/v1/products', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        })
        const created = await res.json()
        setProducts(prev => [created, ...prev])
      }
      setShowAdd(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this product?')) return
    await fetch(`/api/v1/products/${id}`, { method: 'DELETE' })
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Package className="w-6 h-6" /> Products</h1>
          <p className="text-sm text-gray-500 mt-1">{products.length} products · {lowStockCount > 0 && <span className="text-amber-600 font-medium">{lowStockCount} low stock</span>}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {lowStockCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2 mb-4 text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {lowStockCount} product{lowStockCount > 1 ? 's are' : ' is'} at or below minimum stock level.
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or SKU..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Cost</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Sell</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Stock</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">No products found</td></tr>
            )}
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium">{p.name}</div>
                  {p.sku && <div className="text-xs text-gray-400">SKU: {p.sku}</div>}
                </td>
                <td className="px-4 py-3 text-gray-600">{p.category?.name ?? '—'}</td>
                <td className="px-4 py-3 text-right">₹{Number(p.costPrice).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-right">₹{Number(p.sellPrice).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-medium ${p.stock <= p.minStock ? 'text-red-600' : 'text-gray-800'}`}>
                    {p.stock}
                  </span>
                  {p.stock <= p.minStock && <AlertTriangle className="inline ml-1 w-3 h-3 text-amber-500" />}
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(p)} className="text-blue-600 hover:underline text-xs mr-3">Edit</button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:underline text-xs">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold">{editProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowAdd(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Product Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. RAM 8GB DDR4" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">SKU / Code</label>
                  <input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. RAM-8G-DDR4" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                  <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="">None</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Supplier</label>
                <select value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">None</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Cost Price (₹) *</label>
                  <input type="number" value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Sell Price (₹) *</label>
                  <input type="number" value={form.sellPrice} onChange={e => setForm(f => ({ ...f, sellPrice: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Current Stock</label>
                  <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Min Stock Alert</label>
                  <input type="number" value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t">
              <button onClick={() => setShowAdd(false)} className="flex-1 border rounded-lg py-2 text-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">
                {saving ? 'Saving...' : editProduct ? 'Save Changes' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
