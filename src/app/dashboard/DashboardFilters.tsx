'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Search } from 'lucide-react'

const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'DIAGNOSED', label: 'Diagnosed' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'WAITING_FOR_PARTS', label: 'Waiting for Parts' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

const DEVICES = [
  { value: '', label: 'All Devices' },
  { value: 'LAPTOP', label: 'Laptop' },
  { value: 'DESKTOP', label: 'Desktop' },
  { value: 'PRINTER', label: 'Printer' },
  { value: 'MONITOR', label: 'Monitor' },
  { value: 'UPS', label: 'UPS' },
  { value: 'OTHER', label: 'Other' },
]

export default function DashboardFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/dashboard?${params.toString()}`)
  }, [router, searchParams])

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          defaultValue={searchParams.get('q') ?? ''}
          onChange={(e) => update('q', e.target.value)}
          placeholder="Search job #, customer, phone…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring shadow-sm"
        />
      </div>
      <select
        value={searchParams.get('status') ?? ''}
        onChange={(e) => update('status', e.target.value)}
        className="px-4 py-2.5 rounded-xl border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring shadow-sm"
      >
        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
      <select
        value={searchParams.get('device') ?? ''}
        onChange={(e) => update('device', e.target.value)}
        className="px-4 py-2.5 rounded-xl border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring shadow-sm"
      >
        {DEVICES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
      </select>
    </div>
  )
}
