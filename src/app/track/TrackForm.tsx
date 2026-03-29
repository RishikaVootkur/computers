'use client'

import { useState } from 'react'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'

type TrackingJob = {
  jobNumber: string
  deviceType: string
  status: string
  createdAt: string
  estimatedAmount: string | null
  problemNotes: string | null
}

const STATUS_MESSAGES: Record<string, string> = {
  RECEIVED: 'We have received your device.',
  DIAGNOSED: 'Our technician is inspecting your device.',
  IN_PROGRESS: 'Repair work is in progress.',
  WAITING_FOR_PARTS: 'We are waiting for spare parts to arrive.',
  COMPLETED: 'Repair is complete! Your device is ready for pickup.',
  DELIVERED: 'Device has been delivered. Thank you!',
  CANCELLED: 'This job has been cancelled. Please contact the shop.',
}

export default function TrackForm() {
  const [phone, setPhone] = useState('')
  const [jobs, setJobs] = useState<TrackingJob[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (phone.length < 10) return

    setLoading(true)
    setSearched(false)

    try {
      const res = await fetch(`/api/v1/track?phone=${encodeURIComponent(phone)}`)
      if (res.ok) {
        const data = await res.json()
        setJobs(data.jobs)
      } else {
        setJobs([])
      }
    } catch {
      setJobs([])
    }

    setSearched(true)
    setLoading(false)
  }

  return (
    <div className="flex-1 max-w-lg mx-auto w-full px-6 py-14">
      <div className="text-center mb-10">
        <h1 className="text-2xl font-semibold text-foreground">Track Your Repair</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Enter the mobile number you gave us at the shop
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <input
          type="tel"
          value={phone}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
            setPhone(digits)
            if (searched) setSearched(false)
          }}
          placeholder="Your 10-digit mobile number"
          maxLength={10}
          className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={phone.length < 10 || loading}
          className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? '…' : 'Search'}
        </button>
      </form>

      {searched && jobs.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          <p className="font-medium">No repairs found for this number.</p>
          <p className="text-sm mt-1">Please contact the shop if you need help.</p>
        </div>
      )}

      {jobs.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Found {jobs.length} repair{jobs.length > 1 ? 's' : ''} for this number
          </p>
          {jobs.map((job) => (
            <div key={job.jobNumber} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-sm font-semibold text-foreground">{job.jobNumber}</span>
                <StatusBadge status={job.status} />
              </div>
              {STATUS_MESSAGES[job.status] && (
                <p className="text-sm text-foreground mb-3 pb-3 border-b border-border">
                  {STATUS_MESSAGES[job.status]}
                </p>
              )}
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Device</span>
                  <span className="text-foreground capitalize font-medium">
                    {job.deviceType.replace(/_/g, ' ').toLowerCase()}
                  </span>
                </div>
                {job.problemNotes && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground flex-shrink-0">Issue</span>
                    <span className="text-foreground text-right">{job.problemNotes}</span>
                  </div>
                )}
                {job.estimatedAmount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated Cost</span>
                    <span className="text-foreground font-medium">₹{job.estimatedAmount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Received on</span>
                  <span className="text-foreground">
                    {new Date(job.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-14 text-center text-xs text-muted-foreground space-y-0.5">
        <p className="font-medium text-foreground">Rishika Computers</p>
        <p>16-11-740/9/1, Rudra Towers, Dilsukh Nagar, Hyderabad - 500060</p>
        <Link href="/login" className="block mt-2 text-muted-foreground hover:text-foreground transition-colors">
          Staff Login →
        </Link>
      </div>
    </div>
  )
}
