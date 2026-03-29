import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-server'
import Navbar from '@/components/Navbar'
import StaffClient from './StaffClient'

export default async function StaffPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  if (user.role !== 'OWNER') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <StaffClient />
    </div>
  )
}
