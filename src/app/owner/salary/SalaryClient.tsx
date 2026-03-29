'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, IndianRupee, Wallet, CheckCircle2, Clock3, X, Download } from 'lucide-react'

type SalaryPayment = { id: string; amount: string; paymentMode: 'CASH' | 'PHONEPE'; paidOn: string; reference: string | null; notes: string | null }
type SalaryRecord = { id: string; staffId: string; month: number; year: number; daysPresent: string; perDayRate: string; totalEarned: string; totalPaid: string; paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID'; payments: SalaryPayment[] }
type SalarySummary = { staffId: string; staffName: string; monthlySalary: string; daysPresent: number; perDayRate: string; totalEarned: string; salaryRecord: SalaryRecord | null }

const PAYMENT_STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-red-50 text-red-700 border-red-200',
  PARTIAL: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  PAID: 'bg-green-50 text-green-700 border-green-200',
}

export default function SalaryClient() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [summary, setSummary] = useState<SalarySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState<string | null>(null)

  const [payingFor, setPayingFor] = useState<{ staffName: string; recordId: string; balance: number } | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payMode, setPayMode] = useState<'CASH' | 'PHONEPE'>('CASH')
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0])
  const [payRef, setPayRef] = useState('')
  const [payNotes, setPayNotes] = useState('')
  const [paySubmitting, setPaySubmitting] = useState(false)
  const [payError, setPayError] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/v1/salary?month=${month}&year=${year}`)
    if (res.ok) { const data = await res.json(); setSummary(data.summary) }
    setLoading(false)
  }, [month, year])

  useEffect(() => { fetchData() }, [fetchData])

  async function calculateSalary(staffId: string) {
    setCalculating(staffId)
    await fetch('/api/v1/salary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId, month, year }),
    })
    await fetchData()
    setCalculating(null)
  }

  function openPayment(row: SalarySummary, isAdvance = false) {
    if (!row.salaryRecord) return
    const balance = parseFloat(row.totalEarned) - parseFloat(row.salaryRecord.totalPaid)
    setPayingFor({ staffName: row.staffName, recordId: row.salaryRecord.id, balance })
    setPayAmount(isAdvance ? '' : balance.toFixed(0))
    setPayError('')
  }

  async function handlePayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!payingFor) return
    setPayError('')
    setPaySubmitting(true)
    const res = await fetch(`/api/v1/salary/${payingFor.recordId}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: payAmount, paymentMode: payMode, paidOn: payDate, reference: payRef || undefined, notes: payNotes || undefined }),
    })
    if (res.ok) {
      setPayingFor(null); setPayAmount(''); setPayRef(''); setPayNotes('')
      await fetchData()
    } else {
      const data = await res.json(); setPayError(data.message || 'Payment failed')
    }
    setPaySubmitting(false)
  }

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1) } else setMonth((m) => m - 1)
  }
  function nextMonth() {
    const now = new Date()
    if (year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)) return
    if (month === 12) { setMonth(1); setYear((y) => y + 1) } else setMonth((m) => m + 1)
  }

  const monthName = new Date(year, month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
  const totalEarned = summary.reduce((s, r) => s + parseFloat(r.totalEarned), 0)
  const totalPaid = summary.reduce((s, r) => s + parseFloat(r.salaryRecord?.totalPaid ?? '0'), 0)

  return (
    <main className="px-4 sm:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-foreground">Salary</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Calculate and record salary payments</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <a
            href={`/api/v1/salary/export?month=${month}&year=${year}`}
            download={`salary-${year}-${month}.xlsx`}
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

      {!loading && summary.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-card border border-border border-l-4 border-l-violet-400 rounded-xl p-5 shadow-sm">
            <IndianRupee className="w-5 h-5 text-violet-500 mb-2" />
            <p className="text-3xl font-bold text-foreground">₹{totalEarned.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5 uppercase tracking-wide">Total Earned</p>
          </div>
          <div className="bg-card border border-border border-l-4 border-l-green-400 rounded-xl p-5 shadow-sm">
            <Wallet className="w-5 h-5 text-green-500 mb-2" />
            <p className="text-3xl font-bold text-foreground">₹{totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5 uppercase tracking-wide">Total Paid</p>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-16 animate-pulse">Loading…</p>
      ) : summary.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl text-center py-20 shadow-sm">
          <Wallet className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium text-foreground">No staff added yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {summary.map((row) => {
            const record = row.salaryRecord
            const totalPaidNum = parseFloat(record?.totalPaid ?? '0')
            const totalEarnedNum = parseFloat(row.totalEarned)
            const balance = totalEarnedNum - totalPaidNum

            return (
              <div key={row.staffId} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {row.staffName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{row.staffName}</p>
                      <p className="text-xs text-muted-foreground">₹{Number(row.monthlySalary).toLocaleString('en-IN')}/month · ₹{row.perDayRate}/day</p>
                    </div>
                  </div>
                  {record && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${PAYMENT_STATUS_STYLE[record.paymentStatus]}`}>
                      {record.paymentStatus === 'PAID' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {record.paymentStatus === 'PARTIAL' && <Clock3 className="w-3 h-3 mr-1" />}
                      {record.paymentStatus}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 mb-5">
                  <div className="bg-muted/40 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-foreground">{row.daysPresent}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Days Present</p>
                  </div>
                  <div className="bg-muted/40 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-foreground">₹{parseFloat(row.totalEarned).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Earned</p>
                  </div>
                  <div className={`rounded-xl p-3 text-center ${balance > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                    <p className={`text-lg font-bold ${balance > 0 ? 'text-red-700' : 'text-green-700'}`}>₹{Math.abs(balance).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                    <p className={`text-xs mt-0.5 ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{balance > 0 ? 'Balance Due' : 'Settled'}</p>
                  </div>
                </div>

                {record && record.payments.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Payments</p>
                    {record.payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-sm bg-muted/30 px-3 py-2 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${p.paymentMode === 'CASH' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{p.paymentMode}</span>
                          <span className="text-muted-foreground text-xs">{new Date(p.paidOn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                          {p.reference && <span className="text-xs text-muted-foreground">Ref: {p.reference}</span>}
                          {p.notes && <span className="text-xs text-muted-foreground">{p.notes}</span>}
                        </div>
                        <span className="font-semibold text-foreground">₹{parseFloat(p.amount).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {!record && (
                    <button onClick={() => calculateSalary(row.staffId)} disabled={calculating === row.staffId}
                      className="px-4 py-2 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary/5 transition-colors disabled:opacity-50">
                      {calculating === row.staffId ? 'Calculating…' : 'Calculate Salary'}
                    </button>
                  )}
                  {record && record.paymentStatus !== 'PAID' && (
                    <button onClick={() => openPayment(row)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
                      <IndianRupee className="w-3.5 h-3.5" /> Record Payment
                    </button>
                  )}
                  {record && record.paymentStatus !== 'PAID' && (
                    <button onClick={() => openPayment(row, true)}
                      className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                      Record Advance
                    </button>
                  )}
                  {record && (
                    <button onClick={() => calculateSalary(row.staffId)} disabled={calculating === row.staffId}
                      className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50">
                      {calculating === row.staffId ? 'Recalculating…' : 'Recalculate'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Payment modal */}
      {payingFor && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-foreground">Record Payment — {payingFor.staffName}</h2>
                <button onClick={() => setPayingFor(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handlePayment} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Amount (₹) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                    <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} required min="1"
                      className="w-full pl-7 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Payment Mode *</label>
                  <div className="flex gap-2">
                    {(['CASH', 'PHONEPE'] as const).map((m) => (
                      <button key={m} type="button" onClick={() => setPayMode(m)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${payMode === m ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:text-foreground hover:bg-accent'}`}>
                        {m === 'CASH' ? 'Cash' : 'PhonePe'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Date *</label>
                  <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} required
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                {payMode === 'PHONEPE' && (
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Reference / UTR</label>
                    <input type="text" value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="Transaction reference"
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Notes</label>
                  <input type="text" value={payNotes} onChange={(e) => setPayNotes(e.target.value)} placeholder="e.g. Advance for March"
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                {payError && <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{payError}</p>}
                <div className="flex flex-col gap-2 pt-1">
                  <button type="submit" disabled={paySubmitting}
                    className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
                    {paySubmitting ? 'Saving…' : 'Save Payment'}
                  </button>
                  <button type="button" onClick={() => setPayingFor(null)}
                    className="w-full py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
