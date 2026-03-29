'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import {
  ArrowLeft, User, Phone, Cpu, IndianRupee, StickyNote, FileText,
  Clock3, CheckCircle2, Pencil, Printer, X, AlertTriangle, ShieldCheck,
  Package, Plus, Trash2, Lock, FileText as InvoiceIcon,
} from 'lucide-react'

const ALL_STATUSES = [
  { value: 'RECEIVED', label: 'Received' },
  { value: 'DIAGNOSED', label: 'Diagnosed' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'WAITING_FOR_PARTS', label: 'Waiting for Parts' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

const DEVICE_TYPES = [
  { value: 'LAPTOP', label: 'Laptop' },
  { value: 'DESKTOP', label: 'Desktop' },
  { value: 'PRINTER', label: 'Printer' },
  { value: 'MONITOR', label: 'Monitor' },
  { value: 'UPS', label: 'UPS' },
  { value: 'OTHER', label: 'Other' },
]

type StaffOption = { id: string; user: { id: string; name: string } }
type InventoryItem = { id: string; name: string; stock: number; costPrice: string | null }
type JobPart = { id: string; quantity: number; costAtTime: string; item: { name: string } }

type StatusLog = {
  id: string
  oldStatus: string
  newStatus: string
  notes: string | null
  changedAt: string
  user: { name: string }
}

type Job = {
  id: string
  jobNumber: string
  status: string
  deviceType: string
  problemNotes: string | null
  internalNotes: string | null
  remarks: string | null
  estimatedAmount: string | null
  finalAmount: string | null
  isUrgent: boolean
  warrantyUntil: string | null
  createdAt: string
  completedAt: string | null
  assignedTo: string | null
  customer: { name: string; phone: string; email: string | null }
  assignee: { name: string } | null
  statusLogs: StatusLog[]
}

export default function JobDetailClient() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [staffList, setStaffList] = useState<StaffOption[]>([])

  // Status update
  const [newStatus, setNewStatus] = useState('')
  const [statusNotes, setStatusNotes] = useState('')
  const [finalAmount, setFinalAmount] = useState('')
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState('')
  const [updateSuccess, setUpdateSuccess] = useState(false)

  // Edit modal
  const [showEdit, setShowEdit] = useState(false)
  const [editDevice, setEditDevice] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editInternalNotes, setEditInternalNotes] = useState('')
  const [editEstimate, setEditEstimate] = useState('')
  const [editRemarks, setEditRemarks] = useState('')
  const [editAssignee, setEditAssignee] = useState('')
  const [editIsUrgent, setEditIsUrgent] = useState(false)
  const [editWarrantyDays, setEditWarrantyDays] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  // Parts
  const [parts, setParts] = useState<JobPart[]>([])
  const [showAddPart, setShowAddPart] = useState(false)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [addPartItem, setAddPartItem] = useState('')
  const [addPartQty, setAddPartQty] = useState('1')
  const [addPartError, setAddPartError] = useState('')
  const [addPartSaving, setAddPartSaving] = useState(false)

  const fetchJob = useCallback(async () => {
    const res = await fetch(`/api/v1/jobs/${id}`)
    if (res.status === 404) { router.push('/dashboard'); return }
    const data = await res.json()
    setJob(data.job)
    setNewStatus(data.job.status)
    if (data.job.finalAmount) setFinalAmount(data.job.finalAmount)
    setLoading(false)
  }, [id, router])

  const fetchParts = useCallback(async () => {
    const res = await fetch(`/api/v1/jobs/${id}/parts`)
    if (res.ok) {
      const data = await res.json()
      setParts(data.parts ?? [])
    }
  }, [id])

  useEffect(() => { fetchJob() }, [fetchJob])
  useEffect(() => { fetchParts() }, [fetchParts])
  useEffect(() => {
    fetch('/api/v1/staff').then((r) => r.json()).then((d) => setStaffList(d.staff ?? []))
  }, [])

  function openEdit() {
    if (!job) return
    setEditDevice(job.deviceType)
    setEditNotes(job.problemNotes ?? '')
    setEditInternalNotes(job.internalNotes ?? '')
    setEditEstimate(job.estimatedAmount ?? '')
    setEditRemarks(job.remarks ?? '')
    setEditAssignee(job.assignedTo ?? '')
    setEditIsUrgent(job.isUrgent)
    setEditWarrantyDays('')
    setEditError('')
    setShowEdit(true)
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEditError('')
    setEditSaving(true)

    let warrantyUntil: string | null = null
    if (editWarrantyDays && parseInt(editWarrantyDays) > 0) {
      const d = new Date()
      d.setDate(d.getDate() + parseInt(editWarrantyDays))
      warrantyUntil = d.toISOString()
    } else if (editWarrantyDays === '0') {
      warrantyUntil = null
    }

    const res = await fetch(`/api/v1/jobs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceType: editDevice,
        problemNotes: editNotes,
        internalNotes: editInternalNotes,
        estimatedAmount: editEstimate,
        remarks: editRemarks,
        assignedTo: editAssignee,
        isUrgent: editIsUrgent,
        ...(editWarrantyDays !== '' && { warrantyUntil }),
      }),
    })

    if (res.ok) {
      setShowEdit(false)
      await fetchJob()
    } else {
      const data = await res.json()
      setEditError(data.message || 'Failed to save changes.')
    }
    setEditSaving(false)
  }

  async function handleStatusUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setUpdateError('')
    setUpdateSuccess(false)
    if (!newStatus || newStatus === job?.status) { setUpdateError('Please select a different status.'); return }
    setUpdating(true)
    const res = await fetch(`/api/v1/jobs/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, notes: statusNotes, finalAmount: finalAmount || undefined }),
    })
    if (res.ok) {
      setStatusNotes('')
      setUpdateSuccess(true)
      await fetchJob()
    } else {
      const data = await res.json()
      setUpdateError(data.message || 'Failed to update status.')
    }
    setUpdating(false)
  }

  async function openAddPart() {
    if (inventoryItems.length === 0) {
      const res = await fetch('/api/v1/inventory')
      if (res.ok) {
        const data = await res.json()
        setInventoryItems(data.items ?? [])
        if (data.items?.length > 0) setAddPartItem(data.items[0].id)
      }
    }
    setAddPartError('')
    setAddPartQty('1')
    setShowAddPart(true)
  }

  async function handleAddPart(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setAddPartError('')
    setAddPartSaving(true)
    const res = await fetch(`/api/v1/jobs/${id}/parts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inventoryItemId: addPartItem, quantity: addPartQty }),
    })
    if (res.ok) {
      setShowAddPart(false)
      await fetchParts()
    } else {
      const data = await res.json()
      setAddPartError(data.message || 'Failed to add part.')
    }
    setAddPartSaving(false)
  }

  async function removePart(partId: string) {
    await fetch(`/api/v1/jobs/${id}/parts/${partId}`, { method: 'DELETE' })
    await fetchParts()
  }

  if (loading) {
    return <div className="flex items-center justify-center py-32"><p className="text-muted-foreground text-sm animate-pulse">Loading job…</p></div>
  }
  if (!job) return null

  const isFinished = ['DELIVERED', 'CANCELLED'].includes(job.status)
  const isUnderWarranty = job.warrantyUntil && new Date(job.warrantyUntil) > new Date()
  const partsTotal = parts.reduce((sum, p) => sum + Number(p.costAtTime) * p.quantity, 0)

  return (
    <main className="px-4 sm:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> All Jobs
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={openEdit}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
          <a href={`/service/${id}/invoice`} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <InvoiceIcon className="w-3.5 h-3.5" /> Invoice
          </a>
          <a href={`/service/${id}/receipt`} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Printer className="w-3.5 h-3.5" /> Receipt
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Job details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-foreground font-mono">{job.jobNumber}</h1>
                  {job.isUrgent && (
                    <span className="flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3" /> URGENT
                    </span>
                  )}
                  {isUnderWarranty && (
                    <span className="flex items-center gap-1 text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" /> WARRANTY
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Clock3 className="w-3.5 h-3.5" />
                  {new Date(job.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  {' · '}
                  {new Date(job.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <StatusBadge status={job.status} />
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground mb-1.5"><User className="w-3 h-3" /> Customer</p>
                <p className="font-semibold text-foreground text-sm">{job.customer.name}</p>
                <p className="text-muted-foreground text-sm flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" /> {job.customer.phone}</p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground mb-1.5"><Cpu className="w-3 h-3" /> Device</p>
                <p className="font-semibold text-foreground text-sm capitalize">{job.deviceType.replace(/_/g, ' ').toLowerCase()}</p>
              </div>
              {job.estimatedAmount && (
                <div>
                  <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground mb-1.5"><IndianRupee className="w-3 h-3" /> Estimated</p>
                  <p className="font-semibold text-foreground text-sm">₹{job.estimatedAmount}</p>
                </div>
              )}
              {job.finalAmount && (
                <div>
                  <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground mb-1.5"><IndianRupee className="w-3 h-3" /> Final Amount</p>
                  <p className="font-semibold text-green-700 text-sm">₹{job.finalAmount}</p>
                </div>
              )}
              {job.assignee && (
                <div>
                  <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground mb-1.5"><User className="w-3 h-3" /> Assigned To</p>
                  <p className="font-semibold text-foreground text-sm">{job.assignee.name}</p>
                </div>
              )}
              {job.warrantyUntil && (
                <div>
                  <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground mb-1.5"><ShieldCheck className="w-3 h-3" /> Warranty Until</p>
                  <p className={`font-semibold text-sm ${isUnderWarranty ? 'text-blue-700' : 'text-muted-foreground line-through'}`}>
                    {new Date(job.warrantyUntil).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>

            {job.problemNotes && (
              <div className="mt-5 pt-5 border-t border-border">
                <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground mb-2"><FileText className="w-3 h-3" /> Problem Description</p>
                <p className="text-sm text-foreground">{job.problemNotes}</p>
              </div>
            )}
            {job.internalNotes && (
              <div className="mt-4">
                <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground mb-2"><Lock className="w-3 h-3" /> Internal Notes</p>
                <p className="text-sm text-muted-foreground bg-muted/40 px-3 py-2 rounded-lg">{job.internalNotes}</p>
              </div>
            )}
            {job.remarks && (
              <div className="mt-4">
                <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground mb-2"><StickyNote className="w-3 h-3" /> Remarks</p>
                <p className="text-sm text-muted-foreground">{job.remarks}</p>
              </div>
            )}
          </div>

          {/* Parts used */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Package className="w-4 h-4 text-muted-foreground" /> Parts Used
              </h2>
              {!isFinished && (
                <button onClick={openAddPart}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors">
                  <Plus className="w-3 h-3" /> Add Part
                </button>
              )}
            </div>
            {parts.length === 0 ? (
              <p className="text-xs text-muted-foreground">No parts added yet.</p>
            ) : (
              <div className="space-y-2">
                {parts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{p.item.name} <span className="text-muted-foreground">× {p.quantity}</span></span>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">₹{(Number(p.costAtTime) * p.quantity).toFixed(0)}</span>
                      {!isFinished && (
                        <button onClick={() => removePart(p.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="border-t border-border pt-2 flex justify-between text-sm font-semibold">
                  <span>Parts Total</span>
                  <span>₹{partsTotal.toFixed(0)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Status history */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-5">
              <Clock3 className="w-4 h-4 text-muted-foreground" /> Status History
            </h2>
            <div className="space-y-0">
              {job.statusLogs.map((log, i) => (
                <div key={log.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1 flex-shrink-0" />
                    {i < job.statusLogs.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
                  </div>
                  <div className="pb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={log.newStatus} />
                      <span className="text-xs text-muted-foreground">by {log.user.name}</span>
                    </div>
                    {log.notes && <p className="text-xs text-muted-foreground mt-1">{log.notes}</p>}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(log.changedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {' · '}
                      {new Date(log.changedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Update status */}
        <div>
          {isFinished ? (
            <div className="bg-card border border-border rounded-2xl p-6 text-center shadow-sm">
              <CheckCircle2 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
              <StatusBadge status={job.status} />
              <p className="text-sm text-muted-foreground mt-3">This job is closed.</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-6 sticky top-20 shadow-sm">
              <h2 className="text-sm font-semibold text-foreground mb-4">Update Status</h2>
              <form onSubmit={handleStatusUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">New Status</label>
                  <select value={newStatus} onChange={(e) => { setNewStatus(e.target.value); setUpdateSuccess(false) }}
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    {ALL_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                {(newStatus === 'COMPLETED' || newStatus === 'DELIVERED') && (
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Final Amount (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                      <input type="number" value={finalAmount} onChange={(e) => setFinalAmount(e.target.value)} placeholder="0" min="0"
                        className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Notes (optional)</label>
                  <textarea value={statusNotes} onChange={(e) => setStatusNotes(e.target.value)} placeholder="e.g. Hard disk replaced, tested OK…" rows={2}
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                </div>
                {updateError && <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{updateError}</p>}
                {updateSuccess && (
                  <p className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Status updated successfully
                  </p>
                )}
                <button type="submit" disabled={updating || newStatus === job.status}
                  className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {updating ? 'Updating…' : 'Update Status'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-foreground">Edit Job — {job.jobNumber}</h2>
                <button onClick={() => setShowEdit(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleEdit} className="space-y-4">
                {/* Urgent toggle */}
                <button
                  type="button"
                  onClick={() => setEditIsUrgent(!editIsUrgent)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-colors ${
                    editIsUrgent
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-border bg-background text-muted-foreground hover:border-red-300'
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <AlertTriangle className={`w-4 h-4 ${editIsUrgent ? 'text-red-600' : 'text-muted-foreground'}`} />
                    Mark as Urgent
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${editIsUrgent ? 'bg-red-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                    {editIsUrgent ? 'ON' : 'OFF'}
                  </span>
                </button>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Device Type</label>
                  <select value={editDevice} onChange={(e) => setEditDevice(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    {DEVICE_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Problem Description</label>
                  <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} placeholder="Describe the issue…"
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide flex items-center gap-1"><Lock className="w-3 h-3" /> Internal Notes (not on receipt)</label>
                  <textarea value={editInternalNotes} onChange={(e) => setEditInternalNotes(e.target.value)} rows={2} placeholder="Private notes for staff only…"
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Estimated Amount (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                    <input type="number" value={editEstimate} onChange={(e) => setEditEstimate(e.target.value)} placeholder="0" min="0"
                      className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Remarks</label>
                  <textarea value={editRemarks} onChange={(e) => setEditRemarks(e.target.value)} rows={2} placeholder="Internal notes…"
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Set Warranty (days from today)</label>
                  <input type="number" value={editWarrantyDays} onChange={(e) => setEditWarrantyDays(e.target.value)} placeholder="e.g. 30 (leave blank to not change)"
                    min="0" className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                {staffList.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Assign To</label>
                    <select value={editAssignee} onChange={(e) => setEditAssignee(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="">— Unassigned —</option>
                      {staffList.map((s) => <option key={s.id} value={s.user.id}>{s.user.name}</option>)}
                    </select>
                  </div>
                )}
                {editError && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{editError}</p>}
                <div className="flex flex-col gap-2 pt-1">
                  <button type="submit" disabled={editSaving}
                    className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
                    {editSaving ? 'Saving…' : 'Save Changes'}
                  </button>
                  <button type="button" onClick={() => setShowEdit(false)}
                    className="w-full py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Part modal */}
      {showAddPart && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-foreground">Add Part</h2>
                <button onClick={() => setShowAddPart(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
              </div>
              {inventoryItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No inventory items found. Add items in the Inventory section first.</p>
              ) : (
                <form onSubmit={handleAddPart} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Part</label>
                    <select value={addPartItem} onChange={(e) => setAddPartItem(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                      {inventoryItems.map((item) => (
                        <option key={item.id} value={item.id}>{item.name} (stock: {item.stock})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Quantity</label>
                    <input type="number" value={addPartQty} onChange={(e) => setAddPartQty(e.target.value)} min="1"
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  {addPartError && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{addPartError}</p>}
                  <div className="flex flex-col gap-2 pt-1">
                    <button type="submit" disabled={addPartSaving}
                      className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
                      {addPartSaving ? 'Adding…' : 'Add Part'}
                    </button>
                    <button type="button" onClick={() => setShowAddPart(false)}
                      className="w-full py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
