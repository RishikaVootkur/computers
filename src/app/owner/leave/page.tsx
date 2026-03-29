import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import LeaveOwnerClient from './LeaveOwnerClient'

export default async function LeavePage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  if (user.role !== 'OWNER') redirect('/dashboard')

  const requests = await prisma.leaveRequest.findMany({
    where: { staff: { shopId: user.shopId } },
    include: { staff: { include: { user: { select: { name: true } } } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="px-4 sm:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground">Leave Requests</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Approve or reject staff leave requests</p>
        </div>
        <LeaveOwnerClient initialRequests={requests.map((r) => ({
          id: r.id,
          date: r.date.toISOString(),
          type: r.type,
          reason: r.reason,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
          staffName: r.staff.user.name,
        }))} />
      </main>
    </div>
  )
}
