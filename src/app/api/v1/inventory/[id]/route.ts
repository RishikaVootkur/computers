import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = getAuthFromRequest(req)
  if (!user || user.role !== 'OWNER') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = body.name.trim()
  if (body.description !== undefined) data.description = body.description?.trim() || null
  if (body.stock !== undefined) data.stock = parseInt(body.stock)
  if (body.minStock !== undefined) data.minStock = parseInt(body.minStock)
  if (body.costPrice !== undefined) data.costPrice = body.costPrice ? parseFloat(body.costPrice) : null

  const item = await prisma.inventoryItem.update({ where: { id }, data })
  return NextResponse.json({ item })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = getAuthFromRequest(req)
  if (!user || user.role !== 'OWNER') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.inventoryItem.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
