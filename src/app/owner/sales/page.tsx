import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import SalesSubNav from '@/components/SalesSubNav'
import { Plus, TrendingUp, Receipt } from 'lucide-react'

export const metadata = { title: 'Sales — Rishika Computers' }

export default async function SalesPage() {
  const user = await getAuthUser()
  if (!user || user.role !== 'OWNER') redirect('/login')

  const sales = await prisma.sale.findMany({
    where: { shopId: user.shopId },
    include: { customer: true, items: { include: { product: true } } },
    orderBy: { soldAt: 'desc' },
    take: 50,
  })

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todaySales = sales.filter(s => new Date(s.soldAt) >= todayStart && s.status !== 'CANCELLED')
  const todayRevenue = todaySales.reduce((sum, s) => sum + Number(s.total), 0)
  const completedSales = sales.filter(s => s.status !== 'CANCELLED')
  const totalRevenue = completedSales.reduce((sum, s) => sum + Number(s.total), 0)
  const avgSale = completedSales.length > 0 ? Math.round(totalRevenue / completedSales.length) : 0

  const statusColors: Record<string, string> = {
    COMPLETED: 'bg-green-100 text-green-700',
    DRAFT: 'bg-gray-100 text-gray-600',
    CANCELLED: 'bg-red-100 text-red-600',
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <SalesSubNav />
      <main className="px-4 sm:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">{sales.length} sales recorded</p>
          <Link href="/owner/sales/new" className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> New Sale
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><TrendingUp className="w-4 h-4" /> Today&apos;s Revenue</div>
            <div className="text-2xl font-bold text-green-600">₹{todayRevenue.toLocaleString('en-IN')}</div>
            <div className="text-xs text-muted-foreground mt-1">{todaySales.length} sale{todaySales.length !== 1 ? 's' : ''} today</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Receipt className="w-4 h-4" /> Total Revenue</div>
            <div className="text-2xl font-bold text-primary">₹{totalRevenue.toLocaleString('en-IN')}</div>
            <div className="text-xs text-muted-foreground mt-1">All time</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><TrendingUp className="w-4 h-4" /> Avg Sale</div>
            <div className="text-2xl font-bold">₹{avgSale.toLocaleString('en-IN')}</div>
            <div className="text-xs text-muted-foreground mt-1">Per transaction</div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                {['Sale #', 'Customer', 'Date', 'Items', 'Total', 'Payment', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sales.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">No sales yet. Create your first sale.</td></tr>
              )}
              {sales.map(sale => (
                <tr key={sale.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5 font-mono font-semibold text-primary">{sale.saleNumber}</td>
                  <td className="px-5 py-3.5">{sale.customer?.name ?? <span className="text-muted-foreground">Walk-in</span>}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {new Date(sale.soldAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{sale.items.length} item{sale.items.length !== 1 ? 's' : ''}</td>
                  <td className="px-5 py-3.5 font-medium">₹{Number(sale.total).toLocaleString('en-IN')}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{sale.paymentMode}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[sale.status]}`}>
                      {sale.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <Link href={`/owner/sales/${sale.id}`} className="text-primary hover:underline text-xs font-medium">View</Link>
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
