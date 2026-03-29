import Navbar from '@/components/Navbar'
import NewServiceForm from './NewServiceForm'

export default function NewServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <NewServiceForm />
    </div>
  )
}
