import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import LeaveStaffClient from './LeaveStaffClient'

export default async function StaffLeavePage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  if (user.role === 'OWNER') redirect('/owner/leave')

  const staffMember = await prisma.staff.findFirst({ where: { userId: user.userId } })

  const requests = staffMember
    ? await prisma.leaveRequest.findMany({
        where: { staffId: staffMember.id },
        orderBy: { createdAt: 'desc' },
      })
    : []

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="px-4 sm:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground">Leave Requests</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Submit and track your leave requests</p>
        </div>
        <LeaveStaffClient initialRequests={requests.map((r) => ({
          id: r.id,
          date: r.date.toISOString(),
          type: r.type,
          reason: r.reason,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
        }))} />
      </main>
    </div>
  )
}
