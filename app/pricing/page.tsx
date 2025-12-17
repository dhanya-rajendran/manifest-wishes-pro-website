import Navbar from '../../components/navbar'

export default function PricingPage() {
  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold">Pricing</h1>
        <p className="mt-2 text-gray-600">Simple plans to match your flow.</p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border p-6">
            <h3 className="font-semibold">Free</h3>
            <p className="text-sm text-gray-600 mt-2">Basic boards and journal.</p>
            <p className="mt-4 text-2xl font-bold">$0</p>
          </div>
          <div className="rounded-lg border p-6">
            <h3 className="font-semibold">Pro</h3>
            <p className="text-sm text-gray-600 mt-2">Unlimited boards, sync, and reminders.</p>
            <p className="mt-4 text-2xl font-bold">$8 / mo</p>
          </div>
          <div className="rounded-lg border p-6">
            <h3 className="font-semibold">Team</h3>
            <p className="text-sm text-gray-600 mt-2">Share boards with collaborators.</p>
            <p className="mt-4 text-2xl font-bold">$20 / mo</p>
          </div>
        </div>
      </main>
    </div>
  )
}