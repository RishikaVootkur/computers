import { notFound, redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import PrintButton from './PrintButton'

export const metadata = { title: 'Receipt — Rishika Computers' }

const receiptStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Courier+Prime&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', Courier, monospace; font-size: 13px; color: #000; background: #f5f5f5; }
  .receipt-wrap { max-width: 380px; margin: 40px auto; background: #fff; padding: 24px; border: 1px solid #ddd; border-radius: 8px; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .divider { border-top: 1px dashed #000; margin: 10px 0; }
  .row { display: flex; justify-content: space-between; margin: 4px 0; }
  .label { color: #555; }
  .big { font-size: 20px; font-weight: bold; }
  .print-hide { }
  @media print {
    body { background: #fff; }
    .receipt-wrap { margin: 0; border: none; border-radius: 0; padding: 16px; }
    .print-hide { display: none !important; }
  }
`

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const { id } = await params

  const job = await prisma.serviceJob.findFirst({
    where: { id, shopId: user.shopId },
    include: { customer: true },
  })
  if (!job) notFound()

  const shop = await prisma.shop.findUnique({ where: { id: user.shopId } })

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: receiptStyles }} />

      <div className="receipt-wrap">
        <div className="center">
          <div className="bold" style={{ fontSize: 15 }}>{shop?.name ?? 'Rishika Computers'}</div>
          {shop?.address && <div className="label">{shop.address}</div>}
          {shop?.phone && <div className="label">{shop.phone}</div>}
        </div>

        <div className="divider" />

        <div className="center">
          <div className="big">{job.jobNumber}</div>
          <div className="label" style={{ marginTop: 2 }}>
            {new Date(job.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            {' '}
            {new Date(job.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <div className="divider" />

        <div className="row"><span className="label">Customer</span><span className="bold">{job.customer.name}</span></div>
        <div className="row"><span className="label">Phone</span><span>{job.customer.phone}</span></div>
        <div className="row">
          <span className="label">Device</span>
          <span className="bold" style={{ textTransform: 'capitalize' }}>{job.deviceType.replace(/_/g, ' ').toLowerCase()}</span>
        </div>

        {job.problemNotes && (
          <>
            <div className="divider" />
            <div className="label" style={{ marginBottom: 4 }}>Problem reported:</div>
            <div>{job.problemNotes}</div>
          </>
        )}

        <div className="divider" />

        {job.estimatedAmount && (
          <div className="row"><span className="label">Estimated</span><span className="bold">₹{Number(job.estimatedAmount)}</span></div>
        )}
        {job.finalAmount && (
          <div className="row"><span className="label">Final Amount</span><span className="bold">₹{Number(job.finalAmount)}</span></div>
        )}
        <div className="row"><span className="label">Status</span><span className="bold">{job.status.replace(/_/g, ' ')}</span></div>

        <div className="divider" />
        <div className="center label" style={{ fontSize: 11 }}>Please show this slip when collecting your device.</div>
        <div className="center label" style={{ fontSize: 11, marginTop: 4 }}>Track your repair at our shop.</div>

        <PrintButton />
      </div>
    </>
  )
}
