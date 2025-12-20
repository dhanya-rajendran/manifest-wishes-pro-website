import DashboardOverview from '@/components/dashboard/overview'

export default function DashboardPage() {
  return (
    <div className="grid gap-8">
      {/* Charts and stats only */}
      <DashboardOverview />
    </div>
  )
}