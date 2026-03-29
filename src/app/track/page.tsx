import TrackForm from './TrackForm'

export default function TrackPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-foreground">Rishika Computers</p>
          <p className="text-xs text-muted-foreground">Dilsukh Nagar, Hyderabad</p>
        </div>
      </header>
      <TrackForm />
    </div>
  )
}
