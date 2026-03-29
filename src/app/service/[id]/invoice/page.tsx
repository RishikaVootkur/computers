import { notFound, redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import PrintButton from './PrintButton'

export const metadata = { title: 'Invoice — Rishika Computers' }

const GST_RATE = 0.18

const styles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #111; background: #f5f5f5; }
  .page { max-width: 720px; margin: 32px auto; background: #fff; padding: 48px; border: 1px solid #ddd; border-radius: 8px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
  .shop-name { font-size: 20px; font-weight: bold; color: #1d4ed8; }
  .invoice-title { font-size: 24px; font-weight: bold; color: #111; text-align: right; }
  .invoice-meta { text-align: right; color: #555; font-size: 12px; margin-top: 4px; }
  .divider { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
  .section { margin-bottom: 20px; }
  .section-title { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: .05em; color: #888; margin-bottom: 8px; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .label { color: #555; font-size: 12px; }
  .value { font-weight: 600; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; }
  thead th { text-align: left; padding: 8px 10px; background: #f9fafb; border-bottom: 2px solid #e5e7eb; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: .05em; color: #888; }
  tbody td { padding: 10px 10px; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
  .text-right { text-align: right; }
  .totals { margin-top: 16px; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
  .total-row { display: flex; gap: 48px; font-size: 13px; }
  .total-row.grand { font-size: 16px; font-weight: bold; border-top: 2px solid #111; padding-top: 8px; margin-top: 4px; }
  .footer { margin-top: 48px; text-align: center; color: #888; font-size: 11px; }
  .status-badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; background: #dcfce7; color: #166534; }
  .print-hide {}
  @media print {
    body { background: #fff; }
    .page { margin: 0; border: none; border-radius: 0; box-shadow: none; }
    .print-hide { display: none !important; }
  }
`

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const { id } = await params
  const job = await prisma.serviceJob.findFirst({
    where: { id, shopId: user.shopId },
    include: {
      customer: true,
      parts: { include: { item: true } },
    },
  })
  if (!job) notFound()

  const shop = await prisma.shop.findUnique({ where: { id: user.shopId } })

  const partsTotal = job.parts.reduce((sum, p) => sum + Number(p.costAtTime) * p.quantity, 0)
  const serviceCharge = Math.max(0, Number(job.finalAmount ?? job.estimatedAmount ?? 0) - partsTotal)
  const subtotal = partsTotal + serviceCharge
  const gst = subtotal * GST_RATE
  const grandTotal = subtotal + gst

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="page">
        <div className="header">
          <div>
            <div className="shop-name">{shop?.name ?? 'Rishika Computers'}</div>
            {shop?.address && <div className="label" style={{ marginTop: 4 }}>{shop.address}</div>}
            {shop?.phone && <div className="label">{shop.phone}</div>}
          </div>
          <div>
            <div className="invoice-title">INVOICE</div>
            <div className="invoice-meta">#{job.jobNumber}</div>
            <div className="invoice-meta">
              {new Date(job.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
            <div style={{ marginTop: 8 }}>
              <span className="status-badge">{job.status.replace(/_/g, ' ')}</span>
            </div>
          </div>
        </div>

        <hr className="divider" />

        <div className="two-col section">
          <div>
            <div className="section-title">Bill To</div>
            <div className="value">{job.customer.name}</div>
            <div className="label">{job.customer.phone}</div>
            {job.customer.email && <div className="label">{job.customer.email}</div>}
          </div>
          <div>
            <div className="section-title">Device</div>
            <div className="value" style={{ textTransform: 'capitalize' }}>{job.deviceType.replace(/_/g, ' ').toLowerCase()}</div>
            {job.problemNotes && <div className="label" style={{ marginTop: 4 }}>{job.problemNotes}</div>}
          </div>
        </div>

        <hr className="divider" />

        <div className="section">
          <div className="section-title">Services & Parts</div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Unit Price</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {job.parts.map((p) => (
                <tr key={p.id}>
                  <td>{p.item.name}</td>
                  <td className="text-right">{p.quantity}</td>
                  <td className="text-right">₹{Number(p.costAtTime).toFixed(2)}</td>
                  <td className="text-right">₹{(Number(p.costAtTime) * p.quantity).toFixed(2)}</td>
                </tr>
              ))}
              {serviceCharge > 0 && (
                <tr>
                  <td>Service Charge</td>
                  <td className="text-right">1</td>
                  <td className="text-right">₹{serviceCharge.toFixed(2)}</td>
                  <td className="text-right">₹{serviceCharge.toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="totals">
          <div className="total-row"><span className="label">Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
          <div className="total-row"><span className="label">GST (18%)</span><span>₹{gst.toFixed(2)}</span></div>
          <div className="total-row grand"><span>Total</span><span>₹{grandTotal.toFixed(2)}</span></div>
        </div>

        {job.remarks && (
          <>
            <hr className="divider" />
            <div className="section">
              <div className="section-title">Notes</div>
              <div className="label">{job.remarks}</div>
            </div>
          </>
        )}

        <div className="footer">
          Thank you for choosing {shop?.name ?? 'Rishika Computers'}. Please retain this invoice for warranty claims.
        </div>

        <PrintButton />
      </div>
    </>
  )
}
