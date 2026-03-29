import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user || user.role !== 'OWNER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const sale = await prisma.sale.findFirst({
    where: { id, shopId: user.shopId },
    include: { customer: true, items: { include: { product: { include: { category: true } } } } },
  })
  if (!sale) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(sale)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user || user.role !== 'OWNER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const sale = await prisma.sale.findFirst({ where: { id, shopId: user.shopId } })
  if (!sale) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { status } = await req.json()
  const updated = await prisma.sale.update({
    where: { id },
    data: { status },
    include: { customer: true, items: { include: { product: true } } },
  })
  return NextResponse.json(updated)
}
