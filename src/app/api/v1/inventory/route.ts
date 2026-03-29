import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const user = getAuthFromRequest(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const items = await prisma.inventoryItem.findMany({
    where: { shopId: user.shopId },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  const user = getAuthFromRequest(req)
  if (!user || user.role !== 'OWNER') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, description, stock, minStock, costPrice } = body

  if (!name) return NextResponse.json({ message: 'Name is required' }, { status: 400 })

  const item = await prisma.inventoryItem.create({
    data: {
      shopId: user.shopId,
      name: name.trim(),
      description: description?.trim() || null,
      stock: parseInt(stock) || 0,
      minStock: parseInt(minStock) || 1,
      costPrice: costPrice ? parseFloat(costPrice) : null,
    },
  })
  return NextResponse.json({ item }, { status: 201 })
}
