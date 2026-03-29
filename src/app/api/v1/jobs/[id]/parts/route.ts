import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = getAuthFromRequest(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const parts = await prisma.jobPart.findMany({
    where: { jobId: id },
    include: { item: true },
    orderBy: { addedAt: 'asc' },
  })
  return NextResponse.json({ parts })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = getAuthFromRequest(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { inventoryItemId, quantity } = body

  if (!inventoryItemId || !quantity) {
    return NextResponse.json({ message: 'inventoryItemId and quantity are required' }, { status: 400 })
  }

  const qty = parseInt(quantity)
  const item = await prisma.inventoryItem.findUnique({ where: { id: inventoryItemId } })
  if (!item) return NextResponse.json({ message: 'Item not found' }, { status: 404 })
  if (item.stock < qty) return NextResponse.json({ message: `Only ${item.stock} in stock` }, { status: 400 })

  const [part] = await prisma.$transaction([
    prisma.jobPart.create({
      data: {
        jobId: id,
        inventoryItemId,
        quantity: qty,
        costAtTime: item.costPrice ?? 0,
      },
      include: { item: true },
    }),
    prisma.inventoryItem.update({
      where: { id: inventoryItemId },
      data: { stock: { decrement: qty } },
    }),
  ])

  return NextResponse.json({ part }, { status: 201 })
}
