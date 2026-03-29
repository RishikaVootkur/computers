import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const user = getAuthFromRequest(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  if (user.role === 'OWNER') {
    // Owner sees all leave requests for the shop
    const requests = await prisma.leaveRequest.findMany({
      where: { staff: { shopId: user.shopId } },
      include: { staff: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ requests })
  } else {
    // Staff sees only their own requests
    const staffMember = await prisma.staff.findFirst({ where: { userId: user.userId } })
    if (!staffMember) return NextResponse.json({ requests: [] })

    const requests = await prisma.leaveRequest.findMany({
      where: { staffId: staffMember.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ requests })
  }
}

export async function POST(req: NextRequest) {
  const user = getAuthFromRequest(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { date, type, reason } = body

  if (!date || !type) return NextResponse.json({ message: 'date and type are required' }, { status: 400 })

  const staffMember = await prisma.staff.findFirst({ where: { userId: user.userId } })
  if (!staffMember) return NextResponse.json({ message: 'Staff record not found' }, { status: 404 })

  const request = await prisma.leaveRequest.create({
    data: {
      staffId: staffMember.id,
      date: new Date(date),
      type,
      reason: reason?.trim() || null,
    },
  })
  return NextResponse.json({ request }, { status: 201 })
}
