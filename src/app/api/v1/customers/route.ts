import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/v1/customers?phone=XXXXXXXXXX — lookup customer by phone
export async function GET(req: NextRequest) {
  const user = getAuthFromRequest(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const phone = req.nextUrl.searchParams.get('phone')
  if (!phone) return NextResponse.json({ message: 'Phone is required' }, { status: 400 })

  const customer = await prisma.customer.findUnique({
    where: { shopId_phone: { shopId: user.shopId, phone } },
  })

  let hasRecentJob = false
  if (customer) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const recentJob = await prisma.serviceJob.findFirst({
      where: { customerId: customer.id, createdAt: { gte: thirtyDaysAgo } },
      select: { id: true },
    })
    hasRecentJob = !!recentJob
  }

  return NextResponse.json({ customer, hasRecentJob })
}

// POST /api/v1/customers — create a new customer
export async function POST(req: NextRequest) {
  const user = getAuthFromRequest(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const name = body.name?.trim()
  const phone = body.phone?.trim()

  if (!name || !phone) {
    return NextResponse.json({ message: 'Name and phone are required' }, { status: 400 })
  }

  try {
    const customer = await prisma.customer.create({
      data: { shopId: user.shopId, name, phone },
    })
    return NextResponse.json({ customer }, { status: 201 })
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2002') {
      return NextResponse.json(
        { message: 'A customer with this phone number already exists' },
        { status: 409 },
      )
    }
    console.error('Create customer error:', err)
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 })
  }
}
