import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAuthUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import StatusBadge from '@/components/StatusBadge'
import { Clock3, Wrench, Layers, TrendingUp, IndianRupee } from 'lucide-react'

export default async function OwnerPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  if (user.role !== 'OWNER') redirect('/dashboard')

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

  const [todayCount, activeCount, totalCount, recentJobs, statusBreakdown, revenueThisMonth, revenueTotal] =
    await Promise.all([
      prisma.serviceJob.count({
        where: { shopId: user.shopId, createdAt: { gte: today, lt: tomorrow } },
      }),
      prisma.serviceJob.count({
        where: { shopId: user.shopId, status: { notIn: ['DELIVERED', 'CANCELLED'] } },
      }),
      prisma.serviceJob.count({ where: { shopId: user.shopId } }),
      prisma.serviceJob.findMany({
        where: { shopId: user.shopId },
        include: { customer: { select: { name: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.serviceJob.groupBy({
        by: ['status'],
        where: { shopId: user.shopId, status: { notIn: ['DELIVERED', 'CANCELLED'] } },
        _count: { _all: true },
      }),
      prisma.serviceJob.aggregate({
        where: { shopId: user.shopId, status: 'DELIVERED', createdAt: { gte: monthStart } },
        _sum: { finalAmount: true },
      }),
      prisma.serviceJob.aggregate({
        where: { shopId: user.shopId, status: 'DELIVERED' },
        _sum: { finalAmount: true },
      }),
    ])

  const todayDate = today.toLocaleDateString('en-IN', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })

  const revenueMonth = Number(revenueThisMonth._sum.finalAmount ?? 0)
  const revenueAll = Number(revenueTotal._sum.finalAmount ?? 0)

  // Last 6 months revenue chart data
  const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1)
  const recentDelivered = await prisma.serviceJob.findMany({
    where: { shopId: user.shopId, status: 'DELIVERED', createdAt: { gte: sixMonthsAgo } },
    select: { finalAmount: true, createdAt: true },
  })
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - 5 + i, 1)
    const label = d.toLocaleDateString('en-IN', { month: 'short' })
    const total = recentDelivered
      .filter((j) => {
        const jd = new Date(j.createdAt)
        return jd.getFullYear() === d.getFullYear() && jd.getMonth() === d.getMonth()
      })
      .reduce((sum, j) => sum + Number(j.finalAmount ?? 0), 0)
    return { label, total }
  })
  const chartMax = Math.max(...chartData.map((d) => d.total), 1)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="px-4 sm:px-8 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-foreground">Overview</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{todayDate}</p>
          </div>
          <Link href="/service/new" className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm">
            + New Job
          </Link>
        </div>

        {/* Job stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <StatCard icon={<Clock3 className="w-5 h-5 text-blue-500" />} label="Today" value={todayCount} accent="blue" />
          <StatCard icon={<Wrench className="w-5 h-5 text-orange-500" />} label="Active" value={activeCount} accent="orange" />
          <StatCard icon={<Layers className="w-5 h-5 text-violet-500" />} label="Total" value={totalCount} accent="violet" />
          <StatCard icon={<TrendingUp className="w-5 h-5 text-green-500" />} label="Delivered" value={totalCount - activeCount} accent="green" />
        </div>

        {/* Revenue cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-card border border-border border-l-4 border-l-emerald-400 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <IndianRupee className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-3xl font-bold text-foreground">₹{revenueMonth.toLocaleString('en-IN')}</p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5 uppercase tracking-wide">This Month's Revenue</p>
          </div>
          <div className="bg-card border border-border border-l-4 border-l-teal-400 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <IndianRupee className="w-5 h-5 text-teal-500" />
            </div>
            <p className="text-3xl font-bold text-foreground">₹{revenueAll.toLocaleString('en-IN')}</p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5 uppercase tracking-wide">Total Revenue</p>
          </div>
        </div>

        {/* Revenue chart */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-6 shadow-sm">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Revenue — Last 6 Months</h2>
          <div className="flex items-end gap-3 h-28">
            {chartData.map((d) => (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">{d.total > 0 ? `₹${Math.round(d.total / 1000)}k` : ''}</span>
                <div className="w-full bg-muted rounded-t-md overflow-hidden" style={{ height: 72 }}>
                  <div className="w-full bg-emerald-500 rounded-t-md transition-all"
                    style={{ height: `${(d.total / chartMax) * 100}%`, marginTop: `${100 - (d.total / chartMax) * 100}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Active pipeline */}
        {statusBreakdown.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5 mb-6 shadow-sm">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Active Pipeline</h2>
            <div className="flex flex-wrap gap-3">
              {statusBreakdown.map((row) => (
                <div key={row.status} className="flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-lg">
                  <StatusBadge status={row.status} />
                  <span className="text-sm font-bold text-foreground">{row._count._all}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent jobs */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Recent Jobs</h2>
            <Link href="/dashboard" className="text-xs text-primary hover:underline font-medium">View all →</Link>
          </div>
          {recentJobs.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">No jobs yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {['Job #', 'Customer', 'Device', 'Status', 'Date'].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-5 py-3.5">
                        <Link href={`/service/${job.id}`} className="font-mono text-sm font-semibold text-primary group-hover:underline">{job.jobNumber}</Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-foreground">{job.customer.name}</p>
                        <p className="text-xs text-muted-foreground">{job.customer.phone}</p>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-foreground capitalize">{job.deviceType.replace(/_/g, ' ').toLowerCase()}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={job.status} /></td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(job.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function StatCard({ icon, label, value, accent }: {
  icon: React.ReactNode; label: string; value: number; accent: 'blue' | 'orange' | 'violet' | 'green'
}) {
  const borderColors = { blue: 'border-l-blue-400', orange: 'border-l-orange-400', violet: 'border-l-violet-400', green: 'border-l-green-400' }
  return (
    <div className={`bg-card border border-border border-l-4 ${borderColors[accent]} rounded-xl p-5 shadow-sm`}>
      <div className="flex items-center justify-between mb-2">{icon}</div>
      <p className="text-3xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground font-medium mt-0.5 uppercase tracking-wide">{label}</p>
    </div>
  )
}
