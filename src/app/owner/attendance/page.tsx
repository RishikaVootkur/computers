import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-server'
import Navbar from '@/components/Navbar'
import AttendanceClient from './AttendanceClient'

export default async function AttendancePage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  if (user.role !== 'OWNER') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <AttendanceClient />
    </div>
  )
}
