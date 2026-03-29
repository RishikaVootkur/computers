import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/v1/jobs/[id]/status — update job status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = getAuthFromRequest(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { status, notes, finalAmount } = body

  if (!status) {
    return NextResponse.json({ message: 'Status is required' }, { status: 400 })
  }

  const job = await prisma.serviceJob.findFirst({
    where: { id, shopId: user.shopId },
  })

  if (!job) {
    return NextResponse.json({ message: 'Job not found' }, { status: 404 })
  }

  const updateData: Record<string, unknown> = { status }

  if (status === 'COMPLETED' || status === 'DELIVERED') {
    updateData.completedAt = new Date()
  }

  if (finalAmount !== undefined && finalAmount !== '') {
    updateData.finalAmount = parseFloat(finalAmount)
  }

  const [updatedJob] = await prisma.$transaction([
    prisma.serviceJob.update({ where: { id }, data: updateData }),
    prisma.jobStatusLog.create({
      data: {
        jobId: id,
        changedBy: job.assignedTo ?? user.userId,
        oldStatus: job.status,
        newStatus: status,
        notes: notes?.trim() || null,
      },
    }),
  ])

  return NextResponse.json({ job: updatedJob })
}
