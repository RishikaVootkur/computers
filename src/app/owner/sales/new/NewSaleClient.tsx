'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ShoppingBag, Search } from 'lucide-react'

type Product = { id: string; name: string; sku: string | null; sellPrice: number; stock: number; category: { name: string } | null }
type Customer = { id: string; name: string; phone: string }
type LineItem = { productId: string; quantity: number; priceAtTime: number }

export default function NewSaleClient({ products, customers }: { products: Product[]; customers: Customer[] }) {
  const router = useRouter()
  const [customerId, setCustomerId] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'PHONEPE'>('CASH')
  const [discount, setDiscount] = useState('0')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<LineItem[]>([{ productId: '', quantity: 1, priceAtTime: 0 }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [productSearch, setProductSearch] = useState<Record<number, string>>({})

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  )

  function addLine() {
    setItems(prev => [...prev, { productId: '', quantity: 1, priceAtTime: 0 }])
  }

  function removeLine(i: number) {
    setItems(prev => prev.filter((_, idx) => idx !== i))
    setProductSearch(prev => {
      const next = { ...prev }
      delete next[i]
      return next
    })
  }

  function updateLine(i: number, field: keyof LineItem, value: string | number) {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== i) return item
      const updated = { ...item, [field]: value }
      if (field === 'productId') {
        const product = products.find(p => p.id === value)
        if (product) updated.priceAtTime = Number(product.sellPrice)
      }
      return updated
    }))
  }

  function selectProduct(lineIdx: number, productId: string) {
    const product = products.find(p => p.id === productId)
    setProductSearch(prev => ({ ...prev, [lineIdx]: product?.name ?? '' }))
    updateLine(lineIdx, 'productId', productId)
  }

  const subtotal = items.reduce((s, i) => s + i.quantity * i.priceAtTime, 0)
  const discountAmt = parseFloat(discount) || 0
  const total = Math.max(0, subtotal - discountAmt)
  const isValid = items.length > 0 && items.every(i => i.productId && i.quantity > 0)

  async function handleSubmit() {
    if (!isValid) { setError('Select a product for each line item'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/v1/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customerId || null,
          items,
          discount: discountAmt,
          tax: 0,
          paymentMode,
          notes,
        }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed'); return }
      const sale = await res.json()
      router.push(`/owner/sales/${sale.id}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <ShoppingBag className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold">New Sale</h1>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Left — items */}
        <div className="col-span-2 space-y-4">
          {/* Customer */}
          <div className="bg-white border rounded-xl p-4">
            <label className="block text-xs font-medium text-gray-600 mb-2">Customer (optional)</label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={customerSearch}
                onChange={e => { setCustomerSearch(e.target.value); setCustomerId('') }}
                placeholder="Search customer by name or phone..."
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
              />
            </div>
            {customerSearch && !customerId && (
              <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                <div
                  className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 cursor-pointer"
                  onClick={() => { setCustomerId(''); setCustomerSearch('') }}
                >
                  Walk-in customer (no record)
                </div>
                {filteredCustomers.map(c => (
                  <div key={c.id}
                    className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer"
                    onClick={() => { setCustomerId(c.id); setCustomerSearch(c.name) }}
                  >
                    <span className="font-medium">{c.name}</span>
                    <span className="text-gray-400 ml-2">{c.phone}</span>
                  </div>
                ))}
                {filteredCustomers.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-400">No match — will be recorded as walk-in</div>
                )}
              </div>
            )}
            {customerId && <p className="text-xs text-green-600 mt-1">✓ Customer selected</p>}
          </div>

          {/* Line Items */}
          <div className="bg-white border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 font-medium text-sm">Items</div>
            <div className="divide-y">
              {items.map((item, i) => {
                const selectedProduct = products.find(p => p.id === item.productId)
                const filteredProducts = products.filter(p => {
                  const q = productSearch[i] ?? ''
                  return !q || p.name.toLowerCase().includes(q.toLowerCase()) || (p.sku?.toLowerCase().includes(q.toLowerCase()) ?? false)
                })

                return (
                  <div key={i} className="p-4">
                    <div className="flex gap-3 items-start">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Product</label>
                        <div className="relative">
                          <input
                            value={productSearch[i] ?? selectedProduct?.name ?? ''}
                            onChange={e => {
                              setProductSearch(prev => ({ ...prev, [i]: e.target.value }))
                              if (!e.target.value) updateLine(i, 'productId', '')
                            }}
                            placeholder="Search product..."
                            className="w-full border rounded-lg px-3 py-1.5 text-sm"
                          />
                          {(productSearch[i] || '') && !item.productId && (
                            <div className="absolute z-10 w-full border bg-white rounded-lg mt-1 shadow-lg max-h-48 overflow-y-auto">
                              {filteredProducts.slice(0, 10).map(p => (
                                <div key={p.id}
                                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 flex justify-between ${p.stock === 0 ? 'opacity-50' : ''}`}
                                  onClick={() => selectProduct(i, p.id)}
                                >
                                  <span>{p.name}{p.sku ? <span className="text-gray-400 ml-1 text-xs">({p.sku})</span> : ''}</span>
                                  <span className="text-gray-400 text-xs">Stock: {p.stock} · ₹{Number(p.sellPrice).toLocaleString('en-IN')}</span>
                                </div>
                              ))}
                              {filteredProducts.length === 0 && <div className="px-3 py-2 text-sm text-gray-400">No products found</div>}
                            </div>
                          )}
                        </div>
                        {selectedProduct && (
                          <p className="text-xs text-gray-400 mt-1">In stock: {selectedProduct.stock}</p>
                        )}
                      </div>
                      <div className="w-20">
                        <label className="block text-xs text-gray-500 mb-1">Qty</label>
                        <input type="number" min={1} max={selectedProduct?.stock ?? 999} value={item.quantity}
                          onChange={e => updateLine(i, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full border rounded-lg px-2 py-1.5 text-sm" />
                      </div>
                      <div className="w-28">
                        <label className="block text-xs text-gray-500 mb-1">Price (₹)</label>
                        <input type="number" min={0} step="0.01" value={item.priceAtTime}
                          onChange={e => updateLine(i, 'priceAtTime', parseFloat(e.target.value) || 0)}
                          className="w-full border rounded-lg px-2 py-1.5 text-sm" />
                      </div>
                      <div className="w-24 text-right text-sm font-medium pt-6">
                        ₹{(item.quantity * item.priceAtTime).toLocaleString('en-IN')}
                      </div>
                      <button onClick={() => removeLine(i)} disabled={items.length === 1}
                        className="text-red-400 hover:text-red-600 disabled:opacity-30 mt-6">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="px-4 py-3 border-t">
              <button onClick={addLine} className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white border rounded-xl p-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Optional notes..." />
          </div>
        </div>

        {/* Right — summary */}
        <div className="space-y-4">
          <div className="bg-white border rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-3">Payment</h3>
            <div className="flex gap-2 mb-4">
              {(['CASH', 'PHONEPE'] as const).map(mode => (
                <button key={mode} onClick={() => setPaymentMode(mode)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${paymentMode === mode ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'}`}>
                  {mode}
                </button>
              ))}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Discount (₹)</span>
                <input type="number" min={0} value={discount} onChange={e => setDiscount(e.target.value)}
                  className="w-24 border rounded px-2 py-1 text-sm text-right" />
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-blue-700">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <button onClick={handleSubmit} disabled={saving || !isValid}
            className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold disabled:opacity-50 hover:bg-blue-700">
            {saving ? 'Processing...' : `Complete Sale · ₹${total.toLocaleString('en-IN')}`}
          </button>
          <button onClick={() => router.back()} className="w-full border rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
