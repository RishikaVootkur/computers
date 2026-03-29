import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user || user.role !== 'OWNER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  const supplier = await prisma.supplier.findFirst({ where: { id, shopId: user.shopId } })
  if (!supplier) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.supplier.update({ where: { id }, data: body })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user || user.role !== 'OWNER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const supplier = await prisma.supplier.findFirst({ where: { id, shopId: user.shopId } })
  if (!supplier) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.supplier.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
