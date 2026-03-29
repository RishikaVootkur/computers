import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { BarChart2 } from 'lucide-react'

export default async function StaffPerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  if (user.role !== 'OWNER') redirect('/dashboard')

  const { month: monthParam } = await searchParams
  const now = new Date()
  const year = monthParam ? parseInt(monthParam.split('-')[0]) : now.getFullYear()
  const month = monthParam ? parseInt(monthParam.split('-')[1]) - 1 : now.getMonth()
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 1)

  const staff = await prisma.staff.findMany({
    where: { shopId: user.shopId, isActive: true },
    include: { user: { select: { id: true, name: true } } },
  })

  const performance = await Promise.all(
    staff.map(async (s) => {
      const [assigned, completed, revenue] = await Promise.all([
        prisma.serviceJob.count({ where: { assignedTo: s.userId, shopId: user.shopId, createdAt: { gte: start, lt: end } } }),
        prisma.serviceJob.count({ where: { assignedTo: s.userId, shopId: user.shopId, status: { in: ['COMPLETED', 'DELIVERED'] }, updatedAt: { gte: start, lt: end } } }),
        prisma.serviceJob.aggregate({ where: { assignedTo: s.userId, shopId: user.shopId, status: 'DELIVERED', updatedAt: { gte: start, lt: end } }, _sum: { finalAmount: true } }),
      ])
      return { name: s.user.name, assigned, completed, revenue: Number(revenue._sum.finalAmount ?? 0) }
    }),
  )

  const monthLabel = start.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  const maxCompleted = Math.max(...performance.map((p) => p.completed), 1)

  // Last 6 months for nav
  const months: { label: string; value: string }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      label: d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    })
  }
  const currentValue = `${year}-${String(month + 1).padStart(2, '0')}`

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="px-4 sm:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-foreground">Staff Performance</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{monthLabel}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {months.map((m) => (
              <Link key={m.value} href={`/owner/staff-performance?month=${m.value}`}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${m.value === currentValue ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:text-foreground hover:bg-accent'}`}>
                {m.label}
              </Link>
            ))}
          </div>
        </div>

        {performance.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl text-center py-20">
            <BarChart2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No active staff found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {performance.map((p) => (
              <div key={p.name} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-foreground">{p.name}</h2>
                  <span className="text-sm text-muted-foreground">₹{p.revenue.toLocaleString('en-IN')} revenue</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-muted/40 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">{p.assigned}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Assigned</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-green-700">{p.completed}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Completed</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Completion rate</span>
                    <span>{p.assigned > 0 ? Math.round((p.completed / p.assigned) * 100) : 0}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${maxCompleted > 0 ? (p.completed / maxCompleted) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
