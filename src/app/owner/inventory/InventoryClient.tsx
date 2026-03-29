'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, X, Package, AlertTriangle } from 'lucide-react'

type Item = { id: string; name: string; description: string | null; stock: number; minStock: number; costPrice: string | null }

export default function InventoryClient({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState<Item[]>(initialItems)
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState<Item | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [stock, setStock] = useState('0')
  const [minStock, setMinStock] = useState('1')
  const [costPrice, setCostPrice] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function openAdd() {
    setName(''); setDescription(''); setStock('0'); setMinStock('1'); setCostPrice('')
    setError(''); setEditItem(null); setShowAdd(true)
  }

  function openEdit(item: Item) {
    setName(item.name); setDescription(item.description ?? ''); setStock(String(item.stock))
    setMinStock(String(item.minStock)); setCostPrice(item.costPrice ?? '')
    setError(''); setEditItem(item); setShowAdd(true)
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(''); setSaving(true)

    const body = { name, description, stock, minStock, costPrice }
    const res = editItem
      ? await fetch(`/api/v1/inventory/${editItem.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      : await fetch('/api/v1/inventory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

    if (res.ok) {
      const data = await res.json()
      const updated = { ...data.item, costPrice: data.item.costPrice ? String(data.item.costPrice) : null }
      if (editItem) setItems((prev) => prev.map((i) => i.id === editItem.id ? updated : i))
      else setItems((prev) => [...prev, updated].sort((a, b) => a.name.localeCompare(b.name)))
      setShowAdd(false)
    } else {
      const data = await res.json()
      setError(data.message || 'Failed to save.')
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this item? This cannot be undone.')) return
    const res = await fetch(`/api/v1/inventory/${id}`, { method: 'DELETE' })
    if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl text-center py-20">
          <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No inventory items yet. Add spare parts you stock.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['Name', 'Description', 'Stock', 'Min Stock', 'Cost Price', ''].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-medium text-foreground">{item.name}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{item.description ?? '—'}</td>
                  <td className="px-5 py-3.5 text-sm">
                    <span className={`font-semibold ${item.stock <= item.minStock ? 'text-amber-600' : 'text-foreground'}`}>
                      {item.stock}
                      {item.stock <= item.minStock && <AlertTriangle className="w-3 h-3 inline ml-1 text-amber-500" />}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{item.minStock}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{item.costPrice ? `₹${item.costPrice}` : '—'}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(item)} className="text-muted-foreground hover:text-foreground transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(item.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold">{editItem ? 'Edit Item' : 'Add Inventory Item'}</h2>
                <button onClick={() => setShowAdd(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Name *</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. RAM 4GB DDR4"
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Description</label>
                  <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional details"
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Stock</label>
                    <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} min="0"
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Min Stock</label>
                    <input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} min="0"
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Cost Price (₹)</label>
                  <input type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="0" min="0"
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
                <div className="flex flex-col gap-2 pt-1">
                  <button type="submit" disabled={saving}
                    className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
                    {saving ? 'Saving…' : editItem ? 'Save Changes' : 'Add Item'}
                  </button>
                  <button type="button" onClick={() => setShowAdd(false)}
                    className="w-full py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
