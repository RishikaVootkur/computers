import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const suppliers = await prisma.supplier.findMany({
    where: { shopId: user.shopId },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(suppliers)
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user || user.role !== 'OWNER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, phone, email, address, gstin } = await req.json()
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const supplier = await prisma.supplier.create({
    data: { shopId: user.shopId, name, phone, email, address, gstin },
  })
  return NextResponse.json(supplier, { status: 201 })
}
