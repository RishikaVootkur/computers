import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function GET(req: NextRequest) {
  const user = getAuthFromRequest(req)
  if (!user || user.role !== 'OWNER') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const jobs = await prisma.serviceJob.findMany({
    where: { shopId: user.shopId },
    include: { customer: { select: { name: true, phone: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const rows = jobs.map((j) => ({
    'Job #': j.jobNumber,
    'Customer': j.customer.name,
    'Phone': j.customer.phone,
    'Device': j.deviceType.replace(/_/g, ' '),
    'Problem': j.problemNotes ?? '',
    'Status': j.status.replace(/_/g, ' '),
    'Estimated (₹)': j.estimatedAmount ? Number(j.estimatedAmount) : '',
    'Final (₹)': j.finalAmount ? Number(j.finalAmount) : '',
    'Date': new Date(j.createdAt).toLocaleDateString('en-IN'),
    'Remarks': j.remarks ?? '',
  }))

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [10, 20, 14, 14, 30, 18, 14, 14, 14, 25].map((w) => ({ wch: w }))
  XLSX.utils.book_append_sheet(wb, ws, 'Jobs')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="jobs.xlsx"',
    },
  })
}
