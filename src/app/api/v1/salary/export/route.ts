import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function GET(req: NextRequest) {
  const user = getAuthFromRequest(req)
  if (!user || user.role !== 'OWNER') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const month = parseInt(searchParams.get('month') ?? '')
  const year = parseInt(searchParams.get('year') ?? '')

  if (!month || !year) {
    return NextResponse.json({ message: 'month and year are required' }, { status: 400 })
  }

  const staff = await prisma.staff.findMany({
    where: { shopId: user.shopId },
    include: { user: { select: { name: true } } },
    orderBy: { joinedOn: 'asc' },
  })

  const salaryRecords = await prisma.salaryRecord.findMany({
    where: { staffId: { in: staff.map((s) => s.id) }, month, year },
    include: { payments: true },
  })

  const rows = staff.map((s) => {
    const rec = salaryRecords.find((r) => r.staffId === s.id)
    const totalPaid = rec ? Number(rec.totalPaid) : 0
    const totalEarned = rec ? Number(rec.totalEarned) : 0
    return {
      'Staff Name': s.user.name,
      'Monthly Salary (₹)': Number(s.monthlySalary),
      'Days Present': rec ? Number(rec.daysPresent) : 0,
      'Rate/Day (₹)': rec ? Math.round(Number(rec.perDayRate)) : Math.round(Number(s.monthlySalary) / 26),
      'Total Earned (₹)': Math.round(totalEarned),
      'Total Paid (₹)': Math.round(totalPaid),
      'Balance (₹)': Math.round(totalEarned - totalPaid),
      'Status': rec?.paymentStatus ?? 'PENDING',
    }
  })

  const monthName = new Date(year, month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [20, 18, 14, 14, 16, 14, 12, 12].map((w) => ({ wch: w }))
  XLSX.utils.book_append_sheet(wb, ws, monthName)

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="salary-${year}-${month}.xlsx"`,
    },
  })
}
