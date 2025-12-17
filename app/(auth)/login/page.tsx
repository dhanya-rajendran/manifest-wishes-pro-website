"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '../../../components/navbar'
import { Button } from '../../../components/ui/button'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Invalid credentials')
      }
      router.replace('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-2xl font-bold">Login</h1>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          {error && <p className="text-red-600 text-sm">{error}</p>}
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
            <Button type="submit" disabled={loading}>{loading ? 'Loading...' : 'Login'}</Button>
            <a className="text-sm underline" href="/signup">Create account</a>
          </div>
        </form>
      </main>
    </div>
  )
}