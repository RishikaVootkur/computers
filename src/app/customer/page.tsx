import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Monitor, Package, Clock, CheckCircle2, Wrench, LogOut } from 'lucide-react'
import LogoutButton from '@/components/LogoutButton'
import StatusBadge from '@/components/StatusBadge'

export const metadata = { title: 'My Repairs — Rishika Computers' }

export default async function CustomerPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  if (user.role !== 'CUSTOMER') {
    if (user.role === 'OWNER') redirect('/owner')
    if (user.role === 'STAFF') redirect('/dashboard')
  }

  // Find customer record linked to this user (by email or phone)
  const userRecord = await prisma.user.findUnique({ where: { id: user.userId } })
  if (!userRecord) redirect('/login')

  const customer = await prisma.customer.findFirst({
    where: {
      shopId: user.shopId,
      OR: [
        { email: userRecord.email },
        ...(userRecord.phone ? [{ phone: userRecord.phone }] : []),
      ],
    },
  })

  const jobs = customer
    ? await prisma.serviceJob.findMany({
        where: { customerId: customer.id },
        include: { statusLogs: { orderBy: { changedAt: 'desc' }, take: 1 } },
        orderBy: { createdAt: 'desc' },
      })
    : []

  const active = jobs.filter(j => !['DELIVERED', 'CANCELLED'].includes(j.status))
  const completed = jobs.filter(j => j.status === 'DELIVERED')

  const statusIcons: Record<string, React.ReactNode> = {
    RECEIVED: <Clock className="w-4 h-4 text-blue-500" />,
    DIAGNOSED: <Package className="w-4 h-4 text-purple-500" />,
    IN_PROGRESS: <Wrench className="w-4 h-4 text-orange-500" />,
    WAITING_FOR_PARTS: <Package className="w-4 h-4 text-amber-500" />,
    COMPLETED: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    DELIVERED: <CheckCircle2 className="w-4 h-4 text-green-600" />,
    CANCELLED: <Package className="w-4 h-4 text-gray-400" />,
  }

  const friendlyStatus: Record<string, string> = {
    RECEIVED: 'We received your device',
    DIAGNOSED: 'Diagnosis complete',
    IN_PROGRESS: 'Repair in progress',
    WAITING_FOR_PARTS: 'Waiting for parts',
    COMPLETED: 'Repair complete, ready for pickup',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="px-4 sm:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-2 font-bold text-primary">
            <Monitor className="w-5 h-5" />
            <span>Rishika Computers</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold">{user.name}</p>
              <p className="text-[10px] text-muted-foreground">Customer</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-8 py-8 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold">My Repairs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Welcome back, {user.name}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-primary">{jobs.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Total Jobs</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-orange-500">{active.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Active</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{completed.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Delivered</div>
          </div>
        </div>

        {jobs.length === 0 && (
          <div className="bg-card border border-border rounded-2xl text-center py-16">
            <Wrench className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-medium text-foreground">No repair jobs found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {customer
                ? 'You have no repair jobs yet.'
                : 'Your account is not linked to any repair jobs yet. Make sure the phone number on your account matches what you gave us.'}
            </p>
          </div>
        )}

        {/* Active jobs */}
        {active.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Active</h2>
            <div className="space-y-3">
              {active.map(job => (
                <div key={job.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary">{job.jobNumber}</span>
                        {job.isUrgent && <span className="text-xs font-semibold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">URGENT</span>}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 capitalize">
                        {job.deviceType.replace(/_/g, ' ').toLowerCase()}
                        {job.problemNotes && <span> · {job.problemNotes}</span>}
                      </div>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-sm text-foreground">
                    {statusIcons[job.status]}
                    <span>{friendlyStatus[job.status]}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Dropped on {new Date(job.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {job.estimatedAmount && <span> · Estimate: ₹{Number(job.estimatedAmount).toLocaleString('en-IN')}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed jobs */}
        {completed.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Delivered</h2>
            <div className="space-y-3">
              {completed.map(job => (
                <div key={job.id} className="bg-card border border-border rounded-xl p-4 opacity-75">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-bold text-muted-foreground">{job.jobNumber}</span>
                      <div className="text-sm text-muted-foreground mt-1 capitalize">
                        {job.deviceType.replace(/_/g, ' ').toLowerCase()}
                      </div>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {new Date(job.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {job.finalAmount && <span> · Paid: ₹{Number(job.finalAmount).toLocaleString('en-IN')}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-10">
          Questions? Call us at{' '}
          <a href="tel:040-XXXXXXXX" className="text-primary hover:underline">040-XXXXXXXX</a>
        </p>
      </main>
    </div>
  )
}
