import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { getAuthUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import Navbar from '@/components/Navbar'
import StatusBadge from '@/components/StatusBadge'
import { Wrench, CheckCircle2, Clock3, Layers, Download } from 'lucide-react'
import DashboardFilters from './DashboardFilters'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; device?: string }>
}) {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const { q, status, device } = await searchParams

  const where: Prisma.ServiceJobWhereInput = { shopId: user.shopId }
  // Staff only see jobs assigned to them
  if (user.role === 'STAFF') where.assignedTo = user.userId
  if (status) where.status = status as Prisma.EnumJobStatusFilter
  if (device) where.deviceType = device as Prisma.EnumDeviceTypeFilter
  if (q) {
    where.OR = [
      { jobNumber: { contains: q, mode: 'insensitive' } },
      { customer: { name: { contains: q, mode: 'insensitive' } } },
      { customer: { phone: { contains: q } } },
    ]
  }

  const jobs = await prisma.serviceJob.findMany({
    where,
    include: { customer: { select: { name: true, phone: true } } },
    orderBy: [{ isUrgent: 'desc' }, { createdAt: 'desc' }],
    take: 200,
  })

  const allJobsWhere: Prisma.ServiceJobWhereInput = { shopId: user.shopId }
  if (user.role === 'STAFF') allJobsWhere.assignedTo = user.userId

  const allJobs = await prisma.serviceJob.findMany({
    where: allJobsWhere,
    select: { status: true, createdAt: true },
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayCount = allJobs.filter((j) => new Date(j.createdAt) >= today).length
  const activeCount = allJobs.filter((j) => !['DELIVERED', 'CANCELLED'].includes(j.status)).length
  const deliveredCount = allJobs.filter((j) => j.status === 'DELIVERED').length

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="px-4 sm:px-8 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-foreground">Service Jobs</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Welcome back, {user.name}</p>
          </div>
          <div className="flex items-center gap-2">
            {user.role === 'OWNER' && (
              <a
                href="/api/v1/jobs/export"
                download="jobs.xlsx"
                className="flex items-center gap-1.5 border border-border px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </a>
            )}
            <Link href="/service/new" className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm">
              + New Job
            </Link>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Clock3 className="w-5 h-5 text-blue-500" />} label="Today" value={todayCount} accent="blue" />
          <StatCard icon={<Wrench className="w-5 h-5 text-orange-500" />} label="Active" value={activeCount} accent="orange" />
          <StatCard icon={<Layers className="w-5 h-5 text-violet-500" />} label="Total" value={allJobs.length} accent="violet" />
          <StatCard icon={<CheckCircle2 className="w-5 h-5 text-green-500" />} label="Delivered" value={deliveredCount} accent="green" />
        </div>

        {/* Search + filters */}
        <Suspense>
          <DashboardFilters />
        </Suspense>

        {/* Jobs table */}
        {jobs.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl text-center py-20 shadow-sm">
            <Wrench className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-medium text-foreground">{q || status || device ? 'No jobs match your filters.' : 'No jobs yet.'}</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-border text-xs text-muted-foreground">
              {jobs.length} job{jobs.length !== 1 ? 's' : ''}{q || status || device ? ' matching filters' : ''}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {['Job #', 'Customer', 'Phone', 'Device', 'Status', 'Date'].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <Link href={`/service/${job.id}`} className="font-mono text-sm font-semibold text-primary group-hover:underline">{job.jobNumber}</Link>
                          {job.isUrgent && <span className="text-xs font-semibold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">URGENT</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-medium text-foreground">{job.customer.name}</td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">{job.customer.phone}</td>
                      <td className="px-5 py-3.5 text-sm text-foreground capitalize">{job.deviceType.replace(/_/g, ' ').toLowerCase()}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={job.status} /></td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(job.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
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
