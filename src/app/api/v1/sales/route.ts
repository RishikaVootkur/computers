import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user || user.role !== 'OWNER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') ?? '50')

  const sales = await prisma.sale.findMany({
    where: { shopId: user.shopId },
    include: { customer: true, items: { include: { product: true } } },
    orderBy: { soldAt: 'desc' },
    take: limit,
  })
  return NextResponse.json(sales)
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user || user.role !== 'OWNER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { customerId, items, discount, tax, paymentMode, notes } = await req.json()
  // items: [{ productId, quantity, priceAtTime }]
  if (!items || items.length === 0) return NextResponse.json({ error: 'Items required' }, { status: 400 })

  // Validate stock
  for (const item of items) {
    const product = await prisma.product.findFirst({ where: { id: item.productId, shopId: user.shopId } })
    if (!product) return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 })
    if (product.stock < item.quantity) {
      return NextResponse.json({ error: `Insufficient stock for ${product.name}. Available: ${product.stock}` }, { status: 400 })
    }
  }

  // Generate sale number
  const count = await prisma.sale.count({ where: { shopId: user.shopId } })
  const saleNumber = `SALE-${String(count + 1).padStart(4, '0')}`

  const subtotal = items.reduce((s: number, i: { quantity: number; priceAtTime: number }) => s + i.quantity * i.priceAtTime, 0)
  const disc = Number(discount ?? 0)
  const taxAmt = Number(tax ?? 0)
  const total = subtotal - disc + taxAmt

  const sale = await prisma.$transaction(async (tx) => {
    const s = await tx.sale.create({
      data: {
        shopId: user.shopId,
        customerId: customerId || null,
        saleNumber,
        subtotal,
        discount: disc,
        tax: taxAmt,
        total,
        paymentMode: paymentMode ?? 'CASH',
        notes,
        items: {
          create: items.map((item: { productId: string; quantity: number; priceAtTime: number }) => ({
            productId: item.productId,
            quantity: item.quantity,
            priceAtTime: item.priceAtTime,
          })),
        },
      },
      include: { customer: true, items: { include: { product: true } } },
    })

    // Decrement stock
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      })
    }

    return s
  })

  return NextResponse.json(sale, { status: 201 })
}
