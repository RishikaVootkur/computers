import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getAuthUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import StatusBadge from '@/components/StatusBadge'
import { ArrowLeft, Phone, Layers, CheckCircle2, Clock3 } from 'lucide-react'

export default async function CustomerJobsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const { id } = await params

  const customer = await prisma.customer.findFirst({
    where: { id, shopId: user.shopId },
  })
  if (!customer) notFound()

  const jobs = await prisma.serviceJob.findMany({
    where: { customerId: id, shopId: user.shopId },
    orderBy: { createdAt: 'desc' },
  })

  const activeJobs = jobs.filter((j) => !['DELIVERED', 'CANCELLED'].includes(j.status))
  const finishedJobs = jobs.filter((j) => ['DELIVERED', 'CANCELLED'].includes(j.status))

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="px-4 sm:px-8 py-8">
        <Link
          href="/service/new"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to New Job
        </Link>

        {/* Customer header */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold flex-shrink-0">
              {customer.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{customer.name}</h1>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                <Phone className="w-3.5 h-3.5" />
                {customer.phone}
              </p>
            </div>
            <div className="ml-auto flex gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-foreground">{jobs.length}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mt-0.5">Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-500">{activeJobs.length}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mt-0.5">Active</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{finishedJobs.length}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mt-0.5">Done</p>
              </div>
            </div>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl text-center py-20 shadow-sm">
            <Layers className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-medium text-foreground">No jobs yet for this customer</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active jobs */}
            {activeJobs.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock3 className="w-4 h-4 text-orange-500" />
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Active Jobs</h2>
                </div>
                <JobTable jobs={activeJobs} />
              </div>
            )}

            {/* Finished jobs */}
            {finishedJobs.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Finished Jobs</h2>
                </div>
                <JobTable jobs={finishedJobs} />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function JobTable({ jobs }: {
  jobs: {
    id: string
    jobNumber: string
    deviceType: string
    status: string
    estimatedAmount: unknown
    finalAmount: unknown
    createdAt: Date
  }[]
}) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {['Job #', 'Device', 'Status', 'Estimated', 'Final Amount', 'Date'].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-muted/20 transition-colors group">
                <td className="px-5 py-3.5">
                  <Link
                    href={`/service/${job.id}`}
                    className="font-mono text-sm font-semibold text-primary group-hover:underline"
                  >
                    {job.jobNumber}
                  </Link>
                </td>
                <td className="px-5 py-3.5 text-sm text-foreground capitalize">
                  {job.deviceType.replace(/_/g, ' ').toLowerCase()}
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={job.status} />
                </td>
                <td className="px-5 py-3.5 text-sm text-muted-foreground">
                  {job.estimatedAmount ? `₹${job.estimatedAmount}` : '—'}
                </td>
                <td className="px-5 py-3.5 text-sm font-semibold text-foreground">
                  {job.finalAmount ? `₹${job.finalAmount}` : '—'}
                </td>
                <td className="px-5 py-3.5 text-sm text-muted-foreground whitespace-nowrap">
                  {new Date(job.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
