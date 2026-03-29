import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const user = getAuthFromRequest(req)
  if (!user || user.role !== 'OWNER') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const month = parseInt(searchParams.get('month') ?? '')
  const year = parseInt(searchParams.get('year') ?? '')

  if (!month || !year) {
    return NextResponse.json({ message: 'month and year are required' }, { status: 400 })
  }

  const staff = await prisma.staff.findMany({
    where: { shopId: user.shopId, isActive: true },
    include: { user: { select: { name: true } } },
    orderBy: { joinedOn: 'asc' },
  })

  const staffIds = staff.map((s) => s.id)

  const [salaryRecords, attendanceRecords] = await Promise.all([
    prisma.salaryRecord.findMany({
      where: { staffId: { in: staffIds }, month, year },
      include: { payments: { orderBy: { paidOn: 'desc' } } },
    }),
    prisma.attendance.findMany({
      where: {
        staffId: { in: staffIds },
        date: { gte: new Date(year, month - 1, 1), lte: new Date(year, month, 0) },
      },
    }),
  ])

  const daysInMonth = new Date(year, month, 0).getDate()

  const summary = staff.map((s) => {
    const record = salaryRecords.find((r) => r.staffId === s.id)
    const myAttendance = attendanceRecords.filter((a) => a.staffId === s.id)
    const daysPresent = myAttendance.reduce((sum, a) => {
      if (a.status === 'PRESENT') return sum + 1
      if (a.status === 'HALF_DAY') return sum + 0.5
      return sum
    }, 0)
    const perDayRate = parseFloat(s.monthlySalary.toString()) / 26
    const totalEarned = daysPresent * perDayRate

    return {
      staffId: s.id,
      staffName: s.user.name,
      monthlySalary: s.monthlySalary,
      daysInMonth,
      daysPresent,
      perDayRate: perDayRate.toFixed(2),
      totalEarned: totalEarned.toFixed(2),
      salaryRecord: record ?? null,
    }
  })

  return NextResponse.json({ summary, month, year })
}

export async function POST(req: NextRequest) {
  const user = getAuthFromRequest(req)
  if (!user || user.role !== 'OWNER') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { staffId, month, year } = body

  if (!staffId || !month || !year) {
    return NextResponse.json({ message: 'staffId, month and year are required' }, { status: 400 })
  }

  const staffMember = await prisma.staff.findFirst({
    where: { id: staffId, shopId: user.shopId },
  })
  if (!staffMember) {
    return NextResponse.json({ message: 'Staff not found' }, { status: 404 })
  }

  const attendance = await prisma.attendance.findMany({
    where: {
      staffId,
      date: { gte: new Date(year, month - 1, 1), lte: new Date(year, month, 0) },
    },
  })

  const daysPresent = attendance.reduce((sum, a) => {
    if (a.status === 'PRESENT') return sum + 1
    if (a.status === 'HALF_DAY') return sum + 0.5
    return sum
  }, 0)

  const monthlySalary = parseFloat(staffMember.monthlySalary.toString())
  const perDayRate = monthlySalary / 26
  const totalEarned = daysPresent * perDayRate

  const record = await prisma.salaryRecord.upsert({
    where: { staffId_month_year: { staffId, month, year } },
    update: {
      daysPresent,
      perDayRate,
      totalEarned,
    },
    create: {
      staffId,
      month,
      year,
      daysPresent,
      perDayRate,
      totalEarned,
    },
  })

  return NextResponse.json({ record })
}
