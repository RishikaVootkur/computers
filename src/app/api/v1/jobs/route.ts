import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/v1/jobs — list jobs for this shop
export async function GET(req: NextRequest) {
  const user = getAuthFromRequest(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const status = req.nextUrl.searchParams.get('status')
  const date = req.nextUrl.searchParams.get('date')
  const customerId = req.nextUrl.searchParams.get('customerId')

  const where: Record<string, unknown> = { shopId: user.shopId }

  if (status) where.status = status
  if (customerId) where.customerId = customerId

  if (date === 'today') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    where.createdAt = { gte: today, lt: tomorrow }
  }

  const jobs = await prisma.serviceJob.findMany({
    where,
    include: {
      customer: { select: { name: true, phone: true } },
      assignee: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return NextResponse.json({ jobs })
}

// POST /api/v1/jobs — create a new service job
export async function POST(req: NextRequest) {
  const user = getAuthFromRequest(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { customerId, deviceType, problemNotes, estimatedAmount, remarks, assignedTo } = body

  if (!customerId || !deviceType) {
    return NextResponse.json(
      { message: 'Customer and device type are required' },
      { status: 400 },
    )
  }

  try {
    // Generate job number: count jobs in this shop + 1, formatted as RC-0001
    const count = await prisma.serviceJob.count({ where: { shopId: user.shopId } })
    const jobNumber = `RC-${String(count + 1).padStart(4, '0')}`

    const job = await prisma.serviceJob.create({
      data: {
        shopId: user.shopId,
        customerId,
        assignedTo: assignedTo || null,
        jobNumber,
        deviceType,
        problemNotes: problemNotes?.trim() || null,
        estimatedAmount: estimatedAmount ? parseFloat(estimatedAmount) : null,
        remarks: remarks?.trim() || null,
        status: 'RECEIVED',
      },
      include: {
        customer: { select: { name: true, phone: true } },
        assignee: { select: { name: true } },
      },
    })

    // Build initial log note
    const assigneeName = job.assignee?.name
    const logNote = assigneeName ? `Job created — assigned to ${assigneeName}` : 'Job created'

    // Create the initial status log entry — if assigned, credit the assignee
    await prisma.jobStatusLog.create({
      data: {
        jobId: job.id,
        changedBy: assignedTo || user.userId,
        oldStatus: 'RECEIVED',
        newStatus: 'RECEIVED',
        notes: logNote,
      },
    })

    return NextResponse.json({ job }, { status: 201 })
  } catch (err) {
    console.error('Create job error:', err)
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 })
  }
}
