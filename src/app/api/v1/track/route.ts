import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/v1/track?phone=XXXXXXXXXX — public customer tracking endpoint
export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get('phone')
  if (!phone) {
    return NextResponse.json({ message: 'Phone is required' }, { status: 400 })
  }

  // Find any customer with this phone number
  const customer = await prisma.customer.findFirst({
    where: { phone },
  })

  if (!customer) {
    return NextResponse.json({ jobs: [] })
  }

  const jobs = await prisma.serviceJob.findMany({
    where: { customerId: customer.id },
    select: {
      jobNumber: true,
      deviceType: true,
      status: true,
      createdAt: true,
      estimatedAmount: true,
      problemNotes: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ jobs })
}
