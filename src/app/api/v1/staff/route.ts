import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  const user = getAuthFromRequest(req)
  if (!user || user.role !== 'OWNER') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const staff = await prisma.staff.findMany({
    where: { shopId: user.shopId, isActive: true },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, isActive: true } },
    },
    orderBy: { joinedOn: 'asc' },
  })

  return NextResponse.json({ staff })
}

export async function POST(req: NextRequest) {
  const user = getAuthFromRequest(req)
  if (!user || user.role !== 'OWNER') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, phone, monthlySalary } = body

  if (!name || !monthlySalary) {
    return NextResponse.json({ message: 'name and monthlySalary are required' }, { status: 400 })
  }

  // Auto-generate a unique email so the User record is valid
  const slug = name.toLowerCase().replace(/\s+/g, '.') + '.' + Date.now()
  const email = `${slug}@staff.rishikacomputers.local`

  const hashed = await bcrypt.hash('staff@123', 10)

  const newUser = await prisma.user.create({
    data: {
      shopId: user.shopId,
      name,
      email,
      password: hashed,
      phone: phone || null,
      role: 'STAFF',
    },
  })

  const staff = await prisma.staff.create({
    data: {
      userId: newUser.id,
      shopId: user.shopId,
      monthlySalary: parseFloat(monthlySalary),
    },
  })

  return NextResponse.json({ staff: { ...staff, user: newUser } }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const user = getAuthFromRequest(req)
  if (!user || user.role !== 'OWNER') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { staffId } = body

  if (!staffId) {
    return NextResponse.json({ message: 'staffId is required' }, { status: 400 })
  }

  const staffMember = await prisma.staff.findFirst({
    where: { id: staffId, shopId: user.shopId },
  })
  if (!staffMember) {
    return NextResponse.json({ message: 'Staff not found' }, { status: 404 })
  }

  await prisma.$transaction([
    prisma.staff.update({ where: { id: staffId }, data: { isActive: false } }),
    prisma.user.update({ where: { id: staffMember.userId }, data: { isActive: false } }),
  ])

  return NextResponse.json({ message: 'Staff deactivated' })
}
