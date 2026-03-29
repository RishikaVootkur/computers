import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import SalesSubNav from '@/components/SalesSubNav'
import { Plus } from 'lucide-react'

export const metadata = { title: 'Purchases — Rishika Computers' }

export default async function PurchasesPage() {
  const user = await getAuthUser()
  if (!user || user.role !== 'OWNER') redirect('/login')

  const purchases = await prisma.purchase.findMany({
    where: { shopId: user.shopId },
    include: { supplier: true, items: { include: { product: true } } },
    orderBy: { purchasedAt: 'desc' },
  })

  const statusColors: Record<string, string> = {
    RECEIVED: 'bg-green-100 text-green-700',
    PARTIAL: 'bg-amber-100 text-amber-700',
    CANCELLED: 'bg-red-100 text-red-700',
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <SalesSubNav />
      <main className="px-4 sm:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">{purchases.length} purchase orders</p>
          <Link href="/owner/purchases/new" className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> New Purchase
          </Link>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                {['PO Number', 'Supplier', 'Date', 'Items', 'Total', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {purchases.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">No purchase orders yet</td></tr>
              )}
              {purchases.map(po => (
                <tr key={po.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5 font-mono font-semibold text-primary">{po.purchaseNumber}</td>
                  <td className="px-5 py-3.5">{po.supplier?.name ?? '—'}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {new Date(po.purchasedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{po.items.length} item{po.items.length !== 1 ? 's' : ''}</td>
                  <td className="px-5 py-3.5 font-medium">₹{Number(po.totalAmount).toLocaleString('en-IN')}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[po.status]}`}>
                      {po.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <Link href={`/owner/purchases/${po.id}`} className="text-primary hover:underline text-xs font-medium">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
