import { notFound, redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, ShoppingBag, Printer } from 'lucide-react'

export const metadata = { title: 'Sale Detail — Rishika Computers' }

const statusColors: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  DRAFT: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-600',
}

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user || user.role !== 'OWNER') redirect('/login')

  const { id } = await params
  const sale = await prisma.sale.findFirst({
    where: { id, shopId: user.shopId },
    include: { customer: true, items: { include: { product: { include: { category: true } } } } },
  })
  if (!sale) notFound()

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/owner/sales" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5">
        <ArrowLeft className="w-4 h-4" /> Back to Sales
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ShoppingBag className="w-6 h-6" /> {sale.saleNumber}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(sale.soldAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            {sale.customer && <> · {sale.customer.name} ({sale.customer.phone})</>}
            {!sale.customer && <> · Walk-in customer</>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[sale.status]}`}>{sale.status}</span>
          <Link href={`/owner/sales/${sale.id}/receipt`}
            className="flex items-center gap-1 text-sm text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50">
            <Printer className="w-4 h-4" /> Receipt
          </Link>
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden mb-5">
        <div className="px-4 py-3 border-b bg-gray-50 font-medium text-sm">Items Sold</div>
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50/50">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Product</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">Qty</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">Price</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sale.items.map(item => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <div className="font-medium">{item.product.name}</div>
                  {item.product.category && <div className="text-xs text-gray-400">{item.product.category.name}</div>}
                </td>
                <td className="px-4 py-3 text-right">{item.quantity}</td>
                <td className="px-4 py-3 text-right">₹{Number(item.priceAtTime).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-right font-medium">₹{(item.quantity * Number(item.priceAtTime)).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t">
            <tr>
              <td colSpan={3} className="px-4 py-2 text-right text-gray-500 text-xs">Subtotal</td>
              <td className="px-4 py-2 text-right">₹{Number(sale.subtotal).toLocaleString('en-IN')}</td>
            </tr>
            {Number(sale.discount) > 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-2 text-right text-gray-500 text-xs">Discount</td>
                <td className="px-4 py-2 text-right text-green-600">−₹{Number(sale.discount).toLocaleString('en-IN')}</td>
              </tr>
            )}
            <tr className="bg-gray-50 font-bold">
              <td colSpan={3} className="px-4 py-3 text-right">Total</td>
              <td className="px-4 py-3 text-right text-blue-700 text-base">₹{Number(sale.total).toLocaleString('en-IN')}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex gap-4 text-sm text-gray-600 bg-gray-50 border rounded-xl px-4 py-3">
        <span><span className="font-medium">Payment:</span> {sale.paymentMode}</span>
        {sale.notes && <span><span className="font-medium">Notes:</span> {sale.notes}</span>}
      </div>
    </div>
  )
}
