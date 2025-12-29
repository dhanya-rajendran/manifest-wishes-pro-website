"use client"
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import Navbar from '../../../components/navbar'
import { Button } from '../../../components/ui/button'
import { PhoneInput } from '@/components/ui/base-phone-input'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '../../../components/ui/select'
import { Card, CardContent } from '../../../components/ui/card'
import { GradientBackground } from '@/components/ui/gradient-background'
import { Sparkles, Target, NotebookPen, Star, Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'

export default function SignupPage() {
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  type SignupValues = {
    name: string
    phone?: string
    email: string
    password: string
    gender?: string
  }

  const form = useForm<SignupValues>({
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      password: '',
      gender: '',
    },
    mode: 'onBlur',
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    setError('')
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
        credentials: 'include',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Signup failed')
      }
      window.location.href = '/login'
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="grid lg:grid-cols-2 min-h-[calc(100vh-64px)]">
        {/* Left: Dark gradient hero */}
        <div className="relative hidden lg:block overflow-hidden">
          <GradientBackground
            className="absolute inset-0 from-slate-900 via-purple-900 to-slate-950"
            transition={{ duration: 15, ease: 'easeInOut', repeat: Infinity }}
          />
          <div className="relative z-10 flex h-full items-center justify-center px-10">
            <div className="max-w-xl space-y-6">
              <h1 className="text-4xl font-extrabold tracking-tight text-white">
                Join the journey
              </h1>
              <p className="text-lg text-white/80">
                Create your account to start visualizing goals, cultivating gratitude, and building routines that last.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white"><Target className="h-5 w-5" /></span>
                  <div>
                    <h3 className="font-semibold text-white">Direction</h3>
                    <p className="text-sm text-white/80">Set intentions and track progress clearly.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white"><NotebookPen className="h-5 w-5" /></span>
                  <div>
                    <h3 className="font-semibold text-white">Reflection</h3>
                    <p className="text-sm text-white/80">Gratitude prompts that keep you grounded.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white"><Sparkles className="h-5 w-5" /></span>
                  <div>
                    <h3 className="font-semibold text-white">Energy</h3>
                    <p className="text-sm text-white/80">Build momentum with simple routines.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white"><Star className="h-5 w-5" /></span>
                  <div>
                    <h3 className="font-semibold text-white">Focus</h3>
                    <p className="text-sm text-white/80">A space designed for deep work.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Modern signup form */}
        <div className="flex items-center justify-center px-6 py-12">
          <Card className="w-full max-w-md border bg-card shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Create account</h2>
                <p className="text-sm text-muted-foreground">Start your practice in minutes</p>
              </div>

              {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

              <Form {...form}>
                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  <FormField
                    control={form.control}
                    name="name"
                    rules={{ required: 'Name is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Name</FormLabel>
                        <FormControl>
                          <input
                            className="mt-1 w-full rounded-lg border bg-background/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Your name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Phone</FormLabel>
                        <FormControl>
                          <div className="mt-1">
                            <PhoneInput
                              placeholder="Enter phone number"
                              value={field.value || ''}
                              onChange={(v) => field.onChange((v as string) || '')}
                              className="w-full"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    rules={{ required: 'Email is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Email</FormLabel>
                        <FormControl>
                          <input
                            type="email"
                            className="mt-1 w-full rounded-lg border bg-background/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="you@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    rules={{ required: 'Password is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Password</FormLabel>
                        <FormControl>
                          <div className="mt-1 relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              className="w-full rounded-lg border bg-background/50 px-3 py-2 pr-10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              placeholder="••••••••"
                              {...field}
                            />
                            <button
                              type="button"
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                              onClick={() => setShowPassword((s) => !s)}
                              className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Gender</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="non_binary">Non-binary</SelectItem>
                              <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Loading…' : 'Sign up'}
                  </Button>

                <p className="text-xs text-muted-foreground">
                  By signing up, you agree to our <a href="/terms" className="underline underline-offset-4">Terms</a> and <a href="/privacy" className="underline underline-offset-4">Privacy</a>.
                </p>
                <div className="flex items-center justify-center">
                  <a className="text-sm underline underline-offset-4" href="/login">Already have an account? Sign in</a>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Button type="button" variant="outline" aria-label="Continue with Google" className="w-full bg-white text-foreground border hover:bg-gray-100 justify-center gap-2" onClick={() => {
                    window.location.href = '/api/auth/oauth/google'
                  }}>
                    <Image src="/google-color.svg" alt="Google" width={16} height={16} />
                    Continue with Google
                  </Button>
                  <Button type="button" variant="outline" aria-label="Continue with Facebook" className="w-full bg-white text-foreground border hover:bg-gray-100 justify-center gap-2" onClick={() => {
                    window.location.href = '/api/auth/oauth/facebook'
                  }}>
                    <Image src="/facebook.svg" alt="Facebook" width={16} height={16} />
                    Continue with Facebook
                  </Button>
                </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}