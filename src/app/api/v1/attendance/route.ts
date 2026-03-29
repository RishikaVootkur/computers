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

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)

  const staff = await prisma.staff.findMany({
    where: { shopId: user.shopId, isActive: true },
    include: { user: { select: { name: true } } },
    orderBy: { joinedOn: 'asc' },
  })

  const staffIds = staff.map((s) => s.id)

  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      staffId: { in: staffIds },
      date: { gte: startDate, lte: endDate },
    },
  })

  return NextResponse.json({ staff, attendance: attendanceRecords, month, year, daysInMonth: endDate.getDate() })
}

export async function POST(req: NextRequest) {
  const user = getAuthFromRequest(req)
  if (!user || user.role !== 'OWNER') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { staffId, date, status, notes } = body

  if (!staffId || !date || !status) {
    return NextResponse.json({ message: 'staffId, date and status are required' }, { status: 400 })
  }

  const staffMember = await prisma.staff.findFirst({
    where: { id: staffId, shopId: user.shopId, isActive: true },
  })
  if (!staffMember) {
    return NextResponse.json({ message: 'Staff not found' }, { status: 404 })
  }

  const parsedDate = new Date(date)
  parsedDate.setHours(0, 0, 0, 0)

  const record = await prisma.attendance.upsert({
    where: { staffId_date: { staffId, date: parsedDate } },
    update: { status, notes: notes || null },
    create: { staffId, date: parsedDate, status, notes: notes || null },
  })

  return NextResponse.json({ record })
}
