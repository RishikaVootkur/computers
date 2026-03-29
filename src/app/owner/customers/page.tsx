import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAuthUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import { Users, Phone, ArrowRight } from 'lucide-react'

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  if (user.role !== 'OWNER') redirect('/dashboard')

  const { q } = await searchParams

  const customers = await prisma.customer.findMany({
    where: {
      shopId: user.shopId,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    },
    include: {
      _count: { select: { serviceJobs: true } },
      serviceJobs: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { createdAt: true, status: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const activeCustomers = await prisma.customer.count({ where: { shopId: user.shopId } })

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="px-4 sm:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-foreground">Customers</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{activeCustomers} total customers</p>
          </div>
        </div>

        {/* Search */}
        <form method="GET" className="mb-6">
          <div className="relative max-w-sm">
            <input
              type="text"
              name="q"
              defaultValue={q ?? ''}
              placeholder="Search by name or phone…"
              className="w-full px-4 py-2.5 rounded-xl border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring shadow-sm"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary"
            >
              Search
            </button>
          </div>
        </form>

        {customers.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl text-center py-20 shadow-sm">
            <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-medium text-foreground">
              {q ? 'No customers found for that search.' : 'No customers yet.'}
            </p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {['Customer', 'Phone', 'Total Jobs', 'Last Visit', ''].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {customers.map((c) => {
                    const lastJob = c.serviceJobs[0]
                    return (
                      <tr key={c.id} className="hover:bg-muted/20 transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {c.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-foreground">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Phone className="w-3.5 h-3.5" /> {c.phone}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-semibold text-foreground">{c._count.serviceJobs}</span>
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground whitespace-nowrap">
                          {lastJob
                            ? new Date(lastJob.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—'}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/service/customer/${c.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                          >
                            View jobs <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
