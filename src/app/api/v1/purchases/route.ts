import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const user = await getAuthUser()
  if (!user || user.role !== 'OWNER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const purchases = await prisma.purchase.findMany({
    where: { shopId: user.shopId },
    include: { supplier: true, items: { include: { product: true } } },
    orderBy: { purchasedAt: 'desc' },
  })
  return NextResponse.json(purchases)
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user || user.role !== 'OWNER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { supplierId, items, notes, purchasedAt } = await req.json()
  // items: [{ productId, quantity, costAtTime }]
  if (!items || items.length === 0) return NextResponse.json({ error: 'Items required' }, { status: 400 })

  // Generate purchase number
  const count = await prisma.purchase.count({ where: { shopId: user.shopId } })
  const purchaseNumber = `PO-${String(count + 1).padStart(4, '0')}`

  const totalAmount = items.reduce((s: number, i: { quantity: number; costAtTime: number }) => s + i.quantity * i.costAtTime, 0)

  const purchase = await prisma.$transaction(async (tx) => {
    const po = await tx.purchase.create({
      data: {
        shopId: user.shopId,
        supplierId: supplierId || null,
        purchaseNumber,
        totalAmount,
        notes,
        purchasedAt: purchasedAt ? new Date(purchasedAt) : new Date(),
        items: {
          create: items.map((item: { productId: string; quantity: number; costAtTime: number }) => ({
            productId: item.productId,
            quantity: item.quantity,
            costAtTime: item.costAtTime,
          })),
        },
      },
      include: { supplier: true, items: { include: { product: true } } },
    })

    // Increment stock
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      })
    }

    return po
  })

  return NextResponse.json(purchase, { status: 201 })
}
