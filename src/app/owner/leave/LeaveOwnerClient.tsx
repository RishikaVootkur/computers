'use client'

import { useState } from 'react'
import { CalendarOff } from 'lucide-react'

type Request = { id: string; date: string; type: string; reason: string | null; status: string; createdAt: string; staffName: string }

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
}

export default function LeaveOwnerClient({ initialRequests }: { initialRequests: Request[] }) {
  const [requests, setRequests] = useState(initialRequests)

  async function updateStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    const res = await fetch(`/api/v1/leave/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r))
    }
  }

  const pending = requests.filter((r) => r.status === 'PENDING')
  const others = requests.filter((r) => r.status !== 'PENDING')

  return (
    <>
      {requests.length === 0 && (
        <div className="bg-card border border-border rounded-2xl text-center py-20">
          <CalendarOff className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No leave requests yet.</p>
        </div>
      )}

      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-foreground mb-3">Pending ({pending.length})</h2>
          <div className="space-y-3">
            {pending.map((r) => (
              <RequestCard key={r.id} r={r} onApprove={() => updateStatus(r.id, 'APPROVED')} onReject={() => updateStatus(r.id, 'REJECTED')} />
            ))}
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">History</h2>
          <div className="space-y-3">
            {others.map((r) => (
              <RequestCard key={r.id} r={r} />
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function RequestCard({ r, onApprove, onReject }: { r: Request; onApprove?: () => void; onReject?: () => void }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center justify-between gap-4 flex-wrap">
      <div>
        <p className="font-semibold text-sm text-foreground">{r.staffName}</p>
        <p className="text-sm text-muted-foreground mt-0.5">
          {new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          {' · '}{r.type === 'FULL' ? 'Full Day' : 'Half Day'}
        </p>
        {r.reason && <p className="text-xs text-muted-foreground mt-1">{r.reason}</p>}
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[r.status]}`}>{r.status}</span>
        {r.status === 'PENDING' && (
          <>
            <button onClick={onApprove}
              className="text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors">
              Approve
            </button>
            <button onClick={onReject}
              className="text-xs px-3 py-1.5 rounded-lg bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition-colors">
              Reject
            </button>
          </>
        )}
      </div>
    </div>
  )
}
