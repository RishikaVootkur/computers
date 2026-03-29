import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/v1/attendance/bulk — mark all active staff with the same status for a given date
export async function POST(req: NextRequest) {
  const user = getAuthFromRequest(req)
  if (!user || user.role !== 'OWNER') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { date, status } = body

  if (!date || !status) {
    return NextResponse.json({ message: 'date and status are required' }, { status: 400 })
  }

  const staff = await prisma.staff.findMany({
    where: { shopId: user.shopId, isActive: true },
    select: { id: true },
  })

  const parsedDate = new Date(date)
  parsedDate.setHours(0, 0, 0, 0)

  await Promise.all(
    staff.map((s) =>
      prisma.attendance.upsert({
        where: { staffId_date: { staffId: s.id, date: parsedDate } },
        update: { status },
        create: { staffId: s.id, date: parsedDate, status },
      })
    )
  )

  return NextResponse.json({ marked: staff.length })
}
