import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const user = getAuthFromRequest(req)
  if (!user || user.role !== 'OWNER') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const monthParam = req.nextUrl.searchParams.get('month') // YYYY-MM
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
      const [totalAssigned, completedJobs] = await Promise.all([
        prisma.serviceJob.count({
          where: { assignedTo: s.userId, shopId: user.shopId, createdAt: { gte: start, lt: end } },
        }),
        prisma.serviceJob.count({
          where: {
            assignedTo: s.userId,
            shopId: user.shopId,
            status: { in: ['COMPLETED', 'DELIVERED'] },
            updatedAt: { gte: start, lt: end },
          },
        }),
      ])
      return { staffId: s.id, name: s.user.name, totalAssigned, completedJobs }
    }),
  )

  return NextResponse.json({ performance, month: month + 1, year })
}
