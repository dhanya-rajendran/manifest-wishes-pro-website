import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="grid gap-3">
      <p className="text-gray-600">Select a section to get started:</p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Link href="/dashboard/tasks" className="rounded-lg border p-6 hover:bg-gray-50">
          <div className="text-lg font-semibold">Tasks</div>
          <div className="text-sm text-gray-600">Manage tasks and track progress</div>
        </Link>
        <Link href="/dashboard/gratitude" className="rounded-lg border p-6 hover:bg-gray-50">
          <div className="text-lg font-semibold">Gratitude</div>
          <div className="text-sm text-gray-600">Reflect and save weekly gratitude</div>
        </Link>
        <Link href="/dashboard/vision" className="rounded-lg border p-6 hover:bg-gray-50">
          <div className="text-lg font-semibold">Vision Board</div>
          <div className="text-sm text-gray-600">Create visual goals and inspirations</div>
        </Link>
        <Link href="/dashboard/method-369" className="rounded-lg border p-6 hover:bg-gray-50">
          <div className="text-lg font-semibold">369 Method</div>
          <div className="text-sm text-gray-600">Affirmations in 3/6/9 pattern</div>
        </Link>
        <Link href="/dashboard/focus-timer" className="rounded-lg border p-6 hover:bg-gray-50">
          <div className="text-lg font-semibold">Focus Timer</div>
          <div className="text-sm text-gray-600">Run and log focused sessions</div>
        </Link>
      </div>
    </div>
  )
}