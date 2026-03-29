import { notFound, redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import PrintButton from './PrintButton'

export const metadata = { title: 'Sale Receipt — Rishika Computers' }

const styles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #111; background: #f5f5f5; }
  .page { max-width: 400px; margin: 32px auto; background: #fff; padding: 32px; border: 1px solid #ddd; border-radius: 8px; }
  .header { text-align: center; margin-bottom: 20px; }
  .shop-name { font-size: 18px; font-weight: bold; color: #1d4ed8; }
  .receipt-title { font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: .1em; color: #888; margin-top: 4px; }
  .divider { border: none; border-top: 1px solid #e5e7eb; margin: 14px 0; }
  .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
  .row .label { color: #555; }
  .section-title { font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: .05em; color: #aaa; margin: 12px 0 6px; }
  table { width: 100%; border-collapse: collapse; }
  thead th { text-align: left; padding: 6px 0; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: .05em; color: #aaa; border-bottom: 1px solid #e5e7eb; }
  thead th:last-child { text-align: right; }
  tbody td { padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
  tbody td:last-child { text-align: right; }
  .total-row { display: flex; justify-content: space-between; font-size: 13px; margin-top: 4px; }
  .grand-total { font-size: 16px; font-weight: bold; border-top: 2px solid #111; padding-top: 8px; margin-top: 6px; }
  .footer { margin-top: 32px; text-align: center; color: #aaa; font-size: 10px; line-height: 1.6; }
  .print-hide {}
  @media print {
    body { background: #fff; }
    .page { margin: 0; border: none; border-radius: 0; }
    .print-hide { display: none !important; }
  }
`

export default async function SaleReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user || user.role !== 'OWNER') redirect('/login')

  const { id } = await params
  const sale = await prisma.sale.findFirst({
    where: { id, shopId: user.shopId },
    include: { customer: true, items: { include: { product: true } } },
  })
  if (!sale) notFound()

  const shop = await prisma.shop.findUnique({ where: { id: user.shopId } })

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="page">
        <div className="header">
          <div className="shop-name">{shop?.name ?? 'Rishika Computers'}</div>
          {shop?.address && <div style={{ color: '#777', fontSize: 11, marginTop: 2 }}>{shop.address}</div>}
          {shop?.phone && <div style={{ color: '#777', fontSize: 11 }}>{shop.phone}</div>}
          <div className="receipt-title">Sale Receipt</div>
        </div>

        <hr className="divider" />

        <div className="row"><span className="label">Receipt #</span><span style={{ fontWeight: 600 }}>{sale.saleNumber}</span></div>
        <div className="row">
          <span className="label">Date</span>
          <span>{new Date(sale.soldAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        </div>
        <div className="row"><span className="label">Payment</span><span>{sale.paymentMode}</span></div>
        {sale.customer && (
          <div className="row"><span className="label">Customer</span><span>{sale.customer.name}</span></div>
        )}

        <hr className="divider" />

        <div className="section-title">Items</div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style={{ textAlign: 'center' }}>Qty</th>
              <th>Price</th>
              <th>Amt</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map(item => (
              <tr key={item.id}>
                <td>{item.product.name}</td>
                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                <td>₹{Number(item.priceAtTime).toLocaleString('en-IN')}</td>
                <td>₹{(item.quantity * Number(item.priceAtTime)).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr className="divider" />

        <div className="total-row"><span style={{ color: '#555' }}>Subtotal</span><span>₹{Number(sale.subtotal).toLocaleString('en-IN')}</span></div>
        {Number(sale.discount) > 0 && (
          <div className="total-row"><span style={{ color: '#555' }}>Discount</span><span style={{ color: '#16a34a' }}>−₹{Number(sale.discount).toLocaleString('en-IN')}</span></div>
        )}
        <div className="total-row grand-total"><span>Total</span><span>₹{Number(sale.total).toLocaleString('en-IN')}</span></div>

        {sale.notes && (
          <>
            <hr className="divider" />
            <div style={{ fontSize: 12, color: '#555' }}><strong>Note:</strong> {sale.notes}</div>
          </>
        )}

        <div className="footer">
          Thank you for shopping at {shop?.name ?? 'Rishika Computers'}!<br />
          This is a computer generated receipt.
        </div>

        <PrintButton />
      </div>
    </>
  )
}
