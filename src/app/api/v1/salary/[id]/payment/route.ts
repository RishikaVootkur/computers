import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthFromRequest(req)
  if (!user || user.role !== 'OWNER') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { amount, paymentMode, paidOn, reference, notes } = body

  if (!amount || !paymentMode || !paidOn) {
    return NextResponse.json({ message: 'amount, paymentMode and paidOn are required' }, { status: 400 })
  }

  const salaryRecord = await prisma.salaryRecord.findUnique({
    where: { id },
    include: { staff: { select: { shopId: true } } },
  })

  if (!salaryRecord || salaryRecord.staff.shopId !== user.shopId) {
    return NextResponse.json({ message: 'Salary record not found' }, { status: 404 })
  }

  const payment = await prisma.salaryPayment.create({
    data: {
      salaryRecordId: id,
      amount: parseFloat(amount),
      paymentMode,
      paidOn: new Date(paidOn),
      reference: reference || null,
      notes: notes || null,
    },
  })

  const allPayments = await prisma.salaryPayment.findMany({ where: { salaryRecordId: id } })
  const totalPaid = allPayments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0)
  const totalEarned = parseFloat(salaryRecord.totalEarned.toString())

  let paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' = 'PENDING'
  if (totalPaid >= totalEarned) paymentStatus = 'PAID'
  else if (totalPaid > 0) paymentStatus = 'PARTIAL'

  await prisma.salaryRecord.update({
    where: { id },
    data: { totalPaid, paymentStatus },
  })

  return NextResponse.json({ payment }, { status: 201 })
}
