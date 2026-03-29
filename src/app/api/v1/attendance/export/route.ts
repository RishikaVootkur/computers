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

  const daysInMonth = new Date(year, month, 0).getDate()
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)

  const staff = await prisma.staff.findMany({
    where: { shopId: user.shopId },
    include: { user: { select: { name: true } } },
    orderBy: { joinedOn: 'asc' },
  })

  const attendance = await prisma.attendance.findMany({
    where: {
      staffId: { in: staff.map((s) => s.id) },
      date: { gte: startDate, lte: endDate },
    },
  })

  const rows = staff.map((s) => {
    const row: Record<string, string | number> = { 'Staff Name': s.user.name }
    let present = 0
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const rec = attendance.find((a) => a.staffId === s.id && a.date.toISOString().startsWith(dateStr))
      const label = rec?.status === 'PRESENT' ? 'P' : rec?.status === 'HALF_DAY' ? '½' : rec?.status === 'ABSENT' ? 'A' : ''
      row[String(d)] = label
      if (rec?.status === 'PRESENT') present += 1
      if (rec?.status === 'HALF_DAY') present += 0.5
    }
    row['Days Present'] = present
    row['Salary (₹)'] = Math.round(present * (Number(s.monthlySalary) / 26))
    return row
  })

  const monthName = new Date(year, month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [{ wch: 20 }, ...Array(daysInMonth).fill({ wch: 4 }), { wch: 14 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, ws, monthName)

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="attendance-${year}-${month}.xlsx"`,
    },
  })
}
