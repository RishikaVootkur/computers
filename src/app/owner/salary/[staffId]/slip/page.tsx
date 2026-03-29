import { notFound, redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import PrintButton from './PrintButton'

export const metadata = { title: 'Salary Slip — Rishika Computers' }

const styles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #111; background: #f5f5f5; }
  .page { max-width: 600px; margin: 32px auto; background: #fff; padding: 40px; border: 1px solid #ddd; border-radius: 8px; }
  .header { text-align: center; margin-bottom: 24px; }
  .shop-name { font-size: 18px; font-weight: bold; color: #1d4ed8; }
  .slip-title { font-size: 14px; font-weight: bold; margin-top: 6px; text-transform: uppercase; letter-spacing: .1em; color: #555; }
  .divider { border: none; border-top: 1px solid #e5e7eb; margin: 16px 0; }
  .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
  .row .label { color: #555; }
  .row.bold { font-weight: bold; font-size: 14px; }
  .section-title { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: .05em; color: #888; margin: 16px 0 8px; }
  .footer { margin-top: 40px; text-align: center; color: #888; font-size: 11px; }
  .print-hide {}
  @media print {
    body { background: #fff; }
    .page { margin: 0; border: none; border-radius: 0; }
    .print-hide { display: none !important; }
  }
`

export default async function SalarySlipPage({
  params,
  searchParams,
}: {
  params: Promise<{ staffId: string }>
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const user = await getAuthUser()
  if (!user || user.role !== 'OWNER') redirect('/login')

  const { staffId } = await params
  const { month: mParam, year: yParam } = await searchParams

  const now = new Date()
  const month = mParam ? parseInt(mParam) : now.getMonth() + 1
  const year = yParam ? parseInt(yParam) : now.getFullYear()

  const staffMember = await prisma.staff.findFirst({
    where: { id: staffId, shopId: user.shopId },
    include: { user: { select: { name: true, phone: true, email: true } } },
  })
  if (!staffMember) notFound()

  const salaryRecord = await prisma.salaryRecord.findUnique({
    where: { staffId_month_year: { staffId, month, year } },
    include: { payments: { orderBy: { paidOn: 'asc' } } },
  })

  const shop = await prisma.shop.findUnique({ where: { id: user.shopId } })

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  const totalPaid = salaryRecord ? Number(salaryRecord.totalPaid) : 0
  const totalEarned = salaryRecord ? Number(salaryRecord.totalEarned) : Number(staffMember.monthlySalary)
  const balance = totalEarned - totalPaid

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="page">
        <div className="header">
          <div className="shop-name">{shop?.name ?? 'Rishika Computers'}</div>
          {shop?.address && <div style={{ color: '#555', fontSize: 12, marginTop: 2 }}>{shop.address}</div>}
          <div className="slip-title">Salary Slip</div>
          <div style={{ color: '#555', fontSize: 12, marginTop: 4 }}>{monthLabel}</div>
        </div>

        <hr className="divider" />

        <div className="section-title">Employee Details</div>
        <div className="row"><span className="label">Name</span><span style={{ fontWeight: 600 }}>{staffMember.user.name}</span></div>
        {staffMember.user.phone && <div className="row"><span className="label">Phone</span><span>{staffMember.user.phone}</span></div>}
        <div className="row"><span className="label">Joined</span><span>{new Date(staffMember.joinedOn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>

        <hr className="divider" />

        <div className="section-title">Earnings</div>
        <div className="row"><span className="label">Monthly Salary</span><span>₹{Number(staffMember.monthlySalary).toLocaleString('en-IN')}</span></div>
        {salaryRecord && (
          <>
            <div className="row"><span className="label">Days Present</span><span>{Number(salaryRecord.daysPresent)}</span></div>
            <div className="row"><span className="label">Per Day Rate</span><span>₹{Number(salaryRecord.perDayRate).toLocaleString('en-IN')}</span></div>
            <div className="row bold"><span>Total Earned</span><span>₹{totalEarned.toLocaleString('en-IN')}</span></div>
          </>
        )}

        {salaryRecord?.payments && salaryRecord.payments.length > 0 && (
          <>
            <hr className="divider" />
            <div className="section-title">Payments</div>
            {salaryRecord.payments.map((p, i) => (
              <div key={p.id} className="row">
                <span className="label">
                  {p.notes ?? `Payment ${i + 1}`} —{' '}
                  {new Date(p.paidOn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  {' '}({p.paymentMode})
                </span>
                <span>₹{Number(p.amount).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </>
        )}

        <hr className="divider" />
        <div className="row"><span className="label">Total Paid</span><span>₹{totalPaid.toLocaleString('en-IN')}</span></div>
        <div className={`row bold`}>
          <span>{balance >= 0 ? 'Balance Due' : 'Advance'}</span>
          <span style={{ color: balance > 0 ? '#dc2626' : '#16a34a' }}>
            ₹{Math.abs(balance).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="footer">
          This is a computer generated salary slip. — {shop?.name ?? 'Rishika Computers'}
        </div>

        <PrintButton />
      </div>
    </>
  )
}
