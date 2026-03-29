'use client'

import { useState } from 'react'
import { Plus, CalendarOff } from 'lucide-react'

type Request = { id: string; date: string; type: string; reason: string | null; status: string; createdAt: string }

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
}

export default function LeaveStaffClient({ initialRequests }: { initialRequests: Request[] }) {
  const [requests, setRequests] = useState(initialRequests)
  const [showForm, setShowForm] = useState(false)
  const [date, setDate] = useState('')
  const [type, setType] = useState('FULL')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(''); setSaving(true)
    const res = await fetch('/api/v1/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, type, reason }),
    })
    if (res.ok) {
      const data = await res.json()
      setRequests((prev) => [{ ...data.request, date: data.request.date, createdAt: data.request.createdAt }, ...prev])
      setShowForm(false); setDate(''); setReason('')
    } else {
      const data = await res.json()
      setError(data.message || 'Failed to submit request.')
    }
    setSaving(false)
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Request Leave
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-sm font-semibold mb-4">New Leave Request</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Date *</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="FULL">Full Day</option>
                  <option value="HALF">Half Day</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Reason (optional)</label>
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Medical appointment"
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
                {saving ? 'Submitting…' : 'Submit'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl text-center py-20">
          <CalendarOff className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No leave requests yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  {' · '}{r.type === 'FULL' ? 'Full Day' : 'Half Day'}
                </p>
                {r.reason && <p className="text-xs text-muted-foreground mt-0.5">{r.reason}</p>}
                <p className="text-xs text-muted-foreground mt-0.5">
                  Submitted {new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[r.status]}`}>{r.status}</span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
