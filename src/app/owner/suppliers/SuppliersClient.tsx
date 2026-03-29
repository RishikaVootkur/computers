'use client'

import { useState } from 'react'
import { Truck, Plus, X, Phone, Mail, MapPin } from 'lucide-react'

type Supplier = {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  gstin: string | null
  _count: { purchases: number; products: number }
}

export default function SuppliersClient({ suppliers: initial }: { suppliers: Supplier[] }) {
  const [suppliers, setSuppliers] = useState(initial)
  const [showModal, setShowModal] = useState(false)
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', gstin: '' })

  function openAdd() {
    setForm({ name: '', phone: '', email: '', address: '', gstin: '' })
    setEditSupplier(null)
    setShowModal(true)
  }

  function openEdit(s: Supplier) {
    setForm({ name: s.name, phone: s.phone ?? '', email: s.email ?? '', address: s.address ?? '', gstin: s.gstin ?? '' })
    setEditSupplier(s)
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name) return
    setSaving(true)
    try {
      const body = { name: form.name, phone: form.phone || null, email: form.email || null, address: form.address || null, gstin: form.gstin || null }
      if (editSupplier) {
        const res = await fetch(`/api/v1/suppliers/${editSupplier.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        })
        const updated = await res.json()
        setSuppliers(prev => prev.map(s => s.id === editSupplier.id ? { ...s, ...updated } : s))
      } else {
        const res = await fetch('/api/v1/suppliers', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        })
        const created = await res.json()
        setSuppliers(prev => [{ ...created, _count: { purchases: 0, products: 0 } }, ...prev])
      }
      setShowModal(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this supplier?')) return
    await fetch(`/api/v1/suppliers/${id}`, { method: 'DELETE' })
    setSuppliers(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Truck className="w-6 h-6" /> Suppliers</h1>
          <p className="text-sm text-gray-500 mt-1">{suppliers.length} suppliers</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
      </div>

      <div className="grid gap-4">
        {suppliers.length === 0 && (
          <div className="text-center py-16 text-gray-400">No suppliers yet. Add your first supplier.</div>
        )}
        {suppliers.map(s => (
          <div key={s.id} className="bg-white border rounded-xl p-4 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-base">{s.name}</div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
                {s.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone}</span>}
                {s.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{s.email}</span>}
                {s.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.address}</span>}
                {s.gstin && <span className="text-gray-400 text-xs">GSTIN: {s.gstin}</span>}
              </div>
              <div className="flex gap-4 mt-2 text-xs text-gray-400">
                <span>{s._count.purchases} purchase{s._count.purchases !== 1 ? 's' : ''}</span>
                <span>{s._count.products} product{s._count.products !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => openEdit(s)} className="text-sm text-blue-600 hover:underline">Edit</button>
              <button onClick={() => handleDelete(s.id)} className="text-sm text-red-500 hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold">{editSupplier ? 'Edit Supplier' : 'Add Supplier'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-3">
              {[
                { label: 'Name *', key: 'name', placeholder: 'e.g. Tech Distributors Pvt Ltd' },
                { label: 'Phone', key: 'phone', placeholder: '9876543210' },
                { label: 'Email', key: 'email', placeholder: 'supplier@example.com' },
                { label: 'Address', key: 'address', placeholder: 'City, State' },
                { label: 'GSTIN', key: 'gstin', placeholder: '27AAAAA0000A1Z5' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
                  <input
                    value={form[field.key as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 p-4 border-t">
              <button onClick={() => setShowModal(false)} className="flex-1 border rounded-lg py-2 text-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">
                {saving ? 'Saving...' : editSupplier ? 'Save Changes' : 'Add Supplier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
