import Navbar from '../../components/navbar'

export default function ContactPage() {
  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold">Contact</h1>
        <p className="mt-2 text-gray-600">We’d love to hear from you. Send us a message.</p>
        <form action="/api/contact" method="POST" className="mt-6 space-y-4">
          <div>
            <label className="text-sm">Name</label>
            <input name="name" className="mt-1 w-full rounded-md border px-3 py-2" required />
          </div>
          <div>
            <label className="text-sm">Email</label>
            <input type="email" name="email" className="mt-1 w-full rounded-md border px-3 py-2" required />
          </div>
          <div>
            <label className="text-sm">Message</label>
            <textarea name="message" className="mt-1 w-full rounded-md border px-3 py-2" rows={6} required />
          </div>
          <button className="rounded-md bg-brand px-4 py-2 text-white">Send</button>
        </form>
      </main>
    </div>
  )
}