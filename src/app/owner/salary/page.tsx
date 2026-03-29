import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-server'
import Navbar from '@/components/Navbar'
import SalaryClient from './SalaryClient'

export default async function SalaryPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  if (user.role !== 'OWNER') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <SalaryClient />
    </div>
  )
}
