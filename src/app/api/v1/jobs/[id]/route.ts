import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/v1/jobs/[id] — get full job details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = getAuthFromRequest(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const job = await prisma.serviceJob.findFirst({
    where: { id, shopId: user.shopId },
    include: {
      customer: true,
      assignee: { select: { name: true } },
      statusLogs: {
        include: { user: { select: { name: true } } },
        orderBy: { changedAt: 'asc' },
      },
    },
  })

  if (!job) {
    return NextResponse.json({ message: 'Job not found' }, { status: 404 })
  }

  return NextResponse.json({ job })
}

// PATCH /api/v1/jobs/[id] — edit job fields + assign to staff
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = getAuthFromRequest(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const job = await prisma.serviceJob.findFirst({ where: { id, shopId: user.shopId } })
  if (!job) return NextResponse.json({ message: 'Job not found' }, { status: 404 })

  const data: Record<string, unknown> = {}
  if (body.deviceType !== undefined) data.deviceType = body.deviceType
  if (body.problemNotes !== undefined) data.problemNotes = body.problemNotes?.trim() || null
  if (body.internalNotes !== undefined) data.internalNotes = body.internalNotes?.trim() || null
  if (body.estimatedAmount !== undefined) data.estimatedAmount = body.estimatedAmount ? parseFloat(body.estimatedAmount) : null
  if (body.remarks !== undefined) data.remarks = body.remarks?.trim() || null
  if (body.isUrgent !== undefined) data.isUrgent = Boolean(body.isUrgent)
  if (body.warrantyUntil !== undefined) data.warrantyUntil = body.warrantyUntil ? new Date(body.warrantyUntil) : null

  const assigneeChanged = body.assignedTo !== undefined && body.assignedTo !== job.assignedTo
  if (body.assignedTo !== undefined) data.assignedTo = body.assignedTo || null

  const updated = await prisma.serviceJob.update({ where: { id }, data })

  // Log assignment change in the status history
  if (assigneeChanged) {
    let assigneeNote = 'Unassigned'
    let loggedBy = user.userId
    if (body.assignedTo) {
      const assignee = await prisma.user.findUnique({ where: { id: body.assignedTo }, select: { name: true } })
      if (assignee) {
        assigneeNote = `Assigned to ${assignee.name}`
        loggedBy = body.assignedTo  // credit the assignee in the timeline
      }
    }
    await prisma.jobStatusLog.create({
      data: {
        jobId: id,
        changedBy: loggedBy,
        oldStatus: job.status,
        newStatus: job.status,
        notes: assigneeNote,
      },
    })
  }

  return NextResponse.json({ job: updated })
}
