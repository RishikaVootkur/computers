'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ShoppingCart } from 'lucide-react'

type Supplier = { id: string; name: string }
type Product = { id: string; name: string; sku: string | null; costPrice: number; stock: number; category: { name: string } | null }

type LineItem = { productId: string; quantity: number; costAtTime: number }

export default function NewPurchaseClient({ suppliers, products }: { suppliers: Supplier[]; products: Product[] }) {
  const router = useRouter()
  const [supplierId, setSupplierId] = useState('')
  const [notes, setNotes] = useState('')
  const [purchasedAt, setPurchasedAt] = useState(new Date().toISOString().split('T')[0])
  const [items, setItems] = useState<LineItem[]>([{ productId: '', quantity: 1, costAtTime: 0 }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function addLine() {
    setItems(prev => [...prev, { productId: '', quantity: 1, costAtTime: 0 }])
  }

  function removeLine(i: number) {
    setItems(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateLine(i: number, field: keyof LineItem, value: string | number) {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== i) return item
      const updated = { ...item, [field]: value }
      if (field === 'productId') {
        const product = products.find(p => p.id === value)
        if (product) updated.costAtTime = Number(product.costPrice)
      }
      return updated
    }))
  }

  const total = items.reduce((s, i) => s + i.quantity * i.costAtTime, 0)
  const isValid = items.length > 0 && items.every(i => i.productId && i.quantity > 0 && i.costAtTime >= 0)

  async function handleSubmit() {
    if (!isValid) { setError('Fill all line items correctly'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/v1/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId: supplierId || null, items, notes, purchasedAt }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed'); return }
      const po = await res.json()
      router.push(`/owner/purchases/${po.id}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <ShoppingCart className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold">New Purchase Order</h1>
      </div>

      <div className="bg-white border rounded-xl p-5 space-y-4 mb-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Supplier</label>
            <select value={supplierId} onChange={e => setSupplierId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">Walk-in / Unknown</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Purchase Date</label>
            <input type="date" value={purchasedAt} onChange={e => setPurchasedAt(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Optional notes..." />
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white border rounded-xl overflow-hidden mb-5">
        <div className="px-4 py-3 border-b bg-gray-50 font-medium text-sm">Items</div>
        <div className="divide-y">
          {items.map((item, i) => (
            <div key={i} className="p-4 flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Product</label>
                <select value={item.productId} onChange={e => updateLine(i, 'productId', e.target.value)}
                  className="w-full border rounded-lg px-2 py-1.5 text-sm">
                  <option value="">Select product...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ''}</option>)}
                </select>
              </div>
              <div className="w-20">
                <label className="block text-xs text-gray-500 mb-1">Qty</label>
                <input type="number" min={1} value={item.quantity} onChange={e => updateLine(i, 'quantity', parseInt(e.target.value) || 1)}
                  className="w-full border rounded-lg px-2 py-1.5 text-sm" />
              </div>
              <div className="w-28">
                <label className="block text-xs text-gray-500 mb-1">Cost (₹)</label>
                <input type="number" min={0} step="0.01" value={item.costAtTime} onChange={e => updateLine(i, 'costAtTime', parseFloat(e.target.value) || 0)}
                  className="w-full border rounded-lg px-2 py-1.5 text-sm" />
              </div>
              <div className="w-24 text-right text-sm font-medium pt-5">
                ₹{(item.quantity * item.costAtTime).toLocaleString('en-IN')}
              </div>
              <button onClick={() => removeLine(i)} disabled={items.length === 1}
                className="text-red-400 hover:text-red-600 disabled:opacity-30 mb-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t">
          <button onClick={addLine} className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      {/* Total */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 mb-5">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-700">Total Purchase Amount</span>
          <span className="text-xl font-bold text-blue-700">₹{total.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <div className="flex gap-3">
        <button onClick={() => router.back()} className="flex-1 border rounded-lg py-2.5 text-sm">Cancel</button>
        <button onClick={handleSubmit} disabled={saving || !isValid}
          className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50">
          {saving ? 'Saving...' : 'Create Purchase Order'}
        </button>
      </div>
    </div>
  )
}
