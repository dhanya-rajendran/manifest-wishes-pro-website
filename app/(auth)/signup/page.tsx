"use client"
import { useState } from 'react'
import Navbar from '../../../components/navbar'
import { Button } from '../../../components/ui/button'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })
      if (!res.ok) throw new Error('Signup failed')
      window.location.href = '/login'
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-2xl font-bold">Create account</h1>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div>
            <label className="text-sm">Name</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm">Email</label>
            <input
              type="email"
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm">Password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>{loading ? 'Loading...' : 'Sign up'}</Button>
            <a className="text-sm underline" href="/login">Already have an account?</a>
          </div>
        </form>
      </main>
    </div>
  )
}