import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user || user.role !== 'OWNER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const purchase = await prisma.purchase.findFirst({
    where: { id, shopId: user.shopId },
    include: { supplier: true, items: { include: { product: { include: { category: true } } } } },
  })
  if (!purchase) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(purchase)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user || user.role !== 'OWNER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const purchase = await prisma.purchase.findFirst({ where: { id, shopId: user.shopId } })
  if (!purchase) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { status, notes } = await req.json()
  const updated = await prisma.purchase.update({
    where: { id },
    data: { ...(status ? { status } : {}), ...(notes !== undefined ? { notes } : {}) },
    include: { supplier: true, items: { include: { product: true } } },
  })
  return NextResponse.json(updated)
}
