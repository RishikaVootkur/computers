'use client'

import { useCallback, useEffect, useState } from 'react'
import { Users, Plus, X, IndianRupee, Phone, User, UserMinus } from 'lucide-react'

type StaffMember = {
  id: string
  monthlySalary: string
  joinedOn: string
  user: { id: string; name: string; phone: string | null }
}

export default function StaffClient() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [monthlySalary, setMonthlySalary] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [confirmDeactivate, setConfirmDeactivate] = useState<StaffMember | null>(null)
  const [deactivating, setDeactivating] = useState(false)

  const fetchStaff = useCallback(async () => {
    const res = await fetch('/api/v1/staff')
    if (res.ok) {
      const data = await res.json()
      setStaff(data.staff)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchStaff() }, [fetchStaff])

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const res = await fetch('/api/v1/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, monthlySalary }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.message || 'Failed to add staff')
      setSubmitting(false)
      return
    }

    setName(''); setPhone(''); setMonthlySalary('')
    setShowForm(false)
    await fetchStaff()
    setSubmitting(false)
  }

  async function handleDeactivate() {
    if (!confirmDeactivate) return
    setDeactivating(true)

    await fetch('/api/v1/staff', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId: confirmDeactivate.id }),
    })

    setConfirmDeactivate(null)
    setDeactivating(false)
    await fetchStaff()
  }

  return (
    <main className="px-4 sm:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-foreground">Staff</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{staff.length} active member{staff.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setError('') }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Staff
        </button>
      </div>

      {/* Add staff form */}
      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-foreground">New Staff Member</h2>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                <span className="flex items-center gap-1.5"><User className="w-3 h-3" /> Full Name *</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Ravi Kumar"
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> Phone</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit number"
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                <span className="flex items-center gap-1.5"><IndianRupee className="w-3 h-3" /> Monthly Salary (₹) *</span>
              </label>
              <div className="relative max-w-xs">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                <input
                  type="number"
                  value={monthlySalary}
                  onChange={(e) => setMonthlySalary(e.target.value)}
                  required
                  min="0"
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {error && (
              <div className="sm:col-span-2 text-sm text-destructive bg-destructive/10 px-4 py-2.5 rounded-lg">
                {error}
              </div>
            )}

            <div className="sm:col-span-2 flex gap-3 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Adding…' : 'Add Staff Member'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff list */}
      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-12 animate-pulse">Loading…</p>
      ) : staff.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl text-center py-20 shadow-sm">
          <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium text-foreground">No staff added yet</p>
          <p className="text-sm text-muted-foreground mt-1">Click "Add Staff" to create the first staff account.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {['Name', 'Phone', 'Monthly Salary', 'Joined', ''].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {staff.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {s.user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-foreground">{s.user.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{s.user.phone || '—'}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-foreground">₹{Number(s.monthlySalary).toLocaleString('en-IN')}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(s.joinedOn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setConfirmDeactivate(s)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirm deactivate modal */}
      {confirmDeactivate && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <UserMinus className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Remove Staff Member?</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{confirmDeactivate.user.name}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              This will deactivate their account. Their attendance and salary records will be preserved.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleDeactivate}
                disabled={deactivating}
                className="w-full py-3 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deactivating ? 'Removing…' : 'Yes, Remove'}
              </button>
              <button
                onClick={() => setConfirmDeactivate(null)}
                className="w-full py-3 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
        </div>
      )}
    </main>
  )
}
