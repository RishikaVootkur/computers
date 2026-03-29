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
  const { status } = await req.json()

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return NextResponse.json({ message: 'Invalid status' }, { status: 400 })
  }

  const request = await prisma.leaveRequest.update({ where: { id }, data: { status } })
  return NextResponse.json({ request })
}
