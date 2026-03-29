import { notFound, redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, ShoppingCart } from 'lucide-react'

export const metadata = { title: 'Purchase Order — Rishika Computers' }

const statusColors: Record<string, string> = {
  RECEIVED: 'bg-green-100 text-green-700',
  PARTIAL: 'bg-amber-100 text-amber-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

export default async function PurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user || user.role !== 'OWNER') redirect('/login')

  const { id } = await params
  const po = await prisma.purchase.findFirst({
    where: { id, shopId: user.shopId },
    include: { supplier: true, items: { include: { product: { include: { category: true } } } } },
  })
  if (!po) notFound()

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/owner/purchases" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5">
        <ArrowLeft className="w-4 h-4" /> Back to Purchases
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ShoppingCart className="w-6 h-6" /> {po.purchaseNumber}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(po.purchasedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            {po.supplier && <> · {po.supplier.name}</>}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[po.status]}`}>{po.status}</span>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden mb-5">
        <div className="px-4 py-3 border-b bg-gray-50 font-medium text-sm">Items Purchased</div>
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50/50">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Product</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">Qty</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">Unit Cost</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {po.items.map(item => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <div className="font-medium">{item.product.name}</div>
                  {item.product.category && <div className="text-xs text-gray-400">{item.product.category.name}</div>}
                </td>
                <td className="px-4 py-3 text-right">{item.quantity}</td>
                <td className="px-4 py-3 text-right">₹{Number(item.costAtTime).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-right font-medium">₹{(item.quantity * Number(item.costAtTime)).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t bg-gray-50">
            <tr>
              <td colSpan={3} className="px-4 py-3 text-right font-semibold">Total</td>
              <td className="px-4 py-3 text-right font-bold text-blue-700">₹{Number(po.totalAmount).toLocaleString('en-IN')}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {po.notes && (
        <div className="bg-gray-50 border rounded-xl px-4 py-3 text-sm text-gray-600">
          <span className="font-medium">Notes: </span>{po.notes}
        </div>
      )}
    </div>
  )
}
