import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user || user.role !== 'OWNER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const product = await prisma.product.findFirst({ where: { id, shopId: user.shopId } })
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const updated = await prisma.product.update({
    where: { id },
    data: body,
    include: { category: true, supplier: true },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user || user.role !== 'OWNER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const product = await prisma.product.findFirst({ where: { id, shopId: user.shopId } })
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Soft delete
  await prisma.product.update({ where: { id }, data: { isActive: false } })
  return NextResponse.json({ ok: true })
}
