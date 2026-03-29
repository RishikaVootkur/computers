'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Phone, User, Cpu, FileText, IndianRupee, StickyNote, Search, CheckCircle2, UserPlus, ArrowLeft, UserCheck, AlertTriangle } from 'lucide-react'

const DEVICE_TYPES = [
  { value: 'LAPTOP', label: 'Laptop' },
  { value: 'DESKTOP', label: 'Desktop' },
  { value: 'PRINTER', label: 'Printer' },
  { value: 'MONITOR', label: 'Monitor' },
  { value: 'UPS', label: 'UPS' },
  { value: 'OTHER', label: 'Other' },
]

type LookupState = 'idle' | 'loading' | 'found' | 'new'
type StaffOption = { id: string; user: { id: string; name: string } }

export default function NewServiceForm() {
  const router = useRouter()

  const [phone, setPhone] = useState('')
  const [lookupState, setLookupState] = useState<LookupState>('idle')
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [hasRecentJob, setHasRecentJob] = useState(false)

  const [deviceType, setDeviceType] = useState('')
  const [problemNotes, setProblemNotes] = useState('')
  const [estimatedAmount, setEstimatedAmount] = useState('')
  const [remarks, setRemarks] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [staffList, setStaffList] = useState<StaffOption[]>([])

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/v1/staff')
      .then((r) => r.json())
      .then((d) => setStaffList(d.staff ?? []))
      .catch(() => {})
  }, [])

  async function lookupCustomer() {
    if (phone.length < 10) return
    setLookupState('loading')
    setError('')
    setCustomerId(null)
    setCustomerName('')

    try {
      const res = await fetch(`/api/v1/customers?phone=${encodeURIComponent(phone)}`)
      const data = await res.json()

      if (data.customer) {
        setCustomerId(data.customer.id)
        setCustomerName(data.customer.name)
        setHasRecentJob(data.hasRecentJob ?? false)
        setLookupState('found')
      } else {
        setLookupState('new')
      }
    } catch {
      setError('Could not reach the server. Please try again.')
      setLookupState('idle')
    }
  }

  function handlePhoneChange(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 10)
    setPhone(digits)
    if (lookupState !== 'idle') {
      setLookupState('idle')
      setCustomerId(null)
      setCustomerName('')
      setHasRecentJob(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (lookupState === 'idle') {
      setError('Please look up the customer phone number first.')
      return
    }
    if (lookupState === 'loading') return
    if (!customerName.trim()) {
      setError('Customer name is required.')
      return
    }
    if (!deviceType) {
      setError('Please select a device type.')
      return
    }

    setSubmitting(true)

    try {
      let finalCustomerId = customerId

      if (lookupState === 'new') {
        const res = await fetch('/api/v1/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: customerName.trim(), phone }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.message || 'Failed to save customer.')
          setSubmitting(false)
          return
        }
        finalCustomerId = data.customer.id
      }

      const res = await fetch('/api/v1/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: finalCustomerId,
          deviceType,
          problemNotes,
          estimatedAmount: estimatedAmount || null,
          remarks,
          assignedTo: assignedTo || null,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Failed to create job.')
        setSubmitting(false)
        return
      }

      router.push(`/service/${data.job.id}`)
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  const canSubmit =
    lookupState !== 'idle' && lookupState !== 'loading' && !submitting

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Jobs
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">New Service Job</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Fill in the details to create a new service entry</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Customer Phone */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Phone className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Customer Lookup</h2>
          </div>
          <div className="flex gap-2">
            <input
              type="tel"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="10-digit mobile number"
              maxLength={10}
              className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={lookupCustomer}
              disabled={phone.length < 10 || lookupState === 'loading'}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
            >
              <Search className="w-3.5 h-3.5" />
              {lookupState === 'loading' ? 'Looking…' : 'Lookup'}
            </button>
          </div>
          {lookupState === 'found' && (
            <div className="mt-3 flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <span className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                Existing customer found
              </span>
              <Link
                href={`/service/customer/${customerId}`}
                target="_blank"
                className="text-xs font-semibold text-green-700 underline underline-offset-2 hover:text-green-900"
              >
                View past jobs →
              </Link>
            </div>
          )}
          {hasRecentJob && lookupState === 'found' && (
            <div className="mt-2 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              This customer had a job in the last 30 days — possible return or complaint.
            </div>
          )}
          {lookupState === 'new' && (
            <div className="mt-3 flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <UserPlus className="w-4 h-4 flex-shrink-0" />
              New customer — enter their name below
            </div>
          )}
        </div>

        {/* Customer Name */}
        {(lookupState === 'found' || lookupState === 'new') && (
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Customer Name</h2>
              <span className="text-destructive text-sm">*</span>
            </div>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              readOnly={lookupState === 'found'}
              placeholder="Full name"
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring read-only:bg-muted read-only:cursor-default"
            />
          </div>
        )}

        {/* Device + Problem */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Device Details</h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
              Device Type <span className="text-destructive">*</span>
            </label>
            <select
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">— Select device —</option>
              {DEVICE_TYPES.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3 h-3" />
                Problem Description
              </span>
            </label>
            <textarea
              value={problemNotes}
              onChange={(e) => setProblemNotes(e.target.value)}
              placeholder="Describe the issue reported by the customer…"
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
        </div>

        {/* Pricing + Remarks */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Pricing & Notes</h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
              Estimated Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">₹</span>
              <input
                type="number"
                value={estimatedAmount}
                onChange={(e) => setEstimatedAmount(e.target.value)}
                placeholder="0"
                min="0"
                step="1"
                className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
              <span className="flex items-center gap-1.5">
                <StickyNote className="w-3 h-3" />
                Internal Remarks
              </span>
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Any internal notes or observations…"
              rows={2}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
        </div>

        {/* Assign To */}
        {staffList.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <UserCheck className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Assign To</h2>
            </div>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">— Unassigned —</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.user.id}>{s.user.name}</option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {submitting ? 'Creating Job…' : 'Create Service Job'}
        </button>
      </form>
    </main>
  )
}
