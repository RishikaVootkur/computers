'use client'

import { useCallback, useEffect, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Users, Download, CheckSquare } from 'lucide-react'

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | null
type StaffMember = { id: string; user: { name: string } }
type AttendanceRecord = { id: string; staffId: string; date: string; status: AttendanceStatus }

const STATUS_CYCLE: Record<string, AttendanceStatus> = {
  null: 'PRESENT', PRESENT: 'HALF_DAY', HALF_DAY: 'ABSENT', ABSENT: null,
}
const STATUS_STYLE: Record<string, string> = {
  PRESENT: 'bg-green-100 text-green-700 border-green-300',
  HALF_DAY: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  ABSENT: 'bg-red-100 text-red-600 border-red-300',
}
const STATUS_LABEL: Record<string, string> = { PRESENT: 'P', HALF_DAY: '½', ABSENT: 'A' }

function getMonthDays(year: number, month: number) { return new Date(year, month, 0).getDate() }
function isFuture(year: number, month: number, day: number) {
  const cell = new Date(year, month - 1, day)
  cell.setHours(0, 0, 0, 0)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return cell > today
}

export default function AttendanceClient() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/v1/attendance?month=${month}&year=${year}`)
    if (res.ok) { const data = await res.json(); setStaff(data.staff); setAttendance(data.attendance) }
    setLoading(false)
  }, [month, year])

  useEffect(() => { fetchData() }, [fetchData])

  function getStatus(staffId: string, day: number): AttendanceStatus {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return attendance.find((a) => a.staffId === staffId && a.date.startsWith(dateStr))?.status ?? null
  }

  async function toggleStatus(staffId: string, day: number) {
    if (isFuture(year, month, day)) return
    const current = getStatus(staffId, day)
    const next = STATUS_CYCLE[current ?? 'null']
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const key = `${staffId}-${dateStr}`
    setSaving(key)
    if (next === null) {
      setAttendance((prev) => prev.filter((a) => !(a.staffId === staffId && a.date.startsWith(dateStr))))
      setSaving(null)
      return
    }
    setAttendance((prev) => {
      const existing = prev.find((a) => a.staffId === staffId && a.date.startsWith(dateStr))
      if (existing) return prev.map((a) => a.staffId === staffId && a.date.startsWith(dateStr) ? { ...a, status: next } : a)
      return [...prev, { id: key, staffId, date: dateStr, status: next }]
    })
    await fetch('/api/v1/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId, date: dateStr, status: next }),
    })
    setSaving(null)
  }

  async function markAllPresent() {
    const today = new Date()
    if (today.getMonth() + 1 !== month || today.getFullYear() !== year) return
    const dateStr = today.toISOString().split('T')[0]
    setMarkingAll(true)
    await fetch('/api/v1/attendance/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: dateStr, status: 'PRESENT' }),
    })
    await fetchData()
    setMarkingAll(false)
  }

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1) } else setMonth((m) => m - 1)
  }
  function nextMonth() {
    const now = new Date()
    if (year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)) return
    if (month === 12) { setMonth(1); setYear((y) => y + 1) } else setMonth((m) => m + 1)
  }

  const daysInMonth = getMonthDays(year, month)
  const monthName = new Date(year, month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })

  function getSummary(staffId: string) {
    const recs = attendance.filter((a) => a.staffId === staffId)
    const present = recs.filter((a) => a.status === 'PRESENT').length
    const half = recs.filter((a) => a.status === 'HALF_DAY').length
    const absent = recs.filter((a) => a.status === 'ABSENT').length
    return { present, half, absent, effective: present + half * 0.5 }
  }

  const isCurrentMonth = now.getMonth() + 1 === month && now.getFullYear() === year

  return (
    <main className="px-4 sm:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-foreground">Attendance</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Click a cell to mark: P → ½ → A → clear</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {isCurrentMonth && staff.length > 0 && (
            <button
              onClick={markAllPresent}
              disabled={markingAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <CheckSquare className="w-4 h-4" />
              {markingAll ? 'Marking…' : 'Mark All Present Today'}
            </button>
          )}
          <a
            href={`/api/v1/attendance/export?month=${month}&year=${year}`}
            download={`attendance-${year}-${month}.xlsx`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Download className="w-4 h-4" /> Export
          </a>
          <button onClick={prevMonth} className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-4 py-2 text-sm font-semibold text-foreground bg-card border border-border rounded-lg min-w-[160px] text-center">{monthName}</span>
          <button onClick={nextMonth} className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-16 animate-pulse">Loading attendance…</p>
      ) : staff.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl text-center py-20 shadow-sm">
          <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium text-foreground">No staff added yet</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center gap-5 text-xs text-muted-foreground">
            {[['P', 'bg-green-100 text-green-700 border-green-300', 'Present'], ['½', 'bg-yellow-100 text-yellow-700 border-yellow-300', 'Half Day'], ['A', 'bg-red-100 text-red-600 border-red-300', 'Absent']].map(([l, cls, label]) => (
              <div key={l} className="flex items-center gap-1.5">
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold border ${cls}`}>{l}</span>
                {label}
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky left-0 bg-muted/40 min-w-[160px]">Staff</th>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                    const isSun = new Date(year, month - 1, d).getDay() === 0
                    return <th key={d} className={`px-1 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[36px] ${isSun ? 'text-red-400' : 'text-muted-foreground'}`}>{d}</th>
                  })}
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {staff.map((s) => {
                  const summary = getSummary(s.id)
                  return (
                    <tr key={s.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-5 py-3 sticky left-0 bg-card">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {s.user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-foreground whitespace-nowrap">{s.user.name}</span>
                        </div>
                      </td>
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                        const status = getStatus(s.id, d)
                        const future = isFuture(year, month, d)
                        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                        const isSaving = saving === `${s.id}-${dateStr}`
                        return (
                          <td key={d} className="px-1 py-2 text-center">
                            <button
                              onClick={() => toggleStatus(s.id, d)}
                              disabled={future || !!isSaving}
                              className={`w-7 h-7 rounded text-xs font-bold border transition-all ${status ? STATUS_STYLE[status] : 'bg-muted/30 text-muted-foreground/30 border-border'} ${future ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110 cursor-pointer'} ${isSaving ? 'opacity-50' : ''}`}
                            >
                              {status ? STATUS_LABEL[status] : '·'}
                            </button>
                          </td>
                        )
                      })}
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-sm font-bold text-foreground">{summary.effective}</span>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">{summary.present}P · {summary.half}½ · {summary.absent}A</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground mt-4 text-center">
        <CalendarDays className="w-3.5 h-3.5 inline mr-1" />
        Sundays shown in red. Salary calculated at 26 working days/month.
      </p>
    </main>
  )
}
