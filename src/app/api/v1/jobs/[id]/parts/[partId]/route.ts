import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; partId: string }> },
) {
  const user = getAuthFromRequest(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { partId } = await params
  const part = await prisma.jobPart.findUnique({ where: { id: partId } })
  if (!part) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  await prisma.$transaction([
    prisma.jobPart.delete({ where: { id: partId } }),
    prisma.inventoryItem.update({
      where: { id: part.inventoryItemId },
      data: { stock: { increment: part.quantity } },
    }),
  ])

  return NextResponse.json({ ok: true })
}
