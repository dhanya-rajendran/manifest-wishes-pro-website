import Navbar from '../components/navbar'
import Footer from '../components/footer'
import { Button } from '../components/ui/button'
import { Sparkles, Target, NotebookPen, Star } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-fuchsia-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-16">
        <section className="grid gap-10 md:grid-cols-2 items-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
              Manifest a more <span className="bg-gradient-to-tr from-purple-600 to-fuchsia-600 bg-clip-text text-transparent">intentional</span> life.
            </h1>
            <p className="mt-5 text-lg text-gray-700">
              Visualize goals, journal gratitude, and build habits — beautifully synced with your Chrome extension.
            </p>
            <div className="mt-8 flex gap-4">
              <Button className="px-5 py-3">Get Started</Button>
              <Button variant="secondary" className="px-5 py-3">Learn More</Button>
            </div>
          </div>
          <div className="aspect-video w-full rounded-2xl border bg-white shadow-sm flex items-center justify-center">
            <span className="text-gray-500">Hero image (configurable)</span>
          </div>
        </section>

        <section className="mt-20 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="font-semibold">Vision Boards</h3>
            <p className="text-sm text-gray-600 mt-2">Organize images and notes that inspire you.</p>
          </div>
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="font-semibold">Gratitude Journal</h3>
            <p className="text-sm text-gray-600 mt-2">Capture daily moments of appreciation.</p>
          </div>
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="font-semibold">Tasks & Habits</h3>
            <p className="text-sm text-gray-600 mt-2">Stay on track with simple routines.</p>
          </div>
        </section>

        <section className="mt-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold">Why Manifest Wishes Pro</h2>
            <p className="mt-3 text-gray-700">A focused, delightful space designed to help you show up for your goals—consistently.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-700"><Target className="h-4 w-4" /></span>
                <h3 className="font-semibold">Clarity</h3>
              </div>
              <p className="mt-2 text-sm text-gray-600">Define intentions with vision boards and track progress without distractions.</p>
            </div>
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-fuchsia-100 text-fuchsia-700"><NotebookPen className="h-4 w-4" /></span>
                <h3 className="font-semibold">Reflection</h3>
              </div>
              <p className="mt-2 text-sm text-gray-600">Build gratitude with quick journaling to stay motivated and present.</p>
            </div>
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-700"><Sparkles className="h-4 w-4" /></span>
                <h3 className="font-semibold">Momentum</h3>
              </div>
              <p className="mt-2 text-sm text-gray-600">Simple habits and tasks that build up into long-term results.</p>
            </div>
          </div>
        </section>

        <section className="mt-24 rounded-3xl border bg-white p-8 shadow-sm">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold">Manifestation Stories</h2>
            <p className="mt-3 text-gray-700">Real people, real changes. A few words from our community.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-1 text-yellow-500"><Star className="h-4 w-4" /><Star className="h-4 w-4" /><Star className="h-4 w-4" /><Star className="h-4 w-4" /><Star className="h-4 w-4" /></div>
              <p className="mt-3 text-sm text-gray-700">“I finally stay consistent. The gratitude check-ins keep me grounded and the vision board keeps me inspired.”</p>
              <p className="mt-4 text-sm font-medium">Aisha — Product Designer</p>
            </div>
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-1 text-yellow-500"><Star className="h-4 w-4" /><Star className="h-4 w-4" /><Star className="h-4 w-4" /><Star className="h-4 w-4" /><Star className="h-4 w-4" /></div>
              <p className="mt-3 text-sm text-gray-700">“The habit tracker is simple enough that I actually use it daily. Small wins add up.”</p>
              <p className="mt-4 text-sm font-medium">Marco — Fitness Coach</p>
            </div>
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-1 text-yellow-500"><Star className="h-4 w-4" /><Star className="h-4 w-4" /><Star className="h-4 w-4" /><Star className="h-4 w-4" /><Star className="h-4 w-4" /></div>
              <p className="mt-3 text-sm text-gray-700">“My goals feel tangible now. It’s the first tool I open each morning.”</p>
              <p className="mt-4 text-sm font-medium">Priya — Startup Founder</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}